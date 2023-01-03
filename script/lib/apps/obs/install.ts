#!/usr/bin/env -S deno run --allow-env --allow-net --allow-read --allow-write --allow-run

import { $, $dirname, env, osInvariant } from "../../mod.ts";
import { constants, InstallerMeta } from "../_cli/pamkit.ts";

osInvariant();

const dotAppPath = $.path.join($dirname(import.meta.url), constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

const notInstalled = typeof (await $.which("obs")) === "undefined";
if (notInstalled) {
  if (env.OS === "darwin") {
    await $`brew install --cask obs`.env({ HOMEBREW_NO_ANALYTICS: "1" });
  } else {
    await $`sudo add-apt-repository -y ppa:obsproject/obs-studio`;
    await $`sudo apt update`;
    await $`sudo apt install -y obs-studio`;
  }
}

const versionOutput = await $`obs --version`.text(); // OBS Studio - 28.1.2 (linux)
const version = versionOutput.split(" ")?.at(3) ?? "";

const meta: InstallerMeta = {
  name: $dirname(import.meta.url, true),
  path: $dirname(import.meta.url),
  type: "installed-managed",
  version,
  lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
