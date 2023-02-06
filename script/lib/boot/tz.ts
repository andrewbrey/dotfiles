import { $, type Logger } from "../mod.ts";

export async function autoTZ(logger: Logger, artifactsPath: string) {
	const marker = $.path.join(artifactsPath, ".auto_tz");

	if (await $.exists(marker)) {
		logger.info("marker file already exists, skipping autoTZ");
	} else {
		const { time_zone } = await $.request("https://ifconfig.co").json();

		await Deno.writeTextFile(marker, time_zone);
		logger.info(
			`marker set for autoTZ, timezone will be set to ${time_zone} for subsequent shells`,
		);
	}
}
