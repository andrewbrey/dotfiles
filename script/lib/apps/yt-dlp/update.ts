#!/usr/bin/env -S deno run --allow-sys --allow-env --allow-net --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { pamkit } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

const [meta] = await pamkit.getInstallerMetas(new Set([$.$dirname(import.meta.url, true)]));

await $.onMac(async () => {
	if (await pamkit.brewAppInstalled("yt-dlp")) {
		$.logGroup(() => {
			$.logWarn(
				"warn:",
				$.dedent`
					installation is managed; skipping manual update

				`,
			);
		});
	}
});

await $.onLinux(async () => {
	if (await $.commandExists("yt-dlp")) {
		await $.requireCommand("eget", "pam install -a eget");

		const binaryPath = $.path.join(dotAppPath, "yt-dlp");

		await $`eget --to ${binaryPath} yt-dlp/yt-dlp`.env({
			EGET_GITHUB_TOKEN: $.env.GH_TOKEN,
		});

		await pamkit.linkBinaryToUserPath(binaryPath, "yt-dlp");

		// =====
		// update last check time, e.g.
		// =====
		meta.lastCheck = Date.now();
	}
});

const versionOutput = await $`yt-dlp --version`.text(); // 2023.07.06
const semverVersion = versionOutput.split(".").map((segment) => parseInt(segment)).join(".");

meta.version = semverVersion;

const metaManifestPath = $.path.join(dotAppPath, pamkit.constants.metaManifestName);
await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
