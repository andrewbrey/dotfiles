#!/usr/bin/env -S deno run --allow-sys --allow-env --allow-net --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { type InstallerMeta, pamkit } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

await $.onMac(async () => {
	if (await pamkit.brewAppMissing("eza")) {
		await $`brew install eza`.env({ HOMEBREW_NO_ANALYTICS: "1" });
	}
});

await $.onLinux(async () => {
	if (await $.commandMissing("eza")) {
		await $.requireCommand("eget", "pam install -a eget");

		const binaryPath = $.path.join(dotAppPath, "eza");

		await $`eget --to ${binaryPath} eza-community/eza`.env({
			EGET_GITHUB_TOKEN: $.env.GH_TOKEN,
		});

		await pamkit.linkBinaryToUserPath(binaryPath, "eza");
	}
});

const versionOutput = await $`eza --version`.lines(); // eza - A mod...\nv0.18.9 [+git]\n...
const version = versionOutput.at(1)?.split(" ")?.at(0)?.split("v")?.at(1) ?? "";

const meta: InstallerMeta = {
	name: $.$dirname(import.meta.url, true),
	path: $.$dirname(import.meta.url),
	type: $.env.OS === "darwin" ? "installed-managed" : "installed-manual",
	version,
	lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, pamkit.constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
