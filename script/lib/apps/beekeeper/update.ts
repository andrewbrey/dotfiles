#!/usr/bin/env -S deno run --allow-env --allow-net --allow-read --allow-write --allow-run

import { $, $dirname, dedent, env, invariant, osInvariant } from "../../mod.ts";
import {
  constants,
  getInstallerMetas,
  ghReleaseLatestInfo,
  linkBinaryToUserPath,
  linkDesktopFileForApp,
  streamDownload,
} from "../_cli/pamkit.ts";

osInvariant();

const dotAppPath = $.path.join($dirname(import.meta.url), constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

const [meta] = await getInstallerMetas(new Set([$dirname(import.meta.url, true)]));

const installed = typeof (await $.which("beekeeper-studio")) !== "undefined";
if (installed) {
  if (env.OS === "darwin") {
    $.logGroup(() => {
      $.logWarn(
        "warn:",
        dedent(`
    			installation is managed; skipping manual update

    		`),
      );
    });
  } else {
    const releaseInfoPath = $.path.join(dotAppPath, constants.ghReleaseInfoName);
    const binPath = $.path.join(dotAppPath, "beekeeper-studio.AppImage");

    const releaseInfo = await ghReleaseLatestInfo("beekeeper-studio", "beekeeper-studio");
    await Deno.writeTextFile(releaseInfoPath, JSON.stringify(releaseInfo, null, 2));

    const { assets, tag_name } = releaseInfo;
    const latestVersion = tag_name.split("v")?.at(1) ?? "0.0.0";
    const targetName = `beekeeper-Studio-${latestVersion}.AppImage`;
    const targetAsset = assets.find((a) => a.name === targetName);

    invariant(typeof targetAsset !== "undefined", "no suitable installation target found");

    await streamDownload(targetAsset.browser_download_url, binPath);

    await linkBinaryToUserPath(binPath, "beekeeper-studio");
    await linkDesktopFileForApp("beekeeper-studio");

    meta.lastCheck = Date.now();
    meta.version = latestVersion;
  }
}

const metaManifestPath = $.path.join(dotAppPath, constants.metaManifestName);
await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
