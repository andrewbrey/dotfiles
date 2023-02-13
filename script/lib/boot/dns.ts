import { $, invariant, type Logger } from "../mod.ts";

export async function etcHosts(logger: Logger, artifactsPath: string) {
	const marker = $.path.join(artifactsPath, ".hosts");

	if (await $.exists(marker)) {
		logger.info("marker file already exists, skipping etcHosts");
	} else {
		const homelabIP = $.requireEnv("SECRET_HOMELAB_IPV4_ADDRESS");
		const atHome = await $.request(`http://${homelabIP}`).timeout(1000)
			.noThrow().fetch().then(({ status }) => status === 200).catch(() => false);

		const homelabHostsScript = $.path.join(
			$.env.STANDARD_DIRS.DOT_DOTS_SETTINGS,
			"hostsfile",
			".homelab-hosts.sh",
		);

		if (atHome) {
			logger.info("setting etcHosts for at-home dns");

			try {
				await $`sudo ${homelabHostsScript} ${homelabIP}`;
			} catch (error) {
				const message = "etcHosts failed, check dotsboot log for details";

				$.ntfyAlert(message, logger);
				logger.error(message);
				logger.error(error);
			}
		} else {
			logger.info("setting etcHosts for away-from-home dns");

			const password = $.requireEnv("SECRET_HOMELAB_HOSTS_API_PASSWORD");

			try {
				const ip = await $.request("https://dotfiles.andrewbrey.com/homelab-hosts")
					.header({ "x-homelab-hosts-api-password": password }).text();

				invariant(typeof ip === "string" && ip.length > 0, "missing required apex ip");

				await $`sudo ${homelabHostsScript} ${ip}`;
			} catch (error) {
				const message = "etcHosts failed, check dotsboot log for details";

				$.ntfyAlert(message, logger);
				logger.error(message);
				logger.error(error);
			}
		}

		await Deno.writeTextFile(marker, "ok");
		logger.info(`marker set for etcHosts`);
	}
}
