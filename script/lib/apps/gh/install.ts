#!/usr/bin/env -S deno run --allow-env --allow-net=deno.land,api.github.com,github.com,objects.githubusercontent.com --allow-read --allow-write --allow-run

import { $, $dirname, env, invariant, osInvariant } from "../../mod.ts";
import { constants, ghReleaseLatestInfo, InstallerMeta, streamDownload } from "../_cli/pamkit.ts";

osInvariant();

const dotAppPath = $.path.join($dirname(import.meta.url), constants.appArtifactsDir);

if (env.OS === "darwin") {
  await $`brew install gh`.env({ HOMEBREW_NO_ANALYTICS: "1" });
} else {
  const releaseInfoPath = $.path.join(dotAppPath, constants.ghReleaseInfoName);
  const debInstallerPath = $.path.join(dotAppPath, "gh.deb");

  await $.fs.ensureDir(dotAppPath);

  const releaseInfo = await ghReleaseLatestInfo("cli", "cli");
  await Deno.writeTextFile(releaseInfoPath, JSON.stringify(releaseInfo, null, 2));

  const { assets, tag_name } = releaseInfo;
  const latestVersion = tag_name.split("v")[1] ?? "0.0.0";
  const targetName = `gh_${latestVersion}_linux_amd64.deb`;
  const targetAsset = assets.find((a) => a.name === targetName);

  invariant(typeof targetAsset !== "undefined", "no suitable installation target found");

  await streamDownload(targetAsset.browser_download_url, debInstallerPath);

  await $`sudo apt install -y ${debInstallerPath}`;
}

const versionOutput = await $`gh --version`.text(); // gh version 2.20.2-17-g2d61515a (2022-11-17)
const version = versionOutput.split(" ")[2].split("-")[0];

const meta: InstallerMeta = {
  name: $.path.basename($dirname(import.meta.url)),
  path: $dirname(import.meta.url),
  type: "installed-manual",
  version,
  lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
