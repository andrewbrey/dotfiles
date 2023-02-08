#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { pamkit } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);

await $.onMac(async () => {
	if (await pamkit.brewAppInstalled("tmux")) {
		await $`brew uninstall tmux`.env({ HOMEBREW_NO_ANALYTICS: "1" });
	}
});

await $.onLinux(async () => {
	if (await $.commandExists("tmux")) {
		await $`sudo apt purge -y tmux`;
	}
});

const pluginManagerPath = $.path.join($.env.HOME, ".tmux", "plugins", "tpm");
if (await $.exists(pluginManagerPath)) {
	await Deno.remove(pluginManagerPath, { recursive: true });
}

if (await $.exists(dotAppPath)) {
	await Deno.remove(dotAppPath, { recursive: true });
}
