#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { pamkit } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);

if (await $.commandExists("exercism")) {
	if ($.env.OS /* TODO: refactor to os helpers */ === "darwin") {
		await $`brew uninstall exercism`.env({ HOMEBREW_NO_ANALYTICS: "1" });
	} else {
		await pamkit.unlinkBinaryFromUserPath("exercism");
	}

	const workspaceDir = $.path.join($.env.STANDARD_DIRS.CODE, "exercism");
	if (await $.exists(workspaceDir)) {
		await Deno.remove(workspaceDir, { recursive: true });
	}
}

if (await $.exists(dotAppPath)) {
	await Deno.remove(dotAppPath, { recursive: true });
}
