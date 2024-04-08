#!/usr/bin/env -S deno run --allow-sys --allow-env --allow-net --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { type InstallerMeta, pamkit } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

if (await $.commandMissing("wezterm")) {
	await $.requireCommand("eget", "pam install -a eget");

	const binaryPath = $.path.join(dotAppPath, "wezterm");

	// install the AppImage
	await $`eget --to ${binaryPath} wez/wezterm`.env({
		EGET_GITHUB_TOKEN: $.env.GH_TOKEN,
	});

	const linkPath = await pamkit.linkBinaryToUserPath(binaryPath, "wezterm");
	await pamkit.linkDesktopFileForApp("wezterm");

	const xTerminalEmulator = await $.which("x-terminal-emulator");
	if (typeof xTerminalEmulator !== "undefined") {
		await $`sudo update-alternatives --install ${xTerminalEmulator} x-terminal-emulator ${linkPath} 50`;
	}

	$.logWarn(
		"warn:",
		$.dedent`
			you can set the default terminal to wezterm with:

			${$.colors.magenta("sudo update-alternatives --config x-terminal-emulator")}

		`,
	);
}

const meta: InstallerMeta = {
	name: $.$dirname(import.meta.url, true),
	path: $.$dirname(import.meta.url),
	type: "installed-manual",
	version: "0.0.0", // Actual version strings look like `wezterm 20240203-110809-5046fc22`...just hard code that we're out of date
	lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, pamkit.constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
