#!/usr/bin/env -S deno run --allow-env --allow-net=deno.land --allow-read --allow-write --allow-run

import { $, $dirname, env, osInvariant } from "../../mod.ts";
import { constants, InstallerMeta } from "../_cli/pamkit.ts";

osInvariant();

const dotAppPath = $.path.join($dirname(import.meta.url), constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

let version = ""; // not installed on mac, so default version
const notInstalled = typeof (await $.which("gpick")) === "undefined";
if (notInstalled) {
  if (env.OS === "linux") {
    await $`sudo apt install -y gpick`;

    const versionOutput = await $`gpick --version`.lines(); // Gpick version 0.2.6\n...
    version = versionOutput?.at(0)?.split(" ")?.at(2) ?? "";
  }
}

const meta: InstallerMeta = {
  name: $.path.basename($dirname(import.meta.url)),
  path: $dirname(import.meta.url),
  type: "installed-managed",
  version,
  lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));