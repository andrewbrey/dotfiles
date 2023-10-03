#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { type InstallerMeta, pamkit } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

await $.onMac(async () => {
	if (await pamkit.brewAppMissing("tuple")) {
		await $`brew install --cask tuple`.env({ HOMEBREW_NO_ANALYTICS: "1" });
	}
});

await $.onLinux(async () => {
	await $.requireCommand("flatpak", "pam install -a flatpak");

	if (await pamkit.flatpakAppMissing("Tuple")) {
		await $`flatpak remote-add --if-not-exists --user flathub https://dl.flathub.org/repo/flathub.flatpakrepo`;
		await $`flatpak install --user flathub org.gnome.Platform//44`;
		await $`flatpak install --user https://tuple.app/tuple.flatpakref`;
		await $`flatpak permission-set flatpak updates app.tuple.app yes`;
		await $`flatpak permission-set flatpak background app.tuple.app yes`;
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
