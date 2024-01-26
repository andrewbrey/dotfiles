#!/usr/bin/env -S deno run --allow-sys --allow-env --allow-net --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { pamkit } from "../_cli/pamkit.ts";

await $.requireCommand("snap", "pam install -a snapd");

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);

if ($.env.OS /* TODO: refactor to os helpers */ === "linux") {
	if (await $.commandExists("snapcraft")) {
		await $`sudo snap remove snapcraft`;
	}

	if (await $.commandExists("snap-review")) {
		await $`sudo snap remove snap-review`;
	}
}

if (await $.exists(dotAppPath)) {
	await Deno.remove(dotAppPath, { recursive: true });
}
