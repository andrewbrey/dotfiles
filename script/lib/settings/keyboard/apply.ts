#!/usr/bin/env -S deno run --allow-sys --allow-env --allow-net=deno.land --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";

await $.onMac(async () => {
	$.logGroup(() => {
		$.logWarn(
			"warn:",
			$.dedent`
				skipping keyboard settings for mac

			`,
		);
	});

	return await Promise.resolve();
});

await $.onLinux(async () => {
	const chezmoiData = await $.getChezmoiData();

	if (!$.env.IN_CONTAINER && (chezmoiData.is_popos || chezmoiData.is_ubuntu)) {
		// @see https://bugs.launchpad.net/ubuntu/+source/linux/+bug/1814481
		//      https://www.mail-archive.com/ubuntu-bugs@lists.ubuntu.com/msg5952976.html
		//      https://superuser.com/questions/79822/how-to-swap-the-fn-use-of-function-keys-on-an-apple-keyboard-in-linux

		const fnKeyBehaviorCurrentSession = "/sys/module/hid_apple/parameters/fnmode";
		const sessionSetting = "0";
		if (await $.exists(fnKeyBehaviorCurrentSession)) {
			const currentSetting = await $.raw`sudo cat ${fnKeyBehaviorCurrentSession}`.text();

			if (currentSetting?.trim() !== sessionSetting) {
				await $.raw`sudo tee ${fnKeyBehaviorCurrentSession}`.stdinText(sessionSetting);
			}
		}

		const fnKeyBehaviorPersist = "/etc/modprobe.d/hid_apple.conf";
		const persistSetting = "options hid_apple fnmode=2";
		if (await $.exists(fnKeyBehaviorPersist)) {
			const currentSetting = await $.raw`sudo cat ${fnKeyBehaviorPersist}`.text();
			if (currentSetting?.trim() === persistSetting) Deno.exit(0);
		}

		await $.raw`sudo mkdir -p ${$.path.dirname(fnKeyBehaviorPersist)}`;
		await $.raw`sudo touch ${fnKeyBehaviorPersist}`;
		await $.raw`sudo tee ${fnKeyBehaviorPersist}`.stdinText(persistSetting);

		await $`sudo update-initramfs -u`;
	}
});
