#!/usr/bin/env -S deno run --allow-sys --allow-env --allow-net --allow-read --allow-write --allow-run

import { $, invariant } from "../../mod.ts";
import { type InstallerMeta, pamkit } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

if (await $.commandMissing("go")) {
	if ($.env.OS /* TODO: refactor to os helpers */ === "darwin") {
		await $`brew install go`.env({ HOMEBREW_NO_ANALYTICS: "1" });
	} else {
		const releaseInfoPath = $.path.join(dotAppPath, pamkit.constants.plainReleaseInfoName);
		const latestVersionText = await $.request("https://golang.org/VERSION?m=text")
			.text();
		const latestVersion = latestVersionText.split("\n").at(0);

		invariant(
			typeof latestVersion !== "undefined",
			`unable to parse latest version from response: ${latestVersionText}`,
		);

		await Deno.writeTextFile(releaseInfoPath, latestVersion);

		const artifactPath = $.path.join(dotAppPath, "golang.tar.gz");

		await $.streamDownload(
			`https://golang.org/dl/${latestVersion}.linux-amd64.tar.gz`,
			artifactPath,
		);

		await $`sudo rm -rf /usr/local/go`;
		await $`sudo tar -C /usr/local -xzf ${artifactPath}`;
	}
}

const versionOutput = await $`go version`.text(); // go version go1.16.5 linux/amd64
const version = versionOutput.split(" ")?.at(2)?.split("go")?.at(1) ?? "";

const meta: InstallerMeta = {
	name: $.$dirname(import.meta.url, true),
	path: $.$dirname(import.meta.url),
	type: $.env.OS === "darwin" ? "installed-managed" : "installed-manual",
	version,
	lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, pamkit.constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
