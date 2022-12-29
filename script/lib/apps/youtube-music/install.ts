#!/usr/bin/env -S deno run --allow-env --allow-net --allow-read --allow-write --allow-run

import { $, $dirname, env, invariant, osInvariant } from "../../mod.ts";
import {
  constants,
  ghReleaseLatestInfo,
  InstallerMeta,
  linkBinaryToUserPath,
  linkDesktopFileForApp,
  streamDownload,
} from "../_cli/pamkit.ts";

osInvariant();

const dotAppPath = $.path.join($dirname(import.meta.url), constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

let version = "";
const notInstalled = typeof (await $.which("youtube-music")) === "undefined";
if (notInstalled) {
  if (env.OS === "darwin") {
    const releaseInfoPath = $.path.join(dotAppPath, constants.ghReleaseInfoName);
    const binPath = $.path.join(dotAppPath, "youtube-music.AppImage");

    const releaseInfo = await ghReleaseLatestInfo("th-ch", "youtube-music");
    await Deno.writeTextFile(releaseInfoPath, JSON.stringify(releaseInfo, null, 2));

    const { assets, tag_name } = releaseInfo;
    const latestVersion = tag_name.split("v")?.at(1) ?? "0.0.0";
    const targetName = `YouTube-Music-${latestVersion}-arm64.dmg`;
    const targetAsset = assets.find((a) => a.name === targetName);

    invariant(typeof targetAsset !== "undefined", "no suitable installation target found");

    await streamDownload(targetAsset.browser_download_url, binPath);

    // TODO: https://apple.stackexchange.com/questions/73926/is-there-a-command-to-install-a-dmg
    if (Math.random()) throw new Error("TODO: install dmg from command line");

    version = latestVersion;
  } else {
    const releaseInfoPath = $.path.join(dotAppPath, constants.ghReleaseInfoName);
    const binPath = $.path.join(dotAppPath, "youtube-music.AppImage");

    const releaseInfo = await ghReleaseLatestInfo("th-ch", "youtube-music");
    await Deno.writeTextFile(releaseInfoPath, JSON.stringify(releaseInfo, null, 2));

    const { assets, tag_name } = releaseInfo;
    const latestVersion = tag_name.split("v")?.at(1) ?? "0.0.0";
    const targetName = `YouTube-Music-${latestVersion}.AppImage`;
    const targetAsset = assets.find((a) => a.name === targetName);

    invariant(typeof targetAsset !== "undefined", "no suitable installation target found");

    await streamDownload(targetAsset.browser_download_url, binPath);

    await linkBinaryToUserPath(binPath, "youtube-music");
    await linkDesktopFileForApp("youtube-music");

    version = latestVersion;
  }
}

const meta: InstallerMeta = {
  name: $.path.basename($dirname(import.meta.url)),
  path: $dirname(import.meta.url),
  type: "installed-manual",
  version,
  lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
