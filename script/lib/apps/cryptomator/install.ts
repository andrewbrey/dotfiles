#!/usr/bin/env -S deno run --allow-sys --allow-env --allow-net --allow-read --allow-write --allow-run

import { $, invariant } from "../../mod.ts";
import { type InstallerMeta, pamkit } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

await $.onMac(async () => {
	if (await pamkit.brewAppMissing("cryptomator")) {
		await $`brew install --cask cryptomator`.env({ HOMEBREW_NO_ANALYTICS: "1" });
	}
});

await $.onLinux(async () => {
	if (await $.commandMissing("cryptomator")) {
		const releaseInfoPath = $.path.join(dotAppPath, pamkit.constants.jsonReleaseInfoName);
		const binPath = $.path.join(dotAppPath, "cryptomator.AppImage");

		const releaseInfo = await $.ghReleaseInfo("cryptomator", "cryptomator");
		await Deno.writeTextFile(releaseInfoPath, JSON.stringify(releaseInfo, null, 2));

		const { assets, tag_name } = releaseInfo;
		const latestVersion = tag_name ?? "0.0.0";
		const targetName = `cryptomator-${latestVersion}-x86_64.AppImage`;
		const targetAsset = assets.find((a) => a.name === targetName);

		invariant(typeof targetAsset !== "undefined", "no suitable installation target found");

		await $.streamDownload(targetAsset.browser_download_url, binPath);

		await pamkit.linkBinaryToUserPath(binPath, "cryptomator");
		await pamkit.linkDesktopFileForApp("cryptomator");
	}
});

const versionOutput = await $`cryptomator --version`.lines(); // /bin/dpkg\nCryptomator version 1.6.17 (build appimage-4104)
const version = versionOutput?.at(1)?.split(" ")?.at(2) ?? "";

const meta: InstallerMeta = {
	name: $.$dirname(import.meta.url, true),
	path: $.$dirname(import.meta.url),
	type: $.env.OS === "darwin" ? "installed-managed" : "installed-manual",
	version,
	lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, pamkit.constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
