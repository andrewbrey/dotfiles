#!/usr/bin/env -S deno run --allow-sys --allow-env --allow-net --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { pamkit } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

const [meta] = await pamkit.getInstallerMetas(new Set([$.$dirname(import.meta.url, true)]));
if (await $.commandExists("frpc")) {
	await $.requireCommand("eget", "pam install -a eget");

	const binariesPath = $.path.join(dotAppPath, "frp");

	// choose standard version, not `-baseline` or `-profile`
	await $`eget --to ${binariesPath} --all fatedier/frp`.env({
		EGET_GITHUB_TOKEN: $.env.GH_TOKEN,
	});

	await pamkit.linkBinaryToUserPath($.path.join(binariesPath, "frpc"), "frpc");

	meta.lastCheck = Date.now();
}

const version = await $`frpc --version`.text(); // 0.54.0

meta.version = version;

const metaManifestPath = $.path.join(dotAppPath, pamkit.constants.metaManifestName);
await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
