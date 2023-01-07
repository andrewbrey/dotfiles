#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net=deb.nodesource.com,deno.land --allow-read --allow-write --allow-run

import { $, $dirname, osInvariant } from "../../mod.ts";
import { constants, getInstallerMetas } from "../_cli/pamkit.ts";

osInvariant();

$.logGroup(() => {
  $.logWarn(
    "warn:",
    $.dedent`
			installation is managed; skipping manual update

		`,
  );
});

const versionOutput = await $`node --version`.text(); // v18.12.1
const version = versionOutput.split("v")?.at(1) ?? "";

const [meta] = await getInstallerMetas(new Set([$dirname(import.meta.url, true)]));
meta.version = version;

const dotAppPath = $.path.join($dirname(import.meta.url), constants.appArtifactsDir);
const metaManifestPath = $.path.join(dotAppPath, constants.metaManifestName);
await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
