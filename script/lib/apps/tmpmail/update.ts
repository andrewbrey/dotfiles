#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net=deno.land --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { constants, getInstallerMetas } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

const [meta] = await getInstallerMetas(new Set([$.$dirname(import.meta.url, true)]));

const installed = typeof (await $.which("tmpmail")) !== "undefined";
if (installed) {
  const sourcePath = $.path.join(dotAppPath, constants.sourceDir);

  await $`git -C ${sourcePath} pull`;

  meta.lastCheck = Date.now();
}

const versionOutput = await $`tmpmail --version`.text(); // 1.2.3
const version = versionOutput.split("v")?.at(1) ?? "";

meta.version = version;

const metaManifestPath = $.path.join(dotAppPath, constants.metaManifestName);
await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
