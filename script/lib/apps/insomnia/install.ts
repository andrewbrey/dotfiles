#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net --allow-read --allow-write --allow-run

import { $, invariant } from "../../mod.ts";
import { type InstallerMeta, pamkit } from "../_cli/pamkit.ts";

let version = "";
const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

await $.onMac(async () => {
  if (await pamkit.brewAppMissing("insomnia")) {
    await $`brew install --cask insomnia`.env({ HOMEBREW_NO_ANALYTICS: "1" });
  }
});

await $.onLinux(async () => {
  if (await $.commandMissing("insomnia")) {
    const releaseInfoPath = $.path.join(dotAppPath, pamkit.constants.htmlReleaseInfoName);
    const binPath = $.path.join(dotAppPath, "insomnia.AppImage");

    await $.streamDownload("https://insomnia.rest/changelog", releaseInfoPath);
    const latestReleasePageText = await Deno.readTextFile(releaseInfoPath);
    const latestVersion = latestReleasePageText.match(/id="(\d+\.\d+\.\d+)"/)?.at(1) ?? ""; // id="2022.7.0"

    invariant(
      typeof latestVersion === "string" && latestVersion.length > 0,
      "invalid latest version",
    );

    const targetAsset =
      `https://github.com/Kong/insomnia/releases/download/core@${latestVersion}/Insomnia.Core-${latestVersion}.AppImage`;

    await $.streamDownload(targetAsset, binPath);
    await pamkit.linkBinaryToUserPath(binPath, "insomnia");
    await pamkit.linkDesktopFileForApp("insomnia");

    version = latestVersion;
  }
});

const meta: InstallerMeta = {
  name: $.$dirname(import.meta.url, true),
  path: $.$dirname(import.meta.url),
  type: $.env.OS === "darwin" ? "installed-managed" : "installed-manual",
  version,
  lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, pamkit.constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
