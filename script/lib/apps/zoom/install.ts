#!/usr/bin/env -S deno run --allow-sys --allow-env --allow-net --allow-read --allow-write --allow-run

import { $, invariant } from "../../mod.ts";
import { type InstallerMeta, pamkit } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

let version = "";
await $.onMac(async () => {
	if (await pamkit.brewAppMissing("zoom")) {
		await $`brew install --cask zoom`.env({ HOMEBREW_NO_ANALYTICS: "1" });
	}
});

await $.onLinux(async () => {
	if (await $.commandMissing("zoom")) {
		const releaseInfoPath = $.path.join(dotAppPath, pamkit.constants.jsonReleaseInfoName);
		const debInstallerPath = $.path.join(dotAppPath, "zoom.deb");

		const releaseInfo = await $.request("https://zoom.us/rest/download?os=linux").json();
		await Deno.writeTextFile(releaseInfoPath, JSON.stringify(releaseInfo, null, 2));

		const latestVersionFull = releaseInfo?.result?.downloadVO?.zoom?.displayVersion ?? ""; // "5.13.3 (651)"
		const latestVersion = latestVersionFull?.split(" ")?.at(0) ?? ""; // "5.13.3"

		invariant(typeof latestVersion === "string" && latestVersion.length > 0, "no version found");

		await $.streamDownload("https://zoom.us/client/latest/zoom_amd64.deb", debInstallerPath);

		await $`sudo apt install -y ${debInstallerPath}`;

		version = latestVersion;
	}
});

const meta: InstallerMeta = {
	name: $.$dirname(import.meta.url, true),
	path: $.$dirname(import.meta.url),
	type: "installed-managed",
	version,
	lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, pamkit.constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
