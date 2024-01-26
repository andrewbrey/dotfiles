#!/usr/bin/env -S deno run --allow-sys --allow-env --allow-net --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { pamkit } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);

await $.onMac(async () => {
	if (await pamkit.brewAppInstalled("spotify")) {
		await $`brew uninstall --cask spotify`.env({ HOMEBREW_NO_ANALYTICS: "1" });
	}
});

await $.onLinux(async () => {
	if (await $.commandExists("spotify")) {
		await $.requireCommand("snap", "pam install -a snapd");

		await $`sudo snap remove spotify`;
	}
});

if (await $.exists(dotAppPath)) {
	await Deno.remove(dotAppPath, { recursive: true });
}
