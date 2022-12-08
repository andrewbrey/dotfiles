#!/usr/bin/env -S deno run --allow-env --allow-net=deno.land --allow-read --allow-write --allow-run

import { $, dedent, env, getChezmoiData, osInvariant } from "../../mod.ts";

osInvariant();

const chezmoiData = await getChezmoiData();

if (env.OS === "darwin") {
  $.logGroup(() => {
    $.logWarn(
      "warn:",
      dedent(`
				skipping keyboard settings for mac

			`),
    );
  });
} else {
  if (!env.IN_CONTAINER && (chezmoiData.is_popos || chezmoiData.is_ubuntu)) {
    // @see https://bugs.launchpad.net/ubuntu/+source/linux/+bug/1814481
    //      https://www.mail-archive.com/ubuntu-bugs@lists.ubuntu.com/msg5952976.html
    //      https://superuser.com/questions/79822/how-to-swap-the-fn-use-of-function-keys-on-an-apple-keyboard-in-linux

    const fnKeyBehaviorCurrentSession = "/sys/module/hid_apple/parameters/fnmode";
    if (await $.exists(fnKeyBehaviorCurrentSession)) {
      await $.raw`sudo tee ${fnKeyBehaviorCurrentSession}`.stdin("0");
    }

    const fnKeyBehaviorPersist = "/etc/modprobe.d/hid_apple.conf";
    await $.raw`sudo mkdir -p ${$.path.dirname(fnKeyBehaviorPersist)}`;
    await $.raw`sudo touch ${fnKeyBehaviorPersist}`;
    await $.raw`sudo tee ${fnKeyBehaviorPersist}`.stdin("options hid_apple fnmode=2");

    await $`sudo update-initramfs -u`;
  }
}
