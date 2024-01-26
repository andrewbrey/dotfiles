#!/usr/bin/env -S deno run --allow-sys --allow-env --allow-net=deno.land,api.github.com --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { pamkit } from "../_cli/pamkit.ts";

const [meta] = await pamkit.getInstallerMetas(new Set([$.$dirname(import.meta.url, true)]));

const outdatedCheck = await pamkit.wrapOutdatedCheck(meta, 3, async () => {
	const releaseInfo = await $.ghReleaseInfo("sdushantha", "tmpmail");
	const { tag_name } = releaseInfo;
	const latest = tag_name.split("v")?.at(1) ?? "";

	return latest;
});

await $`echo ${JSON.stringify(outdatedCheck)}`.printCommand(false);
