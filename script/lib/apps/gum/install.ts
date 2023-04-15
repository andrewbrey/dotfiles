#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net --allow-read --allow-write --allow-run

import { $, invariant } from "../../mod.ts";
import { type InstallerMeta, pamkit } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

await $.onMac(async () => {
	if (await pamkit.brewAppMissing("gum")) {
		await $`brew install gum`.env({ HOMEBREW_NO_ANALYTICS: "1" });
	}
});

await $.onLinux(async () => {
	if (await $.commandMissing("gum")) {
		const releaseInfoPath = $.path.join(dotAppPath, pamkit.constants.jsonReleaseInfoName);
		const debInstallerPath = $.path.join(dotAppPath, "gum.deb");

		const releaseInfo = await $.ghReleaseInfo("charmbracelet", "gum");
		await Deno.writeTextFile(releaseInfoPath, JSON.stringify(releaseInfo, null, 2));

		const { assets, tag_name } = releaseInfo;
		const latestVersion = tag_name.split("v")?.at(1) ?? "0.0.0";
		const targetName = `gum_${latestVersion}_amd64.deb`;
		const targetAsset = assets.find((a) => a.name === targetName);

		invariant(typeof targetAsset !== "undefined", "no suitable installation target found");

		await $.streamDownload(targetAsset.browser_download_url, debInstallerPath);

		await $`sudo apt install -y ${debInstallerPath}`;
	}
});

const versionOutput = await $`gum --version`.text(); // gum version v0.9.0 (832c4fc)
const version = versionOutput.split(" ").at(2)?.split("v")?.at(1) ?? "";

const meta: InstallerMeta = {
	name: $.$dirname(import.meta.url, true),
	path: $.$dirname(import.meta.url),
	type: $.env.OS === "darwin" ? "installed-managed" : "installed-manual",
	version,
	lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, pamkit.constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
