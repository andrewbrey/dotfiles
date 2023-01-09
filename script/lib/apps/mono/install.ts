#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net --allow-read --allow-write --allow-run

import { $, $dirname, env } from "../../mod.ts";
import { constants, InstallerMeta } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($dirname(import.meta.url), constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

const notInstalled = typeof (await $.which("mono")) === "undefined";
if (notInstalled) {
  if (env.OS === "darwin") {
    await $`brew install mono`.env({ HOMEBREW_NO_ANALYTICS: "1" });
  } else {
    await $`sudo apt install -y mono-devel`;
  }
}

const versionOutput = await $`mono --version`.lines(); // Mono JIT compiler version 6.8.0.105....\n
const version = versionOutput?.at(0)?.split(" ")?.at(4) ?? "";

const meta: InstallerMeta = {
  name: $dirname(import.meta.url, true),
  path: $dirname(import.meta.url),
  type: "installed-managed",
  version,
  lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
