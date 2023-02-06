#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net=deno.land --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { pamkit } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);

if (await $.commandExists("exa")) {
	if ($.env.OS /* TODO: refactor to os helpers */ === "darwin") {
		await $`brew uninstall exa`.env({ HOMEBREW_NO_ANALYTICS: "1" });
	} else {
		await $`sudo apt purge -y exa`;
	}
}

if (await $.exists(dotAppPath)) {
	await Deno.remove(dotAppPath, { recursive: true });
}
