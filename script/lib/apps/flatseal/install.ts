#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net=deno.land --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { type InstallerMeta, pamkit } from "../_cli/pamkit.ts";

await $.requireCommand("flatpak", "pam install -a flatpak");

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

await $.onLinux(async () => {
	if (await pamkit.flatpakAppMissing("Flatseal")) {
		await $`flatpak install -y --user com.github.tchx84.Flatseal`;
	}
});

const meta: InstallerMeta = {
	name: $.$dirname(import.meta.url, true),
	path: $.$dirname(import.meta.url),
	type: "installed-managed",
	version: "",
	lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, pamkit.constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
