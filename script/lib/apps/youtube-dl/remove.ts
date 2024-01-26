#!/usr/bin/env -S deno run --allow-sys --allow-env --allow-net --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { pamkit } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);

if (await $.commandExists("youtube-dl")) {
	if ($.env.OS /* TODO: refactor to os helpers */ === "darwin") {
		await $`brew uninstall youtube-dl`.env({ HOMEBREW_NO_ANALYTICS: "1" });
	} else {
		await pamkit.unlinkBinaryFromUserPath("youtube-dl");
	}
}

if (await $.exists(dotAppPath)) {
	await Deno.remove(dotAppPath, { recursive: true });
}
