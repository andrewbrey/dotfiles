#!/usr/bin/env -S deno run --allow-env --allow-net=deno.land --allow-read --allow-write --allow-run

import { $, $dirname, env, getChezmoiData, invariant, osInvariant } from "../../mod.ts";
import { constants, InstallerMeta } from "../_cli/pamkit.ts";

osInvariant();

const dotAppPath = $.path.join($dirname(import.meta.url), constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

const chezmoiData = await getChezmoiData();
if (!chezmoiData.is_containerized && (chezmoiData.is_popos || chezmoiData.is_ubuntu)) {
  invariant(typeof (await $.which("dconf")) !== "undefined", "dconf is required");
  invariant(typeof (await $.which("gnome-shell")) !== "undefined", "gnome-shell is required");
  invariant(
    typeof (await $.which("gnome-extensions")) !== "undefined",
    "gnome-extensions is required",
  );
  type ConfOnlyManifest = { dconf: string; confOnly: boolean };
  type UrlManifest = { dconf: string; url: string };
  type GnomeExtensionMeta = {
    name: string;
    manifestPath: string;
    manifest: ConfOnlyManifest | UrlManifest;
  };

  const extDir = $.path.join(env.STANDARD_DIRS.DOT_DOTS_APPS, "gnome-shell-extensions");
  const extMetas: GnomeExtensionMeta[] = [];

  for await (const d of Deno.readDir(extDir)) {
    if (d.isDirectory) {
      const extJson = JSON.parse(
        await Deno.readTextFile($.path.join(extDir, d.name, "ext.json")),
      ) as GnomeExtensionMeta["manifest"];

      const meta: GnomeExtensionMeta = {
        name: d.name,
        manifestPath: $.path.join(extDir, d.name),
        manifest: ("url" in extJson)
          ? { dconf: extJson.dconf, url: extJson.url }
          : { dconf: extJson.dconf, confOnly: extJson.confOnly },
      };

      extMetas.push(meta);
    }
  }

  const fullGnomeVersion = await $`gnome-shell --version 2>/dev/null`.text(); // GNOME Shell 3.38.4 (or GNOME Shell 40.5)
  const gnomeVersion = fullGnomeVersion.split(" ")?.at(2)?.split(".")?.slice(0, 2)?.join(".") ?? ""; // 3.38 or 40.5

  invariant(gnomeVersion.length > 0, "unable to determine gnome version");

  // TODO: install extensions
}

const meta: InstallerMeta = {
  name: $.path.basename($dirname(import.meta.url)),
  path: $dirname(import.meta.url),
  type: "installed-managed",
  version: "",
  lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
