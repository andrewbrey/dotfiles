#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net --allow-read --allow-write --allow-run

import { $, invariant } from "../../mod.ts";
import { constants, InstallerMeta, linkBinaryToUserPath } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

if (await $.commandMissing("exercism")) {
  if ($.env.OS === "darwin") {
    await $`brew install exercism`.env({ HOMEBREW_NO_ANALYTICS: "1" });
  } else {
    const releaseInfoPath = $.path.join(dotAppPath, constants.jsonReleaseInfoName);
    const artifactPath = $.path.join(dotAppPath, "exercism.tar.gz");
    const binaryPath = $.path.join(dotAppPath, "exercism");

    const releaseInfo = await $.ghReleaseInfo("exercism", "cli");
    await Deno.writeTextFile(releaseInfoPath, JSON.stringify(releaseInfo, null, 2));

    const { assets, tag_name } = releaseInfo;
    const latestVersion = tag_name.split("v")?.at(1) ?? "0.0.0";
    const targetName = `exercism-${latestVersion}-linux-x86_64.tar.gz`;
    const targetAsset = assets.find((a) => a.name === targetName);

    invariant(typeof targetAsset !== "undefined", "no suitable installation target found");

    await $.streamDownload(targetAsset.browser_download_url, artifactPath);

    await $`tar -C ${dotAppPath} -xzf ${artifactPath}`;
    await linkBinaryToUserPath(binaryPath, "exercism");
  }

  const workspaceDir = $.path.join($.env.STANDARD_DIRS.CODE, "exercism");
  if (!(await $.exists(workspaceDir))) {
    await $`git clone git@github.com:andrewbrey/exercism.git ${workspaceDir}`;
  }
}

const versionOutput = await $`exercism version`.text(); // exercism version 3.1.0
const version = versionOutput.split(" ")?.at(2) ?? "";

const meta: InstallerMeta = {
  name: $.$dirname(import.meta.url, true),
  path: $.$dirname(import.meta.url),
  type: $.env.OS === "darwin" ? "installed-managed" : "installed-manual",
  version,
  lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
