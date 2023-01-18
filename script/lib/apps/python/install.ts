#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net=deno.land --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { type InstallerMeta, pamkit } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

if (await $.commandMissing("python3") || await $.commandMissing("pip3")) {
  if ($.env.OS /* TODO: refactor to os helpers */ === "darwin") {
    await $`brew install python3`.env({ HOMEBREW_NO_ANALYTICS: "1" });
  } else {
    await $`sudo apt install -y python3 python3-pip`;
  }
}

const python = await $.which("python");
const python3 = await $.which("python3");
if (!python && python3) await pamkit.linkBinaryToUserPath(python3, "python");

const versionOutput = await $`python3 --version`.text(); // Python 3.10.6
const version = versionOutput.split(" ")?.at(1) ?? "";

const meta: InstallerMeta = {
  name: $.$dirname(import.meta.url, true),
  path: $.$dirname(import.meta.url),
  type: "installed-managed",
  version,
  lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, pamkit.constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
