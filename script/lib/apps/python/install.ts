#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net=deno.land --allow-read --allow-write --allow-run

import { $, $dirname, env } from "../../mod.ts";
import { constants, InstallerMeta, linkBinaryToUserPath } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($dirname(import.meta.url), constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

const pythonNotInstalled = typeof (await $.which("python3")) === "undefined";
const pipNotInstalled = typeof (await $.which("pip3")) === "undefined";
if (pythonNotInstalled || pipNotInstalled) {
  if (env.OS === "darwin") {
    await $`brew install python3`.env({ HOMEBREW_NO_ANALYTICS: "1" });
  } else {
    await $`sudo apt install -y python3 python3-pip`;
  }
}

if (env.OS === "linux") {
  // TODO: is this needed on mac too?
  const python = await $.which("python");
  const python3 = await $.which("python3");
  if (!python && python3) await linkBinaryToUserPath(python3, "python");
}

const versionOutput = await $`python3 --version`.text(); // Python 3.10.6
const version = versionOutput.split(" ")?.at(1) ?? "";

const meta: InstallerMeta = {
  name: $dirname(import.meta.url, true),
  path: $dirname(import.meta.url),
  type: "installed-managed",
  version,
  lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
