#!/usr/bin/env -S deno run --allow-sys --allow-env --allow-net=deno.land --allow-read --allow-write --allow-run

import { $, invariant } from "../../mod.ts";

await $.onMac(async () => {
	$.logGroup(() => {
		$.logWarn(
			"warn:",
			$.dedent`
				skipping hostname settings for mac

			`,
		);
	});

	return await Promise.resolve();
});

await $.onLinux(async () => {
	const chezmoiData = await $.getChezmoiData();

	if (!$.env.IN_CONTAINER && (chezmoiData.is_popos || chezmoiData.is_ubuntu)) {
		await $.requireCommand("hostnamectl");

		// TODO: change this to a prompt with these as defaults
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
				$.dedent`

					current hostname: ${$.colors.yellow(currentHostname)}
					desired hostname: ${$.colors.blue(desiredHostname)}

				`,
			);
		});

		if (currentHostname !== desiredHostname) {
			$.logLight(" debug: ", "applying required update with hostnamectl");

			await $.raw`sudo hostnamectl set-hostname "${desiredHostname}"`;
			await $.raw`sudo sed -i "s/${currentHostname}/${desiredHostname}/g" /etc/hosts`;
		}
	}
});
