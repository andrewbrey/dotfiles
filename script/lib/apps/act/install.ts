#!/usr/bin/env -S deno run --allow-sys --allow-env --allow-net --allow-read --allow-write --allow-run

import { $, invariant } from "../../mod.ts";
import { type InstallerMeta, pamkit } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

if (await $.commandMissing("act")) {
	if ($.env.OS /* TODO: refactor to os helpers */ === "darwin") {
		await $`brew install act`.env({ HOMEBREW_NO_ANALYTICS: "1" });
	} else {
		const releaseInfoPath = $.path.join(dotAppPath, pamkit.constants.jsonReleaseInfoName);
		const artifactPath = $.path.join(dotAppPath, "act.tar.gz");
		const binPath = $.path.join(dotAppPath, "act");

		const releaseInfo = await $.ghReleaseInfo("nektos", "act");
		await Deno.writeTextFile(releaseInfoPath, JSON.stringify(releaseInfo, null, 2));

		const { assets, tag_name } = releaseInfo;
		const _latestVersion = tag_name.split("v")?.at(1) ?? "0.0.0";
		const targetName = `act_Linux_x86_64.tar.gz`;
		const targetAsset = assets.find((a) => a.name === targetName);

		invariant(typeof targetAsset !== "undefined", "no suitable installation target found");

		await $.streamDownload(targetAsset.browser_download_url, artifactPath);
		await $`tar -C ${dotAppPath} -xzf ${artifactPath}`;
		await pamkit.linkBinaryToUserPath(binPath, "act");
	}
}

const versionOutput = await $`act --version`.text(); // act version 0.2.35
const version = versionOutput.split(" ")?.at(2) ?? "";

const meta: InstallerMeta = {
	name: $.$dirname(import.meta.url, true),
	path: $.$dirname(import.meta.url),
	type: $.env.OS === "darwin" ? "installed-managed" : "installed-manual",
	version,
	lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, pamkit.constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
