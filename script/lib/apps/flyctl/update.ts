#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net --allow-read --allow-write --allow-run

import { $, invariant } from "../../mod.ts";
import { pamkit } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

const [meta] = await pamkit.getInstallerMetas(new Set([$.$dirname(import.meta.url, true)]));

if (await $.commandExists("flyctl")) {
  if ($.env.OS /* TODO: refactor to os helpers */ === "darwin") {
    $.logGroup(() => {
      $.logWarn(
        "warn:",
        $.dedent`
    			installation is managed; skipping manual update

    		`,
      );
    });
  } else {
    const releaseInfoPath = $.path.join(dotAppPath, pamkit.constants.jsonReleaseInfoName);
    const artifactPath = $.path.join(dotAppPath, "flyctl.tar.gz");
    const binaryPath = $.path.join(dotAppPath, "flyctl");

    const releaseInfo = await $.ghReleaseInfo("superfly", "flyctl");
    await Deno.writeTextFile(releaseInfoPath, JSON.stringify(releaseInfo, null, 2));

    const { assets, tag_name } = releaseInfo;
    const latestVersion = tag_name.split("v")?.at(1) ?? "0.0.0";

    const targetName = `flyctl_${latestVersion}_Linux_x86_64.tar.gz`;

    const targetAsset = assets.find((a) => a.name === targetName);

    invariant(typeof targetAsset !== "undefined", "no suitable installation target found");

    await $.streamDownload(targetAsset.browser_download_url, artifactPath);
    await $`tar -C ${dotAppPath} -xzf ${artifactPath}`;
    await pamkit.linkBinaryToUserPath(binaryPath, "flyctl");

    meta.lastCheck = Date.now();
  }
}

const versionOutput = await $`flyctl version`.text(); // flyctl v0.0.442 linux/amd64 Commit: e5a70d79 BuildDate: 2022-12-30T17:22:44Z
const version = versionOutput.split(" ")?.at(1)?.split("v")?.at(1) ?? "";

meta.version = version;

const metaManifestPath = $.path.join(dotAppPath, pamkit.constants.metaManifestName);
await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
