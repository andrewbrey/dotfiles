#!/usr/bin/env -S deno run --allow-sys --allow-env --allow-net --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { pamkit } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

const [meta] = await pamkit.getInstallerMetas(new Set([$.$dirname(import.meta.url, true)]));

await $.onMac(async () => {
	if (await pamkit.brewAppInstalled("eza")) {
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
	if (await $.commandExists("eza")) {
		await $.requireCommand("eget", "pam install -a eget");

		const binaryPath = $.path.join(dotAppPath, "eza");

		await $`eget --to ${binaryPath} eza-community/eza`.env({
			EGET_GITHUB_TOKEN: $.env.GH_TOKEN,
		});

		await pamkit.linkBinaryToUserPath(binaryPath, "eza");

		meta.lastCheck = Date.now();
	}
});

const versionOutput = await $`eza --version`.lines(); // eza - A mod...\nv0.18.9 [+git]\n...
const version = versionOutput.at(1)?.split(" ")?.at(0)?.split("v")?.at(1) ?? "";

meta.version = version;

const metaManifestPath = $.path.join(dotAppPath, pamkit.constants.metaManifestName);
await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
