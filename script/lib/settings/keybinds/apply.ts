#!/usr/bin/env -S deno run --allow-env --allow-net=deno.land --allow-read --allow-write --allow-run

import { $, dedent, env, getChezmoiData, invariant, osInvariant } from "../../mod.ts";

osInvariant();

const chezmoiData = await getChezmoiData();

if (env.OS === "darwin") {
  $.logGroup(() => {
    $.logWarn(
      "warn:",
      dedent(`
				skipping media key settings for mac

			`),
    );
  });
} else {
  if (!env.IN_CONTAINER && (chezmoiData.is_popos || chezmoiData.is_ubuntu)) {
    invariant(typeof (await $.which("dconf")) !== "undefined", "dconf is required");

    const loadKey = "/org/gnome/settings-daemon/plugins/media-keys/";
    const dconfSrc = `${env.STANDARD_DIRS.DOT_DOTS_SETTINGS}/keybinds/.keybinds.dconf`;

    await $`dconf load ${loadKey}`.stdin(await Deno.readTextFile(dconfSrc));
  }
}
