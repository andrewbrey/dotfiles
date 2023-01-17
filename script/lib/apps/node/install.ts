#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net=deb.nodesource.com,deno.land --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { type InstallerMeta, pamkit } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);
const dotResPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appResourcesDir);
await $.fs.ensureDir(dotAppPath);

const nodeVersion = await pamkit.mostRelevantVersion(dotResPath);
if (await $.commandMissing("node")) {
  if ($.env.OS === "darwin") {
    await $`brew install node@${nodeVersion}`.env({ HOMEBREW_NO_ANALYTICS: "1" });
  } else {
    const installScriptPath = $.path.join(dotAppPath, "node.sh");

    await $.streamDownload(`https://deb.nodesource.com/setup_${nodeVersion}.x`, installScriptPath);
    await $`sudo bash -E ${installScriptPath}`;
    await $`sudo apt install -y nodejs`;
  }
}

const versionOutput = await $`node --version`.text(); // v18.12.1
const version = versionOutput.split("v")?.at(1) ?? "";

const meta: InstallerMeta = {
  name: $.$dirname(import.meta.url, true),
  path: $.$dirname(import.meta.url),
  type: "installed-managed",
  version,
  lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, pamkit.constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
