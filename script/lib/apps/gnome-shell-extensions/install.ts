#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net --allow-read --allow-write --allow-run

import { $, invariant } from "../../mod.ts";
import { type InstallerMeta, pamkit } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);
const sourceDir = $.path.join(dotAppPath, pamkit.constants.sourceDir);
const dotResPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appResourcesDir);
await $.fs.ensureDir(dotAppPath);
await $.fs.ensureDir(sourceDir);

const chezmoiData = await $.getChezmoiData();
if (!chezmoiData.is_containerized && (chezmoiData.is_popos || chezmoiData.is_ubuntu)) {
  await $.requireCommand("dconf");
  await $.requireCommand("gnome-shell");
  await $.requireCommand("gnome-extensions");

  type GnomeExtensionMeta = {
    name: string;
    metaPath: string;
    manifest: { dconf: string; url?: string };
  };

  const extDir = $.path.join(dotResPath, ".extensions");
  const extMetas: GnomeExtensionMeta[] = [];

  for await (const d of Deno.readDir(extDir)) {
    if (d.isDirectory) {
      const manifest = JSON.parse(
        await Deno.readTextFile($.path.join(extDir, d.name, "ext.json")),
      ) as GnomeExtensionMeta["manifest"];

      const meta: GnomeExtensionMeta = {
        name: d.name,
        metaPath: $.path.join(extDir, d.name),
        manifest,
      };

      extMetas.push(meta);
    }
  }

  const fullGnomeVersion = await $`gnome-shell --version`.stderr("null").text(); // GNOME Shell 3.38.4 (or GNOME Shell 40.5)
  const gnomeVersion = fullGnomeVersion.split(" ")?.at(2)?.split(".")?.slice(0, 2)?.join(".") ?? ""; // 3.38 or 40.5

  invariant(gnomeVersion.length > 0, "unable to determine gnome version");
  invariant(gnomeVersion.match(/^\d+\.\d+$/), "gnome version was invalid");

  const noViableVersionFound: string[] = [];
  for (const ext of extMetas) {
    const { url, dconf } = ext.manifest;

    invariant(typeof dconf === "string" && dconf.length > 0, "invalid dconf path");

    if (typeof url === "string" && url.length > 0) {
      await $.runInBrowser(async (page) => {
        try {
          const shellVersionSelector = "select.shell-version";
          const extensionVersionSelector = "select.extension-version";

          page.on("console", console.log);
          await page.goto(url, { waitUntil: "networkidle2" });
          await page.waitForFunction(
            // @ts-expect-error function runs in the context of the browser
            (selector) => document.querySelectorAll(selector).length > 1,
            { timeout: 2000 },
            `${shellVersionSelector} option`,
          );

          if (parseInt(gnomeVersion) >= 40) {
            const zeroMinorVersion = `${gnomeVersion.split(".")[0]}.0`; // e.g. 42.0
            const noMinorVersion = gnomeVersion.split(".")[0]; // e.g. 40

            const fullOpt = await page.$(`${shellVersionSelector} option[value="${gnomeVersion}"]`);
            const zeroOpt = await page.$(
              `${shellVersionSelector} option[value="${zeroMinorVersion}"]`,
            );
            const bareOpt = await page.$(
              `${shellVersionSelector} option[value="${noMinorVersion}"]`,
            );

            const foundOpt = fullOpt
              ? gnomeVersion // e.g. 42.4
              : zeroOpt
              ? zeroMinorVersion // e.g. 42.0
              : bareOpt
              ? noMinorVersion // e.g. 42
              : null;

            invariant(typeof foundOpt === "string" && foundOpt.length, "no shell version found");

            await page.select(shellVersionSelector, foundOpt);
          } else {
            await page.select(shellVersionSelector, gnomeVersion);
          }

          await page.waitForFunction(
            // @ts-expect-error function runs in the context of the browser
            (selector) => document.querySelectorAll(selector).length > 1,
            { timeout: 2000 },
            `${extensionVersionSelector} option`,
          );

          const latestExtension = await page.evaluate((selector) => {
            // @ts-expect-error function runs in the context of the browser
            const latestOption: any = Array.from(document.querySelectorAll(selector))
              .filter((n: any) => !n.value.includes("Extension version"))
              .at(-1);

            return latestOption.value as string;
          }, `${extensionVersionSelector} option`);

          invariant(
            typeof latestExtension === "string" && latestExtension.length,
            "no extension version found",
          );

          const downloadPath = $.path.join(sourceDir, ".download");
          await $.fs.emptyDir(downloadPath);
          await page._client().send("Page.setDownloadBehavior", {
            behavior: "allow",
            downloadPath,
          });

          await Promise.all([
            // "wait for download" promise
            new Promise<void>((resolve, reject) => {
              page._client().on("Page.downloadProgress", (e) => {
                if (e.state === "completed") {
                  resolve();
                } else if (e.state === "canceled") {
                  reject();
                }
              });
            }),
            page.select(extensionVersionSelector, latestExtension),
          ]);

          const zip = $.path.join(sourceDir, `${ext.name}.zip`);
          for await (const file of $.fs.expandGlob($.path.join(downloadPath, "*.zip"))) {
            await $.fs.move(file.path, zip, { overwrite: true });
          }

          await $`gnome-extensions install --force ${zip}`;
        } catch (error) {
          const { message } = error as Error;

          if (
            message.includes("no shell version found") ||
            message.includes("no extension version found")
          ) {
            noViableVersionFound.push(ext.name);
          } else {
            throw error;
          }
        }
      });
    }

    const settingsPath = $.path.join(ext.metaPath, "settings.dconf");
    if (await $.exists(settingsPath)) {
      const settings = await Deno.readTextFile(settingsPath);
      await $`dconf load ${dconf}`.stdinText(settings);
    }
  }

  if (noViableVersionFound.length) {
    const lister = new Intl.ListFormat(undefined, { type: "conjunction", style: "short" });
    $.logError(
      "error:",
      `failed to find viable versions of ${
        lister.format(noViableVersionFound.map((e) => $.colors.yellow(e)))
      }`,
    );

    Deno.exit(1);
  }
}

const meta: InstallerMeta = {
  name: $.$dirname(import.meta.url, true),
  path: $.$dirname(import.meta.url),
  type: "installed-managed",
  version: "",
  lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, pamkit.constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
