#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { type InstallerMeta, pamkit } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

if (await $.commandMissing("task")) {
	if ($.env.OS /* TODO: refactor to os helpers */ === "darwin") {
		await $`brew install go-task`.env({ HOMEBREW_NO_ANALYTICS: "1" });
	} else {
		await $.requireCommand("snap", "pam install -a snapd");

		await $`sudo snap install task --classic`;
	}
}

const versionOutput = await $`task --version`.text(); // Task version: v3.19.1 (h1:2KMJk6mDBacSPuFxPFvlvvHJwGZtU/hN2ENZpaFqR5s=)
const version = versionOutput.split(" ")?.at(2)?.split("v")?.at(1) ?? "";

const meta: InstallerMeta = {
	name: $.$dirname(import.meta.url, true),
	path: $.$dirname(import.meta.url),
	type: "installed-managed",
	version,
	lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, pamkit.constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
