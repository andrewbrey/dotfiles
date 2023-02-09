#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { pamkit } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

const [meta] = await pamkit.getInstallerMetas(new Set([$.$dirname(import.meta.url, true)]));

if (await $.commandExists("vhs")) {
	await $.requireCommand("eget", "pam install -a eget");
	await $.requireCommand("ttyd", "pam install -a ttyd");

	const binaryPath = $.path.join(dotAppPath, "vhs");

	await $`eget --to ${binaryPath} charmbracelet/vhs`.env({
		EGET_GITHUB_TOKEN: $.env.GH_TOKEN,
	});

	await pamkit.linkBinaryToUserPath(binaryPath, "vhs");

	meta.lastCheck = Date.now();
}

const versionOutput = await $`vhs --version`.text(); // // vhs version v0.12.4 (099f4f1)
const version = versionOutput.split(" ")?.at(2)?.split("v")?.at(1) ?? "";

meta.version = version;

const metaManifestPath = $.path.join(dotAppPath, pamkit.constants.metaManifestName);
await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
