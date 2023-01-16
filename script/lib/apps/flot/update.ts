#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net --allow-read --allow-write --allow-run

import { $, invariant } from "../../mod.ts";
import { constants, getInstallerMetas } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

const [meta] = await getInstallerMetas(new Set([$.$dirname(import.meta.url, true)]));

if (await $.commandExists("flot")) {
  if ($.env.OS === "darwin") {
    const releaseInfoPath = $.path.join(dotAppPath, constants.jsonReleaseInfoName);
    const binPath = $.path.join(dotAppPath, "flot.dmg");

    const releaseInfo = await $.ghReleaseInfo("andrewbrey", "flot");
    await Deno.writeTextFile(releaseInfoPath, JSON.stringify(releaseInfo, null, 2));

    const { assets, tag_name } = releaseInfo;
    const latestVersion = tag_name.split("v")?.at(1) ?? "0.0.0";
    const targetName = `Flot.setup.${latestVersion}.dmg`;
    const targetAsset = assets.find((a) => a.name === targetName);

    invariant(typeof targetAsset !== "undefined", "no suitable installation target found");

    await $.streamDownload(targetAsset.browser_download_url, binPath);

    // TODO: https://apple.stackexchange.com/questions/73926/is-there-a-command-to-install-a-dmg
    if (Math.random()) throw new Error("TODO: install dmg from command line");

    meta.lastCheck = Date.now();
    meta.version = latestVersion;
  } else {
    const releaseInfoPath = $.path.join(dotAppPath, constants.jsonReleaseInfoName);
    const binPath = $.path.join(dotAppPath, "flot.AppImage");

    const releaseInfo = await $.ghReleaseInfo("andrewbrey", "flot");
    await Deno.writeTextFile(releaseInfoPath, JSON.stringify(releaseInfo, null, 2));

    const { assets, tag_name } = releaseInfo;
    const latestVersion = tag_name.split("v")?.at(1) ?? "0.0.0";
    const targetName = `Flot-${latestVersion}.AppImage`;
    const targetAsset = assets.find((a) => a.name === targetName);

    invariant(typeof targetAsset !== "undefined", "no suitable installation target found");

    await $.streamDownload(targetAsset.browser_download_url, binPath);

    meta.lastCheck = Date.now();
    meta.version = latestVersion;
  }
}

const metaManifestPath = $.path.join(dotAppPath, constants.metaManifestName);
await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
