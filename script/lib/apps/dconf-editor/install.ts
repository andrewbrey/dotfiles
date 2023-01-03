#!/usr/bin/env -S deno run --allow-env --allow-net=deno.land --allow-read --allow-write --allow-run

import { $, $dirname, env, osInvariant } from "../../mod.ts";
import { constants, InstallerMeta } from "../_cli/pamkit.ts";

osInvariant();

const dotAppPath = $.path.join($dirname(import.meta.url), constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

let version = ""; // not installed on mac, so default version
const notInstalled = typeof (await $.which("dconf-editor")) === "undefined";
if (notInstalled) {
  if (env.OS === "linux") {
    await $`sudo apt install -y dconf-editor`;

    const versionOutput = await $`dconf-editor --version`.text(); // dconf-editor 3.38.3
    version = versionOutput.split(" ")?.at(1) ?? "";
  }
}

const meta: InstallerMeta = {
  name: $dirname(import.meta.url, true),
  path: $dirname(import.meta.url),
  type: "installed-managed",
  version,
  lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
