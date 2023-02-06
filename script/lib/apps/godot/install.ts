#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net --allow-read --allow-write --allow-run

import { $, invariant } from "../../mod.ts";
import { type InstallerMeta, pamkit } from "../_cli/pamkit.ts";

await $.requireCommand("mono", "pam install -a mono");

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);
const sourceDir = $.path.join(dotAppPath, pamkit.constants.sourceDir);
await $.fs.ensureDir(dotAppPath);

await $.onMac(async () => {
	if (await pamkit.brewAppMissing("godot-mono")) {
		await $`brew install --cask godot-mono`.env({ HOMEBREW_NO_ANALYTICS: "1" });
	}
});

await $.onLinux(async () => {
	if (await $.commandMissing("godot")) {
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
	}
});

const versionOutput = await $`godot --version`.text(); // 3.5.1.stable.mono.official.6fed1ffa3
const version = versionOutput.split(".stable")?.at(0) ?? "";

const meta: InstallerMeta = {
	name: $.$dirname(import.meta.url, true),
	path: $.$dirname(import.meta.url),
	type: $.env.OS === "darwin" ? "installed-managed" : "installed-manual",
	version,
	lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, pamkit.constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
