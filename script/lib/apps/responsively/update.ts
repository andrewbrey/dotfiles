#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net --allow-read --allow-write --allow-run

import { $, invariant } from "../../mod.ts";
import { pamkit } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

const [meta] = await pamkit.getInstallerMetas(new Set([$.$dirname(import.meta.url, true)]));

if (await $.commandExists("responsively")) {
  if ($.env.OS === "darwin") {
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
    const binPath = $.path.join(dotAppPath, "responsively.AppImage");

    const releaseInfo = await $.ghReleaseInfo("responsively-org", "responsively-app");
    await Deno.writeTextFile(releaseInfoPath, JSON.stringify(releaseInfo, null, 2));

    const { assets, tag_name } = releaseInfo;
    const latestVersion = tag_name.split("v")?.at(1) ?? "0.0.0";
    const targetName = `ResponsivelyApp-${latestVersion}.AppImage`;
    const targetAsset = assets.find((a) => a.name === targetName);

    invariant(typeof targetAsset !== "undefined", "no suitable installation target found");

    await $.streamDownload(targetAsset.browser_download_url, binPath);

    await pamkit.linkBinaryToUserPath(binPath, "responsively");
    await pamkit.linkDesktopFileForApp("responsively");

    meta.version = latestVersion;
    meta.lastCheck = Date.now();
  }
}

const metaManifestPath = $.path.join(dotAppPath, pamkit.constants.metaManifestName);
await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
