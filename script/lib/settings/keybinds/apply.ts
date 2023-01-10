#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net=deno.land --allow-read --allow-write --allow-run

import { $, invariant } from "../../mod.ts";

const chezmoiData = await $.getChezmoiData();

if ($.env.OS === "darwin") {
  $.logGroup(() => {
    $.logWarn(
      "warn:",
      $.dedent`
				skipping media key settings for mac

			`,
    );
  });
} else {
  if (!$.env.IN_CONTAINER && (chezmoiData.is_popos || chezmoiData.is_ubuntu)) {
    await $.requireCommand("dconf");
    await $.requireCommand("wmctrl", "pam install -a peer-tools");

    const loadKey = "/org/gnome/settings-daemon/plugins/media-keys/";
    const dconfSrc = `${$.env.STANDARD_DIRS.DOT_DOTS_SETTINGS}/keybinds/.keybinds.dconf`;

    await $`dconf load ${loadKey}`.stdin(await Deno.readTextFile(dconfSrc));
  }
}
