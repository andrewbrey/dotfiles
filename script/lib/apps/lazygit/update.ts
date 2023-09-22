#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { pamkit } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

const [meta] = await pamkit.getInstallerMetas(new Set([$.$dirname(import.meta.url, true)]));

if (await $.commandExists("lazygit")) {
	await $.requireCommand("eget", "pam install -a eget");

	const binaryPath = $.path.join(dotAppPath, "lazygit");

	await $`eget --to ${binaryPath} jesseduffield/lazygit`.env({
		EGET_GITHUB_TOKEN: $.env.GH_TOKEN,
	});

	await pamkit.linkBinaryToUserPath(binaryPath, "lazygit");

	meta.lastCheck = Date.now();
}

const versionOutput = await $`lazygit --version`.text(); // commit=5e388e21c8ca6aa883dbcbe45c47f6fdd5116815, build date=2023-08-07T14:05:48Z, build source=binaryRelease, version=0.40.2, os=linux, arch=amd64, git version=2.34.1
const version = versionOutput.split("version=")?.at(1)?.split(",")?.at(0) ?? "";

meta.version = version;

const metaManifestPath = $.path.join(dotAppPath, pamkit.constants.metaManifestName);
await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
