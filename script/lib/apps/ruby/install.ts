#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net=deno.land --allow-read --allow-write --allow-run

import { $, $dirname, env } from "../../mod.ts";
import { constants, InstallerMeta } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($dirname(import.meta.url), constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

const notInstalled = typeof (await $.which("ruby")) === "undefined";
if (notInstalled) {
  if (env.OS === "darwin") {
    await $`brew install ruby`.env({ HOMEBREW_NO_ANALYTICS: "1" });
  } else {
    await $`sudo apt install -y ruby-full`;
  }
}

const versionOutput = await $`ruby --version`.text(); // ruby 3.0.2p107 (2021-07-07 revision 0db68f0233) [x86_64-linux-gnu]
const version = versionOutput.split(" ")?.at(1)?.split("p")?.at(0) ?? "";

const meta: InstallerMeta = {
  name: $dirname(import.meta.url, true),
  path: $dirname(import.meta.url),
  type: "installed-managed",
  version,
  lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
