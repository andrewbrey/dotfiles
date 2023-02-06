#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net=deno.land --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";

const communityCheatPath = $.path.join(
	$.env.STANDARD_DIRS.DOT_DOTS_APPS,
	"cheat",
	"cheatsheets",
	"community",
);

if (await $.exists(communityCheatPath)) {
	await $`git -C ${communityCheatPath} pull`;
}
