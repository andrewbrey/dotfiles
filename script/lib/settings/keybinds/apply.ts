#!/usr/bin/env -S deno run --allow-sys --allow-env --allow-net=deno.land --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";

await $.onMac(async () => {
	$.logGroup(() => {
		$.logWarn(
			"warn:",
			$.dedent`
				skipping media key settings for mac

			`,
		);
	});

	return await Promise.resolve();
});

await $.onLinux(async () => {
	const chezmoiData = await $.getChezmoiData();

	if (!$.env.IN_CONTAINER && (chezmoiData.is_popos || chezmoiData.is_ubuntu)) {
		await $.requireCommand("dconf");
		await $.requireCommand("wmctrl", "pam install -a peer-tools");

		const loadKey = "/org/gnome/settings-daemon/plugins/media-keys/";
		const dconfSrc = `${$.env.STANDARD_DIRS.DOT_DOTS_SETTINGS}/keybinds/.keybinds.dconf`;

		await $`dconf load ${loadKey}`.stdinText(await Deno.readTextFile(dconfSrc));
	}
});
