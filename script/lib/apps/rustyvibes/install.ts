#!/usr/bin/env -S deno run --allow-sys --allow-env --allow-net --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { type InstallerMeta, pamkit } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

if (await $.commandMissing("rustyvibes")) {
	await $.requireCommand("cargo", "pam install -a rust");

	await $`cargo install rustyvibes`;

	const appDataPath = $.path.join($.env.STANDARD_DIRS.DOT_DOTS_APPS, "rustyvibes");
	const archivePath = $.path.join(appDataPath, "packs.zip");

	await $`unzip -o ${archivePath} -d ${appDataPath}`;
}

const versionOutput = await $`rustyvibes --version`.lines(); // <ASCII ART>\nrustyvibes 1.0.9
const version = versionOutput.at(-1)?.split(" ")?.at(1) ?? "";

const meta: InstallerMeta = {
	name: $.$dirname(import.meta.url, true),
	path: $.$dirname(import.meta.url),
	type: "installed-manual",
	version,
	lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, pamkit.constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
