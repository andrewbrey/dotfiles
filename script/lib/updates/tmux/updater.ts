#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net=deno.land --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";

const pluginManagerPath = $.path.join($.env.HOME, ".tmux");

if (await $.exists(pluginManagerPath)) {
	await $`git -C ${pluginManagerPath} pull`;
}
