#!/usr/bin/env -S deno run --allow-sys --allow-env --allow-net --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { pamkit } from "../_cli/pamkit.ts";

const [meta] = await pamkit.getInstallerMetas(new Set([$.$dirname(import.meta.url, true)]));

const outdatedCheck = await pamkit.wrapOutdatedCheck(meta, 3, async () => {
	return await Promise.resolve("0.0.1"); // Actual version strings look like `wezterm 20240203-110809-5046fc22`...just hard code that we're out of date
});

await $`echo ${JSON.stringify(outdatedCheck)}`.printCommand(false);
