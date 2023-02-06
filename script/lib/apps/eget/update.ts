#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net --allow-read --allow-write --allow-run

import { $, invariant } from "../../mod.ts";
import { pamkit } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

const [meta] = await pamkit.getInstallerMetas(new Set([$.$dirname(import.meta.url, true)]));

if (await $.commandExists("eget")) {
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
		const artifactPath = $.path.join(dotAppPath, "eget.tar.gz");
		const binaryPath = $.path.join(dotAppPath, "eget");

		const releaseInfo = await $.ghReleaseInfo("zyedidia", "eget");
		await Deno.writeTextFile(releaseInfoPath, JSON.stringify(releaseInfo, null, 2));

		const { assets, tag_name } = releaseInfo;
		const latestVersion = tag_name.split("v")?.at(1) ?? "0.0.0";

		const targetName = `eget-${latestVersion}-linux_amd64.tar.gz`;

		const targetAsset = assets.find((a) => a.name === targetName);

		invariant(typeof targetAsset !== "undefined", "no suitable installation target found");

		await $.streamDownload(targetAsset.browser_download_url, artifactPath);
		await $`tar -C ${dotAppPath} --strip-components=1 -xzf ${artifactPath}`;
		await pamkit.linkBinaryToUserPath(binaryPath, "eget");

		meta.lastCheck = Date.now();
	}
}

const versionOutput = await $`eget --version`.text(); // eget version 1.3.1
const version = versionOutput.split(" ")?.at(2) ?? "";

meta.version = version;

const metaManifestPath = $.path.join(dotAppPath, pamkit.constants.metaManifestName);
await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
