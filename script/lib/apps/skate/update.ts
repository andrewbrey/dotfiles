#!/usr/bin/env -S deno run --allow-env --allow-net --allow-read --allow-write --allow-run

import { $, $dirname, env, invariant, osInvariant } from "../../mod.ts";
import {
  constants,
  getInstallerMetas,
  ghReleaseLatestInfo,
  linkBinaryToUserPath,
  streamDownload,
} from "../_cli/pamkit.ts";

osInvariant();

const dotAppPath = $.path.join($dirname(import.meta.url), constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

const [meta] = await getInstallerMetas(new Set([$dirname(import.meta.url, true)]));

const installed = typeof (await $.which("skate")) !== "undefined";
if (installed) {
  const releaseInfoPath = $.path.join(dotAppPath, constants.ghReleaseInfoName);
  const artifactPath = $.path.join(dotAppPath, "skate.tar.gz");
  const binaryPath = $.path.join(dotAppPath, "skate");

  const releaseInfo = await ghReleaseLatestInfo("charmbracelet", "skate");
  await Deno.writeTextFile(releaseInfoPath, JSON.stringify(releaseInfo, null, 2));

  const { assets, tag_name } = releaseInfo;
  const latestVersion = tag_name.split("v")?.at(1) ?? "0.0.0";

  const targetName = env.OS === "darwin"
    ? `skate_${latestVersion}_Darwin_arm64.tar.gz`
    : `skate_${latestVersion}_linux_x86_64.tar.gz`;

  const targetAsset = assets.find((a) => a.name === targetName);

  invariant(typeof targetAsset !== "undefined", "no suitable installation target found");

  await streamDownload(targetAsset.browser_download_url, artifactPath);
  await $`tar -C ${dotAppPath} -xzf ${artifactPath}`;
  await linkBinaryToUserPath(binaryPath, "skate");

  meta.lastCheck = Date.now();
}

const versionOutput = await $`skate --version`.text(); // skate version v0.2.1 (ef9b184)
const version = versionOutput.split(" ")?.at(2)?.split("v")?.at(1) ?? "";

meta.version = version;

const metaManifestPath = $.path.join(dotAppPath, constants.metaManifestName);
await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
