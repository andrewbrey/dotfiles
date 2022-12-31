#!/usr/bin/env -S deno run --allow-env --allow-net --allow-read --allow-write --allow-run

import { $, $dirname, env, invariant, osInvariant } from "../../mod.ts";
import {
  constants,
  ghReleaseLatestInfo,
  InstallerMeta,
  linkBinaryToUserPath,
  streamDownload,
} from "../_cli/pamkit.ts";

osInvariant();

const dotAppPath = $.path.join($dirname(import.meta.url), constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

const notInstalled = typeof (await $.which("doggo")) === "undefined";
if (notInstalled) {
  if (env.OS === "darwin") {
    await $`brew install doggo`.env({ HOMEBREW_NO_ANALYTICS: "1" });
  } else {
    const releaseInfoPath = $.path.join(dotAppPath, constants.ghReleaseInfoName);
    const artifactPath = $.path.join(dotAppPath, "doggo.tar.gz");
    const binaryPath = $.path.join(dotAppPath, "doggo");

    const releaseInfo = await ghReleaseLatestInfo("mr-karan", "doggo");
    await Deno.writeTextFile(releaseInfoPath, JSON.stringify(releaseInfo, null, 2));

    const { assets, tag_name } = releaseInfo;
    const latestVersion = tag_name.split("v")?.at(1) ?? "0.0.0";
    const targetName = `doggo_${latestVersion}_linux_amd64.tar.gz`;
    const targetAsset = assets.find((a) => a.name === targetName);

    invariant(typeof targetAsset !== "undefined", "no suitable installation target found");

    await streamDownload(targetAsset.browser_download_url, artifactPath);
    await $`tar -C ${dotAppPath} -xzf ${artifactPath}`;
    await linkBinaryToUserPath(binaryPath, "doggo");
  }
}

const versionOutput = await $`doggo --version`.text(); // v0.5.4 (2cf9e7b 2022-07-13T11:37:54Z) - unknown
const version = versionOutput.split(" ")?.at(0)?.split("v")?.at(1) ?? "";

const meta: InstallerMeta = {
  name: $.path.basename($dirname(import.meta.url)),
  path: $dirname(import.meta.url),
  type: env.OS === "darwin" ? "installed-managed" : "installed-manual",
  version,
  lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
