#!/usr/bin/env -S deno run --allow-sys --allow-env --allow-net=deno.land,github.com,api.github.com,objects.githubusercontent.com --allow-read --allow-write --allow-run

import { $, invariant } from "../../mod.ts";
import { pamkit } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

const [meta] = await pamkit.getInstallerMetas(new Set([$.$dirname(import.meta.url, true)]));

if (await $.commandExists("cheat")) {
	if ($.env.OS /* TODO: refactor to os helpers */ === "darwin") {
		$.logGroup(() => {
			$.logWarn(
				"warn:",
				$.dedent`
    			installation is managed; skipping manual update

    		`,
			);
		});
	} else {
		const releaseInfoPath = $.path.join(dotAppPath, pamkit.constants.jsonReleaseInfoName);
		const assetDownloadPath = $.path.join(dotAppPath, "cheat.gz");
		const binaryPath = $.path.join(dotAppPath, "cheat");

		const releaseInfo = await $.ghReleaseInfo("cheat", "cheat");
		await Deno.writeTextFile(releaseInfoPath, JSON.stringify(releaseInfo, null, 2));

		const { assets } = releaseInfo;
		const targetName = `cheat-linux-amd64.gz`;
		const targetAsset = assets.find((a) => a.name === targetName);

		invariant(typeof targetAsset !== "undefined", "no suitable installation target found");

		await $.streamDownload(targetAsset.browser_download_url, assetDownloadPath);

		await $`gzip -f -d ${assetDownloadPath}`;
		await $`chmod +x ${binaryPath}`;
		await pamkit.linkBinaryToUserPath(binaryPath, "cheat");

		meta.lastCheck = Date.now();
	}

	const communityCheatPath = $.path.join(
		$.env.STANDARD_DIRS.DOT_DOTS_APPS,
		"cheat",
		"cheatsheets",
		"community",
	);
	if (await $.exists(communityCheatPath)) {
		await $`git -C ${communityCheatPath} pull`;
	}
}

const version = await $`cheat --version`.text(); // 4.4.0

meta.version = version;

const metaManifestPath = $.path.join(dotAppPath, pamkit.constants.metaManifestName);
await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
