#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { pamkit } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

const [meta] = await pamkit.getInstallerMetas(new Set([$.$dirname(import.meta.url, true)]));

const name = $.$dirname(import.meta.url, true);
if (await $.commandExists(name)) {
	await pamkit.createAndLinkNativefierApp({
		appName: name,
		displayName: "Twitch",
		website: "https://twitch.tv",
		frame: false,
	});

	meta.lastCheck = Date.now();
}

const metaManifestPath = $.path.join(dotAppPath, pamkit.constants.metaManifestName);
await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
