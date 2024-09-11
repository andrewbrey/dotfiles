#!/usr/bin/env -S deno run --allow-sys --allow-env --allow-net --allow-read --allow-write --allow-run

import { $, invariant } from "../../mod.ts";
import { type InstallerMeta, pamkit } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

if (await $.commandMissing("rustyvibes")) {
	await $.requireCommand("cargo", "pam install -a rust");

	await $`cargo install rustyvibes`;

	const appDataPath = $.path.join($.env.STANDARD_DIRS.DOT_DOTS_APPS, "rustyvibes");
	const archivePath = $.path.join(appDataPath, "packs.zip");

	await $`unzip -o ${archivePath} -d ${appDataPath}`;

	const packsDir = $.path(appDataPath).join("packs");
	const packEntries = Array.from($.fs.walkSync(packsDir.toFileUrl(), { maxDepth: 1 }));

	let current: (typeof packEntries)[number] | undefined;
	for (const entry of packEntries) {
		if (entry.name === "packs") continue;
		if (entry.name === "current") {
			await $`rm -f ${entry.path}`;
		}

		if (!current) {
			current = entry;
		}
	}

	invariant(!!current, "did not find a new current pack");

	await $`ln -s ${current.path} ${$.path(current.path).withBasename("current")}`;
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
