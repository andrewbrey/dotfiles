#!/usr/bin/env -S deno run --allow-sys --allow-env --allow-net --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { pamkit } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

const [meta] = await pamkit.getInstallerMetas(new Set([$.$dirname(import.meta.url, true)]));

if (await $.commandExists("turso")) {
	await $.requireCommand("eget", "pam install -a eget");

	const tursoBinaryPath = $.path.join(dotAppPath, "turso");
	const libSqlServerBinaryPath = $.path.join(dotAppPath, "sqld");

	await $`eget --to ${tursoBinaryPath} chiselstrike/homebrew-tap`.env({
		EGET_GITHUB_TOKEN: $.env.GH_TOKEN,
	});

	await $`eget --to ${libSqlServerBinaryPath} tursodatabase/libsql`.env({
		EGET_GITHUB_TOKEN: $.env.GH_TOKEN,
	});

	await pamkit.linkBinaryToUserPath(tursoBinaryPath, "turso");
	await pamkit.linkBinaryToUserPath(libSqlServerBinaryPath, "sqld");

	meta.lastCheck = Date.now();
}

const versionOutput = await $`turso --version`.text(); // turso version v0.97.2
const version = versionOutput.split(" ")?.at(2)?.split("v")?.at(1) ?? "";

meta.version = version;

const metaManifestPath = $.path.join(dotAppPath, pamkit.constants.metaManifestName);
await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
