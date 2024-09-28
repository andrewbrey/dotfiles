#!/usr/bin/env -S deno run --allow-sys --allow-env --allow-net --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { type InstallerMeta, pamkit } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

if (await $.commandMissing("turso")) {
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
}

const versionOutput = await $`turso --version`.text(); // turso version v0.97.2
const version = versionOutput.split(" ")?.at(2)?.split("v")?.at(1) ?? "";

const meta: InstallerMeta = {
	name: $.$dirname(import.meta.url, true),
	path: $.$dirname(import.meta.url),
	type: "installed-manual",
	version,
	lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, pamkit.constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
