#!/usr/bin/env -S deno run --allow-sys --allow-env --allow-net=deno.land --allow-read --allow-write --allow-run

import { $, invariant } from "../../mod.ts";
import { pamkit } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);

if (await $.commandExists("compose-switch")) {
	if ($.env.OS /* TODO: refactor to os helpers */ === "linux") {
		const composeSwitch = await $.which("compose-switch");
		invariant(typeof composeSwitch !== "undefined"); // safe, we already checked above
		await $`sudo rm -f ${composeSwitch}`;
	}
}

if (await $.exists(dotAppPath)) {
	await Deno.remove(dotAppPath, { recursive: true });
}
