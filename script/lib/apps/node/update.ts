#!/usr/bin/env -S deno run --allow-sys --allow-env --allow-net=deb.nodesource.com,deno.land --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { pamkit } from "../_cli/pamkit.ts";

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

const [meta] = await pamkit.getInstallerMetas(new Set([$.$dirname(import.meta.url, true)]));
meta.version = version;

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);
const metaManifestPath = $.path.join(dotAppPath, pamkit.constants.metaManifestName);
await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
