#!/usr/bin/env -S deno run --allow-sys --allow-env --allow-net=deno.land --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { pamkit } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);

const installRootPath = $.path.join("/", "usr", "lib", "pop-launcher", "scripts");
const dirLinkInstallPath = $.path.join(installRootPath, $.env.USER);

const installed = await $.exists(dirLinkInstallPath);
if (installed) {
	const chezmoiData = await $.getChezmoiData();

	if (chezmoiData.is_popos) {
		await $`sudo rm -f ${dirLinkInstallPath}`;
	}
}

if (await $.exists(dotAppPath)) {
	await Deno.remove(dotAppPath, { recursive: true });
}
