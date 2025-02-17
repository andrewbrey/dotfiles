#!/usr/bin/env -S deno run --allow-sys --allow-env --allow-net --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { pamkit } from "../_cli/pamkit.ts";

const [meta] = await pamkit.getInstallerMetas(new Set([$.$dirname(import.meta.url, true)]));

const outdatedCheck = await pamkit.wrapOutdatedCheck(meta, 3, async () => {
	if ($.env.OS /* TODO: refactor to os helpers */ === "darwin") {
		return ""; // managed on darwin
	} else {
		const releaseInfo = await $.ghReleaseInfo("beekeeper-studio", "ultimate-releases");
		const { tag_name } = releaseInfo;
		const latest = tag_name.split("v")?.at(1) ?? "";

		return latest;
	}
});

await $`echo ${JSON.stringify(outdatedCheck)}`.printCommand(false);
