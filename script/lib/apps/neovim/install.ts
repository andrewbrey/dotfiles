#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net --allow-read --allow-write --allow-run

import { $, invariant } from "../../mod.ts";
import { type InstallerMeta, pamkit } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

if (await $.commandMissing("nvim")) {
	if ($.env.OS /* TODO: refactor to os helpers */ === "darwin") {
		await $`brew install neovim`.env({ HOMEBREW_NO_ANALYTICS: "1" });
	} else {
		const releaseInfoPath = $.path.join(dotAppPath, pamkit.constants.jsonReleaseInfoName);
		const binPath = $.path.join(dotAppPath, "nvim.AppImage");

		const releaseInfo = await $.ghReleaseInfo("neovim", "neovim");
		await Deno.writeTextFile(releaseInfoPath, JSON.stringify(releaseInfo, null, 2));

		const { assets } = releaseInfo;
		const targetName = `nvim.appimage`;
		const targetAsset = assets.find((a) => a.name === targetName);

		invariant(typeof targetAsset !== "undefined", "no suitable installation target found");

		await $.streamDownload(targetAsset.browser_download_url, binPath);

		await pamkit.linkBinaryToUserPath(binPath, "nvim");
		await pamkit.linkDesktopFileForApp("nvim");
	}
}

const versionOutput = await $`nvim --version`.lines(); // NVIM v0.9.2\n...
const version = versionOutput?.at(0)?.split(" ")?.at(1)?.split("v")?.at(1) ?? "";

const meta: InstallerMeta = {
	name: $.$dirname(import.meta.url, true),
	path: $.$dirname(import.meta.url),
	type: $.env.OS === "darwin" ? "installed-managed" : "installed-manual",
	version,
	lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, pamkit.constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
