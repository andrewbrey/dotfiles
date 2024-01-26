#!/usr/bin/env -S deno run --allow-sys --allow-env --allow-net --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { pamkit } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

const [meta] = await pamkit.getInstallerMetas(new Set([$.$dirname(import.meta.url, true)]));

await $.onMac(async () => {
	if (await pamkit.brewAppInstalled("notion")) {
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
	if (await $.commandExists("notion")) {
		await pamkit.createAndLinkNativefierApp({
			appName: "notion",
			displayName: "Notion",
			website: "https://notion.so",
		});

		meta.lastCheck = Date.now();
	}
});

const metaManifestPath = $.path.join(dotAppPath, pamkit.constants.metaManifestName);
await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
