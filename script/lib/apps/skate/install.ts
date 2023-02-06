#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net --allow-read --allow-write --allow-run

import { $, invariant } from "../../mod.ts";
import { type InstallerMeta, pamkit } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

if (await $.commandMissing("skate")) {
	const releaseInfoPath = $.path.join(dotAppPath, pamkit.constants.jsonReleaseInfoName);
	const artifactPath = $.path.join(dotAppPath, "skate.tar.gz");
	const binaryPath = $.path.join(dotAppPath, "skate");

	const releaseInfo = await $.ghReleaseInfo("charmbracelet", "skate");
	await Deno.writeTextFile(releaseInfoPath, JSON.stringify(releaseInfo, null, 2));

	const { assets, tag_name } = releaseInfo;
	const latestVersion = tag_name.split("v")?.at(1) ?? "0.0.0";

	const targetName = $.env.OS === "darwin"
		? `skate_${latestVersion}_Darwin_arm64.tar.gz`
		: `skate_${latestVersion}_linux_x86_64.tar.gz`;

	const targetAsset = assets.find((a) => a.name === targetName);

	invariant(typeof targetAsset !== "undefined", "no suitable installation target found");

	await $.streamDownload(targetAsset.browser_download_url, artifactPath);
	await $`tar -C ${dotAppPath} -xzf ${artifactPath}`;
	await pamkit.linkBinaryToUserPath(binaryPath, "skate");
}

const versionOutput = await $`skate --version`.text(); // skate version v0.2.1 (ef9b184)
const version = versionOutput.split(" ")?.at(2)?.split("v")?.at(1) ?? "";

const meta: InstallerMeta = {
	name: $.$dirname(import.meta.url, true),
	path: $.$dirname(import.meta.url),
	type: "installed-manual",
	version,
	lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, pamkit.constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
