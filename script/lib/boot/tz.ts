import { $, type Logger } from "../mod.ts";

export async function autoTZ(logger: Logger, artifactsPath: string) {
  const tzFile = $.path.join(artifactsPath, ".auto_tz");

  if (await $.exists(tzFile)) {
    logger.info("timezone file already exists, skipping autoTZ");
  } else {
    const { time_zone } = await $.request("https://ifconfig.co").json();
    await Deno.writeTextFile(tzFile, time_zone);
    logger.info(`timezone will be set to ${time_zone} for subsequent shells`);
  }
}
