#!/usr/bin/env -S deno run --allow-env --allow-net=deno.land --allow-read --allow-write --allow-run

import { $, colors, dedent, env, getChezmoiData, invariant, osInvariant } from "../../mod.ts";

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
    const desiredHostname = chezmoiData.is_popos
      ? "poppy"
      : chezmoiData.is_ubuntu
      ? "ubby"
      : "compytron";

    const hostnameStatus = await $`hostnamectl status`.text();
    const currentHostnameMatch = hostnameStatus.match(/Static hostname:.+/i);
    const currentHostname = currentHostnameMatch?.at(0)?.split(": ").at(1)?.trim() ?? "";

    invariant(currentHostname !== "", "unable to determine current hostname");

    $.logGroup(() => {
      $.logStep(
        "step:",
        dedent(`
					current hostname: ${colors.yellow(currentHostname)}
					desired hostname: ${colors.blue(desiredHostname)}

					applying required update with hostnamectl

				`),
      );
    });

    await $`sudo hostnamectl set-hostname ${desiredHostname}`;
    await $`sudo sed -i "s/${currentHostname}/${desiredHostname}/g" /etc/hosts`;
  }
}
