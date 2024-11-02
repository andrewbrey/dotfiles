#!/usr/bin/env -S deno run --allow-sys --allow-env --allow-net --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { pamkit } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);

if (await $.commandExists("rustyvibes")) {
	const cargoPath = $.path.join($.env.HOME, ".cargo");
	const binPath = $.path.join(cargoPath, "bin", "kanata");

	if (await $.exists(binPath)) {
		await Deno.remove(binPath);
	}
}

if (await $.exists(dotAppPath)) {
	await Deno.remove(dotAppPath, { recursive: true });
}
