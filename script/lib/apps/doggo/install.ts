#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net --allow-read --allow-write --allow-run

import { $, invariant } from "../../mod.ts";
import { type InstallerMeta, pamkit } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

if (await $.commandMissing("doggo")) {
  if ($.env.OS /* TODO: refactor to os helpers */ === "darwin") {
    await $`brew install doggo`.env({ HOMEBREW_NO_ANALYTICS: "1" });
  } else {
    const releaseInfoPath = $.path.join(dotAppPath, pamkit.constants.jsonReleaseInfoName);
    const artifactPath = $.path.join(dotAppPath, "doggo.tar.gz");
    const binaryPath = $.path.join(dotAppPath, "doggo");

    const releaseInfo = await $.ghReleaseInfo("mr-karan", "doggo");
    await Deno.writeTextFile(releaseInfoPath, JSON.stringify(releaseInfo, null, 2));

    const { assets, tag_name } = releaseInfo;
    const latestVersion = tag_name.split("v")?.at(1) ?? "0.0.0";
    const targetName = `doggo_${latestVersion}_linux_amd64.tar.gz`;
    const targetAsset = assets.find((a) => a.name === targetName);

    invariant(typeof targetAsset !== "undefined", "no suitable installation target found");

    await $.streamDownload(targetAsset.browser_download_url, artifactPath);
    await $`tar -C ${dotAppPath} -xzf ${artifactPath}`;
    await pamkit.linkBinaryToUserPath(binaryPath, "doggo");
  }
}

const versionOutput = await $`doggo --version`.text(); // v0.5.4 (2cf9e7b 2022-07-13T11:37:54Z) - unknown
const version = versionOutput.split(" ")?.at(0)?.split("v")?.at(1) ?? "";

const meta: InstallerMeta = {
  name: $.$dirname(import.meta.url, true),
  path: $.$dirname(import.meta.url),
  type: $.env.OS === "darwin" ? "installed-managed" : "installed-manual",
  version,
  lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, pamkit.constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
