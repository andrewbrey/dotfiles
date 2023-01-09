#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net --allow-read --allow-write --allow-run

import { $, $dirname, env, invariant } from "../../mod.ts";
import {
  constants,
  getInstallerMetas,
  ghReleaseLatestInfo,
  streamDownload,
} from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($dirname(import.meta.url), constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

const [meta] = await getInstallerMetas(new Set([$dirname(import.meta.url, true)]));

const installed = typeof (await $.which("nvim")) !== "undefined";
if (installed) {
  if (env.OS === "darwin") {
    $.logGroup(() => {
      $.logWarn(
        "warn:",
        $.dedent`
    			installation is managed; skipping manual update

    		`,
      );
    });
  } else {
    const releaseInfoPath = $.path.join(dotAppPath, constants.jsonReleaseInfoName);
    const debInstallerPath = $.path.join(dotAppPath, "nvim.deb");

    const releaseInfo = await ghReleaseLatestInfo("neovim", "neovim");
    await Deno.writeTextFile(releaseInfoPath, JSON.stringify(releaseInfo, null, 2));

    const { assets } = releaseInfo;
    const targetName = `nvim-linux64.deb`;
    const targetAsset = assets.find((a) => a.name === targetName);

    invariant(typeof targetAsset !== "undefined", "no suitable installation target found");

    await streamDownload(targetAsset.browser_download_url, debInstallerPath);

    await $`sudo apt install -y ${debInstallerPath}`;

    meta.lastCheck = Date.now();
  }
}

const versionOutput = await $`nvim --version`.lines(); // NVIM v0.8.2\n...
const version = versionOutput?.at(0)?.split(" ")?.at(1)?.split("v")?.at(1) ?? "";

meta.version = version;

const metaManifestPath = $.path.join(dotAppPath, constants.metaManifestName);
await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
