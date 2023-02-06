#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net --allow-read --allow-write --allow-run

import { $, invariant } from "../../mod.ts";
import { pamkit } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);
const sourceDir = $.path.join(dotAppPath, pamkit.constants.sourceDir);
await $.fs.ensureDir(dotAppPath);

const [meta] = await pamkit.getInstallerMetas(new Set([$.$dirname(import.meta.url, true)]));

if (await $.commandExists("godot")) {
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
		const artifactPath = $.path.join(dotAppPath, "godot.zip");

		const releaseInfo = await $.ghReleaseInfo("godotengine", "godot");
		await Deno.writeTextFile(releaseInfoPath, JSON.stringify(releaseInfo, null, 2));

		const { assets, tag_name } = releaseInfo;
		const latestVersion = tag_name.split("-")?.at(0) ?? "0.0.0";
		const targetName = `Godot_v${latestVersion}-stable_mono_x11_64.zip`;
		const targetAsset = assets.find((a) => a.name === targetName);

		invariant(typeof targetAsset !== "undefined", "no suitable installation target found");

		await $.streamDownload(targetAsset.browser_download_url, artifactPath);
		await $.fs.emptyDir(sourceDir);
		const extractedBase = $.path.basename(targetName, ".zip");
		const extractedPath = $.path.join(dotAppPath, extractedBase);
		const binName = extractedBase.replace("x11_64", "x11.64");
		const originalBinPath = $.path.join(extractedPath, binName);
		const movedBinPath = $.path.join(extractedPath, "godot");
		const binPath = $.path.join(sourceDir, "godot");

		await $`unzip -d ${dotAppPath} -o ${artifactPath}`;
		await $.fs.move(originalBinPath, movedBinPath, { overwrite: true });
		await $.fs.move(extractedPath, sourceDir, { overwrite: true });

		await pamkit.linkBinaryToUserPath(binPath, "godot");
		await pamkit.linkDesktopFileForApp("godot");

		meta.lastCheck = Date.now();
	}
}

const versionOutput = await $`godot --version`.text(); // 3.5.1.stable.mono.official.6fed1ffa3
const version = versionOutput.split(".stable")?.at(0) ?? "";

meta.version = version;

const metaManifestPath = $.path.join(dotAppPath, pamkit.constants.metaManifestName);
await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
