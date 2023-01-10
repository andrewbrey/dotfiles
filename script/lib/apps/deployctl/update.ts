#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { constants, getInstallerMetas } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

const [meta] = await getInstallerMetas(new Set([$.$dirname(import.meta.url, true)]));

if (await $.commandExists("deployctl")) {
  await $`deno install --allow-read --allow-write --allow-env --allow-net --allow-run --no-check -r -f https://deno.land/x/deploy/deployctl.ts`;

  meta.lastCheck = Date.now();
}

const versionOutput = await $`deployctl --version`.text(); // deployctl 1.4.0
const version = versionOutput.split(" ")?.at(1) ?? "";

meta.version = version;

const metaManifestPath = $.path.join(dotAppPath, constants.metaManifestName);
await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
