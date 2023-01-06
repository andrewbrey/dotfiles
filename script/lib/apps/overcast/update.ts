#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net --allow-read --allow-write --allow-run

import { $, $dirname, osInvariant } from "../../mod.ts";
import { constants, createAndLinkNativefierApp, getInstallerMetas } from "../_cli/pamkit.ts";

osInvariant();

const dotAppPath = $.path.join($dirname(import.meta.url), constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

const [meta] = await getInstallerMetas(new Set([$dirname(import.meta.url, true)]));

const name = $dirname(import.meta.url, true);
const installed = typeof (await $.which(name)) !== "undefined";
if (installed) {
  await createAndLinkNativefierApp({
    appName: name,
    displayName: "Overcast",
    website: "https://overcast.fm",
  });

  meta.lastCheck = Date.now();
}

const metaManifestPath = $.path.join(dotAppPath, constants.metaManifestName);
await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
