#!/usr/bin/env -S deno run --allow-sys --allow-env --allow-net=deno.land --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { type InstallerMeta, pamkit } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

const installRootPath = $.path.join("/", "usr", "lib", "pop-launcher", "scripts");
const dirLinkInstallPath = $.path.join(installRootPath, $.env.USER);

const installed = await $.exists(dirLinkInstallPath);
if (!installed) {
	const chezmoiData = await $.getChezmoiData();

	// @see https://www.arm64.ca/post/creating-launch-plugins-for-pop-os-updated/
	if (chezmoiData.is_popos) {
		const dirLinkSrcPath = $.path.join(chezmoiData.standard_dirs.dot_dots_apps, "pop-launcher");

		await $`sudo mkdir -p ${installRootPath}`;
		await $`sudo ln -sf ${dirLinkSrcPath}/ ${dirLinkInstallPath}`;
	}
}

const meta: InstallerMeta = {
	name: $.$dirname(import.meta.url, true),
	path: $.$dirname(import.meta.url),
	type: "installed-managed",
	version: "",
	lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, pamkit.constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
