#!/usr/bin/env -S deno run --allow-sys --allow-env --allow-net --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { type InstallerMeta, pamkit } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

if (await $.commandMissing("micro")) {
	await $.requireCommand("eget", "pam install -a eget");

	const binaryPath = $.path.join(dotAppPath, "micro");

	await $`eget --to ${binaryPath} zyedidia/micro`.env({
		EGET_GITHUB_TOKEN: $.env.GH_TOKEN,
	});

	await pamkit.linkBinaryToUserPath(binaryPath, "micro");
}

const versionLines = await $`micro --version`.lines(); // Version: 2.0.13\nCo...
const version = versionLines.at(0)?.split(" ")?.at(1);

const meta: InstallerMeta = {
	name: $.$dirname(import.meta.url, true),
	path: $.$dirname(import.meta.url),
	type: "installed-manual",
	version,
	lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, pamkit.constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
