#!/usr/bin/env -S deno run --allow-sys --allow-env --allow-net --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { pamkit } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

const [meta] = await pamkit.getInstallerMetas(new Set([$.$dirname(import.meta.url, true)]));

await $.onMac(async () => {
	if (await pamkit.brewAppInstalled("wezterm")) {
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
	if (await $.commandExists("wezterm")) {
		await $.requireCommand("eget", "pam install -a eget");

		const binaryPath = $.path.join(dotAppPath, "wezterm");

		// install the AppImage
		await $`eget --to ${binaryPath} wez/wezterm`.env({
			EGET_GITHUB_TOKEN: $.env.GH_TOKEN,
		});

		await pamkit.linkBinaryToUserPath(binaryPath, "wezterm");

		meta.lastCheck = Date.now();
	}
});

meta.version = "0.0.0"; // Actual version strings look like `wezterm 20240203-110809-5046fc22`...just hard code that we're out of date

const metaManifestPath = $.path.join(dotAppPath, pamkit.constants.metaManifestName);
await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
