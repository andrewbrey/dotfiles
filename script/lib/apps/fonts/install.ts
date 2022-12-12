#!/usr/bin/env -S deno run --allow-env --allow-net=deno.land,api.github.com,github.com,objects.githubusercontent.com --allow-read --allow-write --allow-run

import { $, $dirname, env, getChezmoiData, invariant, osInvariant } from "../../mod.ts";
import {
  constants,
  getInstallerMetas,
  ghReleaseLatestInfo,
  streamDownload,
} from "../_cli/pamkit.ts";

osInvariant();

const dotAppPath = $.path.join($dirname(import.meta.url), constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

const jetbrains = env.OS === "darwin" ? "font-jetbrains-mono-nerd-font" : "JetBrainsMono";
const droid = env.OS === "darwin" ? "font-droid-sans-mono-nerd-font" : "DroidSansMono";
const hack = env.OS === "darwin" ? "font-hack-nerd-font" : "Hack";
const iosevka = env.OS === "darwin" ? "font-iosevka-nerd-font" : "Iosevka";

const chezmoiData = await getChezmoiData();

const fonts = chezmoiData.is_containerized ? [droid] : [jetbrains, droid, hack, iosevka];

const [meta] = await getInstallerMetas(new Set([$dirname(import.meta.url, true)]));
if (meta.type === "uninstalled") {
  if (env.OS === "darwin") {
    await $`brew tap homebrew/cask-fonts`.env({ HOMEBREW_NO_ANALYTICS: "1" });
    await $`brew install --cask ${fonts}`.env({ HOMEBREW_NO_ANALYTICS: "1" });
  } else {
    const releaseInfoPath = $.path.join(dotAppPath, constants.ghReleaseInfoName);

    const releaseInfo = await ghReleaseLatestInfo("ryanoasis", "nerd-fonts");
    await Deno.writeTextFile(releaseInfoPath, JSON.stringify(releaseInfo, null, 2));

    const { assets, tag_name } = releaseInfo;
    meta.version = tag_name.split("v")?.at(1) ?? "0.0.0";

    const fontsDirPath = $.path.join(env.HOME, ".local", "share", "fonts");
    await $.fs.ensureDir(fontsDirPath);

    for (const fontName of fonts) {
      const targetName = `${fontName}.zip`;
      const targetAsset = assets.find((a) => a.name === targetName);

      invariant(typeof targetAsset !== "undefined", "no suitable download target found");

      const archivePath = $.path.join(dotAppPath, targetName);

      await streamDownload(targetAsset.browser_download_url, archivePath);
      await $`unzip -o ${archivePath} -d ${fontsDirPath}`;
    }

    await $`fc-cache -vr`;
    await $`sudo fc-cache -vr`;
  }
}

meta.type = env.OS === "darwin" ? "installed-managed" : "installed-manual";
meta.lastCheck = Date.now();

const metaManifestPath = $.path.join(dotAppPath, constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));