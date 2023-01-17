#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net --allow-read --allow-write --allow-run

import { $, invariant } from "../../mod.ts";
import { type InstallerMeta, pamkit } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

if (await $.commandMissing("fd")) {
  if ($.env.OS === "darwin") {
    await $`brew install fd`.env({ HOMEBREW_NO_ANALYTICS: "1" });
  } else {
    const releaseInfoPath = $.path.join(dotAppPath, pamkit.constants.jsonReleaseInfoName);
    const artifactPath = $.path.join(dotAppPath, "fd.tar.gz");
    const binaryPath = $.path.join(dotAppPath, "fd");

    const releaseInfo = await $.ghReleaseInfo("sharkdp", "fd");
    await Deno.writeTextFile(releaseInfoPath, JSON.stringify(releaseInfo, null, 2));

    const { assets, tag_name } = releaseInfo;

    const targetName = `fd-${tag_name}-x86_64-unknown-linux-gnu.tar.gz`;

    const targetAsset = assets.find((a) => a.name === targetName);

    invariant(typeof targetAsset !== "undefined", "no suitable installation target found");

    await $.streamDownload(targetAsset.browser_download_url, artifactPath);
    await $`tar -C ${dotAppPath} --strip-components=1 -xzf ${artifactPath}`;
    await pamkit.linkBinaryToUserPath(binaryPath, "fd");
  }
}

const versionOutput = await $`fd --version`.text(); // fd 8.6.0
const version = versionOutput.split(" ")?.at(1) ?? "";

const meta: InstallerMeta = {
  name: $.$dirname(import.meta.url, true),
  path: $.$dirname(import.meta.url),
  type: $.env.OS === "darwin" ? "installed-managed" : "installed-manual",
  version,
  lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, pamkit.constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
