#!/usr/bin/env -S deno run --allow-sys --allow-env --allow-net --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { pamkit } from "../_cli/pamkit.ts";

await $.requireCommand("flatpak", "pam install -a flatpak");

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);

const isInstalled = await pamkit.flatpakAppInstalled("Blanket");
if (isInstalled) {
	if ($.env.OS /* TODO: refactor to os helpers */ === "linux") {
		await $`flatpak uninstall -y flathub com.rafaelmardojai.Blanket`;
	}
}

if (await $.exists(dotAppPath)) {
	await Deno.remove(dotAppPath, { recursive: true });
}
