#!/usr/bin/env -S deno run --allow-sys --allow-env --allow-net --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { type InstallerMeta, pamkit } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

if (await $.commandMissing("frpc")) {
	await $.requireCommand("eget", "pam install -a eget");

	const binariesPath = $.path.join(dotAppPath, "frp");

	await $`eget --to ${binariesPath} --all fatedier/frp`.env({
		EGET_GITHUB_TOKEN: $.env.GH_TOKEN,
	});

	// only linking client binary, but server binary could be linked too :shrug:
	await pamkit.linkBinaryToUserPath($.path.join(binariesPath, "frpc"), "frpc");
}

const version = await $`frpc --version`.text(); // 0.54.0

const meta: InstallerMeta = {
	name: $.$dirname(import.meta.url, true),
	path: $.$dirname(import.meta.url),
	type: "installed-manual",
	version,
	lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, pamkit.constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
