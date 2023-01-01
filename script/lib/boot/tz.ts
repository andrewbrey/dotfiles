import { $, log } from "../mod.ts";

export async function autoTZ(logger: log.Logger) {
  const { time_zone } = await $.request("ifconfig.co").json();

  logger.info(time_zone);
}
