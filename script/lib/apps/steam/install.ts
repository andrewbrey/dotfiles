#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net=deno.land --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { constants, InstallerMeta } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

if (await $.commandMissing("steam")) {
  if ($.env.OS === "darwin") {
    await $`brew install --cask steam`.env({ HOMEBREW_NO_ANALYTICS: "1" });
  } else {
    await $`sudo apt install -y steam`;
  }
}

const meta: InstallerMeta = {
  name: $.$dirname(import.meta.url, true),
  path: $.$dirname(import.meta.url),
  type: "installed-managed",
  version: "",
  lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
