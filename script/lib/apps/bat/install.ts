#!/usr/bin/env -S deno run --allow-env --allow-net=deno.land,api.github.com,github.com,objects.githubusercontent.com --allow-read --allow-write --allow-run

import { $, $dirname, env, invariant, osInvariant } from "../../mod.ts";
import {
  APP_ARTIFACTS_DIR,
  GH_RELEASE_INFO_NAME,
  ghReleaseLatestInfo,
  InstallerMeta,
  META_MANIFEST_NAME,
  streamDownload,
} from "../_cli/pamkit.ts";

osInvariant();

const dotAppPath = $.path.join($dirname(import.meta.url), APP_ARTIFACTS_DIR);

if (env.OS === "darwin") {
  await $`brew install bat`.env({ HOMEBREW_NO_ANALYTICS: "1" });
} else {
  const releaseInfoPath = $.path.join(dotAppPath, GH_RELEASE_INFO_NAME);
  const debInstallerPath = $.path.join(dotAppPath, "bat.deb");

  await $.fs.ensureDir(dotAppPath);

  const releaseInfo = await ghReleaseLatestInfo("sharkdp", "bat");
  await Deno.writeTextFile(releaseInfoPath, JSON.stringify(releaseInfo, null, 2));

  const { assets, tag_name } = releaseInfo;
  const latestVersion = tag_name.split("v")[1] ?? "0.0.0";
  const targetName = `bat_${latestVersion}_amd64.deb`;
  const targetAsset = assets.find((a) => a.name === targetName);

  invariant(typeof targetAsset !== "undefined", "no suitable installation target found");

  await streamDownload(targetAsset.browser_download_url, debInstallerPath);

  await $`sudo apt install -y ${debInstallerPath}`;
}

const versionOutput = await $`bat --version`.text(); // bat 0.22.1 (e5d9579)
const version = versionOutput.split(" ")[1];

const meta: InstallerMeta = {
  name: $.path.basename($dirname(import.meta.url)),
  path: $dirname(import.meta.url),
  type: "installed-manual",
  version,
  lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, META_MANIFEST_NAME);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
