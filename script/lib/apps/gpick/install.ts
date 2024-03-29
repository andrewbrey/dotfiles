#!/usr/bin/env -S deno run --allow-sys --allow-env --allow-net=deno.land --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { type InstallerMeta, pamkit } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

let version = ""; // not installed on mac, so default version
if (await $.commandMissing("gpick")) {
	if ($.env.OS /* TODO: refactor to os helpers */ === "linux") {
		await $`sudo apt install -y gpick`;

		const versionOutput = await $`gpick --version`.lines(); // Gpick version 0.2.6\n...
		version = versionOutput?.at(0)?.split(" ")?.at(2) ?? "";
	}
}

const meta: InstallerMeta = {
	name: $.$dirname(import.meta.url, true),
	path: $.$dirname(import.meta.url),
	type: "installed-managed",
	version,
	lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, pamkit.constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
