#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { pamkit } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);

await $.onMac(async () => {
	if (await pamkit.brewAppInstalled("mockoon")) {
		await $`brew uninstall --cask mockoon`.env({ HOMEBREW_NO_ANALYTICS: "1" });
	}
});

await $.onLinux(async () => {
	if (await $.commandExists("mockoon")) {
		await $.requireCommand("snap", "pam install -a snapd");

		await $`sudo snap remove mockoon`;
	}
});

if (await $.exists(dotAppPath)) {
	await Deno.remove(dotAppPath, { recursive: true });
}
