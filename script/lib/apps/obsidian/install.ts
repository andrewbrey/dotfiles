#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net --allow-read --allow-write --allow-run

import { $, $dirname, env, invariant } from "../../mod.ts";
import {
  constants,
  ghReleaseLatestInfo,
  InstallerMeta,
  linkBinaryToUserPath,
  linkDesktopFileForApp,
  streamDownload,
} from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($dirname(import.meta.url), constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

let version = "";
const notInstalled = typeof (await $.which("obsidian")) === "undefined";
if (notInstalled) {
  if (env.OS === "darwin") {
    await $`brew install --cask obsidian`.env({ HOMEBREW_NO_ANALYTICS: "1" });
  } else {
    const releaseInfoPath = $.path.join(dotAppPath, constants.jsonReleaseInfoName);
    const binPath = $.path.join(dotAppPath, "obsidian.AppImage");

    const releaseInfo = await ghReleaseLatestInfo("obsidianmd", "obsidian-releases");
    await Deno.writeTextFile(releaseInfoPath, JSON.stringify(releaseInfo, null, 2));

    const { assets, tag_name } = releaseInfo;
    const latestVersion = tag_name.split("v")?.at(1) ?? "0.0.0";
    const targetName = `Obsidian-${latestVersion}.AppImage`;
    const targetAsset = assets.find((a) => a.name === targetName);

    invariant(typeof targetAsset !== "undefined", "no suitable installation target found");

    await streamDownload(targetAsset.browser_download_url, binPath);

    await linkBinaryToUserPath(binPath, "obsidian");
    await linkDesktopFileForApp("obsidian");

    version = latestVersion;
  }
}

const meta: InstallerMeta = {
  name: $dirname(import.meta.url, true),
  path: $dirname(import.meta.url),
  type: env.OS === "darwin" ? "installed-managed" : "installed-manual",
  version,
  lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
