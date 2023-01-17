#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net --allow-read --allow-write --allow-run

import { $, invariant } from "../../mod.ts";
import { type InstallerMeta, pamkit } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

await $.onMac(async () => {
  if (await pamkit.brewAppMissing("slack")) {
    await $`brew install --cask slack`.env({ HOMEBREW_NO_ANALYTICS: "1" });
  }
});

await $.onLinux(async () => {
  if (await $.commandMissing("slack")) {
    const releaseInfoPath = $.path.join(dotAppPath, pamkit.constants.htmlReleaseInfoName);
    const debInstallerPath = $.path.join(dotAppPath, "slack.deb");

    await $.streamDownload("https://slack.com/downloads/linux", releaseInfoPath);
    const latestReleasePageText = await Deno.readTextFile(releaseInfoPath);
    const latestVersionLine = latestReleasePageText.match(/>Version \d+\.\d+\.\d+</); // >Version 4.29.149<
    const latestVersion = latestVersionLine?.at(0)?.match(/Version \d+\.\d+\.\d+/i)?.at(0)
      ?.split(" ")?.at(1); // 4.29.149

    invariant(
      typeof latestVersion === "string" && latestVersion.length > 0,
      "invalid latest version",
    );

    const targetAsset =
      `https://downloads.slack-edge.com/releases/linux/${latestVersion}/prod/x64/slack-desktop-${latestVersion}-amd64.deb`;

    await $.streamDownload(targetAsset, debInstallerPath);

    await $`sudo apt install -y ${debInstallerPath}`;
  }
});

const version = await $`slack --version`.text(); // 4.29.149

const meta: InstallerMeta = {
  name: $.$dirname(import.meta.url, true),
  path: $.$dirname(import.meta.url),
  type: "installed-managed",
  version,
  lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, pamkit.constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
