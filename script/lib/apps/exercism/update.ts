#!/usr/bin/env -S deno run --allow-sys --allow-env --allow-net --allow-read --allow-write --allow-run

import { $, invariant } from "../../mod.ts";
import { pamkit } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

const [meta] = await pamkit.getInstallerMetas(new Set([$.$dirname(import.meta.url, true)]));

if (await $.commandExists("exercism")) {
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
		const artifactPath = $.path.join(dotAppPath, "exercism.tar.gz");
		const binaryPath = $.path.join(dotAppPath, "exercism");

		const releaseInfo = await $.ghReleaseInfo("exercism", "cli");
		await Deno.writeTextFile(releaseInfoPath, JSON.stringify(releaseInfo, null, 2));

		const { assets, tag_name } = releaseInfo;
		const latestVersion = tag_name.split("v")?.at(1) ?? "0.0.0";
		const targetName = `exercism-${latestVersion}-linux-x86_64.tar.gz`;
		const targetAsset = assets.find((a) => a.name === targetName);

		invariant(typeof targetAsset !== "undefined", "no suitable installation target found");

		await $.streamDownload(targetAsset.browser_download_url, artifactPath);

		await $`tar -C ${dotAppPath} -xzf ${artifactPath}`;
		await pamkit.linkBinaryToUserPath(binaryPath, "exercism");

		meta.lastCheck = Date.now();
	}

	const workspaceDir = $.path.join($.env.STANDARD_DIRS.CODE, "exercism");
	if (await $.exists(workspaceDir)) {
		await $`git -C ${workspaceDir} pull`;
	}
}

const versionOutput = await $`exercism version`.text(); // exercism version 3.1.0
const version = versionOutput.split(" ")?.at(2) ?? "";

meta.version = version;

const metaManifestPath = $.path.join(dotAppPath, pamkit.constants.metaManifestName);
await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
