#!/usr/bin/env -S deno run --allow-sys --allow-env --allow-net --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { type InstallerMeta, pamkit } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

if (await $.commandMissing("chezmoi")) {
	await $.requireCommand("eget", "pam install -a eget");

	const chezmoiBinaryPath = $.path.join(dotAppPath, "chezmoi");

	await $`eget --to ${chezmoiBinaryPath} twpayne/chezmoi`.env({
		EGET_GITHUB_TOKEN: $.env.GH_TOKEN,
	});

	await pamkit.linkBinaryToUserPath(chezmoiBinaryPath, "chezmoi");
}

const versionOutput = await $`chezmoi --version`.text(); // chezmoi version v2.47.3, commit 4f7...
const version = versionOutput.split(" ")?.at(2)?.split("v")?.at(1)?.split(",")?.at(0) ?? "";

const meta: InstallerMeta = {
	name: $.$dirname(import.meta.url, true),
	path: $.$dirname(import.meta.url),
	type: "installed-manual",
	version,
	lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, pamkit.constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
