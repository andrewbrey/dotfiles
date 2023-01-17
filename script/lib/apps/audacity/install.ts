#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net --allow-read --allow-write --allow-run

import { $, invariant } from "../../mod.ts";
import { type InstallerMeta, pamkit } from "../_cli/pamkit.ts";

let version = "";
const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

if (await $.commandMissing("audacity")) {
  if ($.env.OS === "darwin") {
    await $`brew install --cask audacity`.env({ HOMEBREW_NO_ANALYTICS: "1" });
  } else {
    const releaseInfoPath = $.path.join(dotAppPath, pamkit.constants.jsonReleaseInfoName);
    const binPath = $.path.join(dotAppPath, "audacity.AppImage");

    const releaseInfo = await $.ghReleaseInfo("audacity", "audacity");
    await Deno.writeTextFile(releaseInfoPath, JSON.stringify(releaseInfo, null, 2));

    const { assets, tag_name } = releaseInfo;
    const latestVersion = tag_name.split("-")?.at(1) ?? "0.0.0";
    const targetName = `audacity-linux-${latestVersion}-x64.AppImage`;
    const targetAsset = assets.find((a) => a.name === targetName);

    invariant(typeof targetAsset !== "undefined", "no suitable installation target found");

    await $.streamDownload(targetAsset.browser_download_url, binPath);

    await pamkit.linkBinaryToUserPath(binPath, "audacity");
    await pamkit.linkDesktopFileForApp("audacity");

    version = latestVersion;
  }
}

const meta: InstallerMeta = {
  name: $.$dirname(import.meta.url, true),
  path: $.$dirname(import.meta.url),
  type: $.env.OS === "darwin" ? "installed-managed" : "installed-manual",
  version,
  lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, pamkit.constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
