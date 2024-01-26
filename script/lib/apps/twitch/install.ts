#!/usr/bin/env -S deno run --allow-sys --allow-env --allow-net --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { type InstallerMeta, pamkit } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

const name = $.$dirname(import.meta.url, true);
if (await $.commandMissing(name)) {
	await pamkit.createAndLinkNativefierApp({
		appName: name,
		displayName: "Twitch",
		website: "https://twitch.tv",
		frame: false,
	});
}

const meta: InstallerMeta = {
	name,
	path: $.$dirname(import.meta.url),
	type: "installed-manual",
	version: "0.0.0",
	lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, pamkit.constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
