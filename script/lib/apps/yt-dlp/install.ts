#!/usr/bin/env -S deno run --allow-sys --allow-env --allow-net --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { type InstallerMeta, pamkit } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

await $.onMac(async () => {
	if (await pamkit.brewAppMissing("yt-dlp")) {
		await $`brew install yt-dlp`.env({ HOMEBREW_NO_ANALYTICS: "1" });
	}
});

await $.onLinux(async () => {
	if (await $.commandMissing("yt-dlp")) {
		await $.requireCommand("eget", "pam install -a eget");

		const binaryPath = $.path.join(dotAppPath, "yt-dlp");

		await $`eget --to ${binaryPath} yt-dlp/yt-dlp`.env({
			EGET_GITHUB_TOKEN: $.env.GH_TOKEN,
		});

		await pamkit.linkBinaryToUserPath(binaryPath, "yt-dlp");
	}
});

const versionOutput = await $`yt-dlp --version`.text(); // 2023.07.06
const semverVersion = versionOutput.split(".").map((segment) => parseInt(segment)).join(".");

const meta: InstallerMeta = {
	name: $.$dirname(import.meta.url, true),
	path: $.$dirname(import.meta.url),
	type: $.env.OS === "darwin" ? "installed-managed" : "installed-manual",
	version: semverVersion,
	lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, pamkit.constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
