#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net=deno.land --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { pamkit } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);

if (await $.commandExists("python3")) {
	if ($.env.OS /* TODO: refactor to os helpers */ === "darwin") {
		await $`brew uninstall python3`.env({ HOMEBREW_NO_ANALYTICS: "1" });
	} else {
		await $`sudo apt purge -y python3 python3-pip`;

		await pamkit.unlinkBinaryFromUserPath("python");
	}
}

if (await $.exists(dotAppPath)) {
	await Deno.remove(dotAppPath, { recursive: true });
}
