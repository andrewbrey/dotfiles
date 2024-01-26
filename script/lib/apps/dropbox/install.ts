#!/usr/bin/env -S deno run --allow-sys --allow-env --allow-net --allow-read --allow-write --allow-run

import { $, invariant } from "../../mod.ts";
import { type InstallerMeta, pamkit } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

await $.onMac(async () => {
	if (await pamkit.brewAppMissing("dropbox")) {
		await $`brew install --cask dropbox`.env({ HOMEBREW_NO_ANALYTICS: "1" });
	}
});

await $.onLinux(async () => {
	if (await $.commandMissing("dropbox")) {
		const releaseInfoPath = $.path.join(dotAppPath, pamkit.constants.htmlReleaseInfoName);
		const debInstallerPath = $.path.join(dotAppPath, "dropbox.deb");
		let releaseInfo = "";

		await $.runInBrowser(async (page) => {
			await page.goto("https://www.dropbox.com/install-linux", { waitUntil: "networkidle2" });
			releaseInfo = await page.content();
		});

		invariant(releaseInfo.length > 0, "unable to fetch release information");

		await Deno.writeTextFile(releaseInfoPath, releaseInfo);

		const debURI = releaseInfo.match(/href="(\/download\?dl=packages.+ubuntu.+amd64\.deb)"/)
			?.at(1); // <a href="/download?dl=packages/ubuntu/dropbox_2020.03.04_amd64.deb">64-bit</a>

		invariant(typeof debURI === "string" && debURI.length > 0, "unable to determine download");

		await $.streamDownload(`https://dropbox.com${debURI}`, debInstallerPath);

		await $`sudo apt install -y ${debInstallerPath}`;
	}
});

const versionOutput = await $`dropbox version`.lines(); // Dropbox daemon version: 164.3.7907\nDropbox command-line interface version: 2020.03.04
const version = versionOutput?.at(1)?.split(" ")?.at(-1) ?? "";

const meta: InstallerMeta = {
	name: $.$dirname(import.meta.url, true),
	path: $.$dirname(import.meta.url),
	type: "installed-managed",
	version,
	lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, pamkit.constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
