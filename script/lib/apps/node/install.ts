#!/usr/bin/env -S deno run --allow-env --allow-net=deb.nodesource.com,deno.land --allow-read --allow-write --allow-run

import { $, $dirname, env, osInvariant } from "../../mod.ts";
import { constants, InstallerMeta, streamDownload } from "../_cli/pamkit.ts";

osInvariant();

const dotAppPath = $.path.join($dirname(import.meta.url), constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

const nodeVersion = 18;

if (env.OS === "darwin") {
  await $`brew install node@${nodeVersion}`.env({ HOMEBREW_NO_ANALYTICS: "1" });
} else {
  const installScriptPath = $.path.join(dotAppPath, "node.sh");

  await streamDownload(`https://deb.nodesource.com/setup_${nodeVersion}.x`, installScriptPath);
  await $`sudo bash -E ${installScriptPath}`;
  await $`sudo apt install -y nodejs`;
}

const versionOutput = await $`node --version`.text(); // v18.12.1
const version = versionOutput.split("v")[1];

const meta: InstallerMeta = {
  name: $.path.basename($dirname(import.meta.url)),
  path: $dirname(import.meta.url),
  type: env.OS === "darwin" ? "installed-managed" : "installed-manual",
  version,
  lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
