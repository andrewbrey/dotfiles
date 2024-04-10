#!/usr/bin/env -S deno run --allow-sys --allow-env --allow-net --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { pamkit } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);

await $.onMac(async () => {
	if (await pamkit.brewAppInstalled("wezterm")) {
		await $`brew uninstall --cask wezterm`.env({ HOMEBREW_NO_ANALYTICS: "1" });
	}
});

await $.onLinux(async () => {
	if (await $.commandExists("wezterm")) {
		await pamkit.unlinkDesktopFileForApp("wezterm");
		const linkPath = await pamkit.unlinkBinaryFromUserPath("wezterm");

		const xTerminalEmulator = await $.which("x-terminal-emulator");
		if (typeof xTerminalEmulator !== "undefined") {
			await $`sudo update-alternatives --remove x-terminal-emulator ${linkPath}`;
		}

		$.logWarn(
			"warn:",
			$.dedent`
				you can set the default terminal to something other than wezterm with:

				${$.colors.magenta("sudo update-alternatives --config x-terminal-emulator")}

			`,
		);
	}
});

if (await $.exists(dotAppPath)) {
	await Deno.remove(dotAppPath, { recursive: true });
}
