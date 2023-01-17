#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net=deno.land --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { type InstallerMeta, pamkit } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

await $.onMac(async () => {
  if (await pamkit.brewAppMissing("visual-studio-code")) {
    await $`brew install --cask visual-studio-code`.env({ HOMEBREW_NO_ANALYTICS: "1" });
  }
});

await $.onLinux(async () => {
  if (await $.commandMissing("code")) {
    await $.requireCommand("snap", "pam install -a snapd");

    await $`sudo snap install code --classic`;
  }
});

const versionOutput = await $`code --version`.lines(); // 1.74.0\n.....
const version = versionOutput?.at(0) ?? "";

const meta: InstallerMeta = {
  name: $.$dirname(import.meta.url, true),
  path: $.$dirname(import.meta.url),
  type: "installed-managed",
  version,
  lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, pamkit.constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
