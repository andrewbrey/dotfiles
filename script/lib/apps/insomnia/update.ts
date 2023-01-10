#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net --allow-read --allow-write --allow-run

import { $, invariant } from "../../mod.ts";
import { constants, getInstallerMetas, linkBinaryToUserPath } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

const [meta] = await getInstallerMetas(new Set([$.$dirname(import.meta.url, true)]));

if (await $.commandExists("insomnia")) {
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
    const releaseInfoPath = $.path.join(dotAppPath, constants.htmlReleaseInfoName);
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
    await linkBinaryToUserPath(binPath, "insomnia");

    meta.version = latestVersion;
    meta.lastCheck = Date.now();
  }
}

const metaManifestPath = $.path.join(dotAppPath, constants.metaManifestName);
await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
