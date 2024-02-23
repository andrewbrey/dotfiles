#!/usr/bin/env -S deno run --allow-sys --allow-env --allow-net --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { type InstallerMeta, pamkit } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

if (await $.commandMissing("mold")) {
	await $.requireCommand("clang", "pam install -a system-libs");
	await $.requireCommand("eget", "pam install -a eget");

	const binaryPath = $.path.join(dotAppPath, "mold");

	await $`eget --to ${binaryPath} rui314/mold`.env({
		EGET_GITHUB_TOKEN: $.env.GH_TOKEN,
	});

	await pamkit.linkBinaryToUserPath(binaryPath, "mold");
}

const versionLine = await $`mold --version`.text(); // mold 2.4.0 (3d9....
const version = versionLine.split(" ").at(1);

const meta: InstallerMeta = {
	name: $.$dirname(import.meta.url, true),
	path: $.$dirname(import.meta.url),
	type: "installed-manual",
	version,
	lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, pamkit.constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
