#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net=deno.land,github.com,api.github.com,objects.githubusercontent.com --allow-read --allow-write --allow-run

import { $, $dirname, env, invariant } from "../../mod.ts";
import {
  constants,
  ghReleaseLatestInfo,
  InstallerMeta,
  linkBinaryToUserPath,
  streamDownload,
} from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($dirname(import.meta.url), constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

const notInstalled = typeof (await $.which("cheat")) === "undefined";
if (notInstalled) {
  if (env.OS === "darwin") {
    await $`brew install cheat`.env({ HOMEBREW_NO_ANALYTICS: "1" });
  } else {
    const releaseInfoPath = $.path.join(dotAppPath, constants.jsonReleaseInfoName);
    const assetDownloadPath = $.path.join(dotAppPath, "cheat.gz");
    const binaryPath = $.path.join(dotAppPath, "cheat");

    const releaseInfo = await ghReleaseLatestInfo("cheat", "cheat");
    await Deno.writeTextFile(releaseInfoPath, JSON.stringify(releaseInfo, null, 2));

    const { assets } = releaseInfo;
    const targetName = `cheat-linux-amd64.gz`;
    const targetAsset = assets.find((a) => a.name === targetName);

    invariant(typeof targetAsset !== "undefined", "no suitable installation target found");

    await streamDownload(targetAsset.browser_download_url, assetDownloadPath);

    await $`gzip -f -d ${assetDownloadPath}`;
    await $`chmod +x ${binaryPath}`;
    await linkBinaryToUserPath(binaryPath, "cheat");

    const communityCheatPath = $.path.join(
      env.STANDARD_DIRS.DOT_DOTS_APPS,
      "cheat",
      "cheatsheets",
      "community",
    );
    if (!(await $.exists(communityCheatPath))) {
      await $`git clone https://github.com/cheat/cheatsheets.git ${communityCheatPath}`;
    }
  }
}

const version = await $`cheat --version`.text(); // 4.4.0

const meta: InstallerMeta = {
  name: $dirname(import.meta.url, true),
  path: $dirname(import.meta.url),
  type: env.OS === "darwin" ? "installed-managed" : "installed-manual",
  version,
  lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
