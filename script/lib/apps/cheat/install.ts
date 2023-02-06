#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net=deno.land,github.com,api.github.com,objects.githubusercontent.com --allow-read --allow-write --allow-run

import { $, invariant } from "../../mod.ts";
import { type InstallerMeta, pamkit } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

if (await $.commandMissing("cheat")) {
	if ($.env.OS /* TODO: refactor to os helpers */ === "darwin") {
		await $`brew install cheat`.env({ HOMEBREW_NO_ANALYTICS: "1" });
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
	}

	const communityCheatPath = $.path.join(
		$.env.STANDARD_DIRS.DOT_DOTS_APPS,
		"cheat",
		"cheatsheets",
		"community",
	);
	if (!(await $.exists(communityCheatPath))) {
		await $`git clone https://github.com/cheat/cheatsheets.git ${communityCheatPath}`;
	}
}

const version = await $`cheat --version`.text(); // 4.4.0

const meta: InstallerMeta = {
	name: $.$dirname(import.meta.url, true),
	path: $.$dirname(import.meta.url),
	type: $.env.OS === "darwin" ? "installed-managed" : "installed-manual",
	version,
	lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, pamkit.constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
