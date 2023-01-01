import { $, log } from "../mod.ts";

export async function keyFetchRequest(logger: log.Logger, artifactsPath: string) {
  const marker = $.path.join(artifactsPath, ".key_fetch_request");

  if (await $.exists(marker)) {
    logger.info("marker file already exists, skipping keyFetchRequest");
  } else {
    await Deno.writeTextFile(marker, "ok");

    const hosts = ["192.168.0.40", "192.168.0.56"];
    const port = 4057;
    for (const host of hosts) {
      try {
        await $.request(`http://${host}:${port}`);
      } catch (error) {
        logger.error(`keyFetchRequest failed for http://${host}:${port}`);
        logger.error(error);
      }
    }

    logger.info(`marker set for keyFetchRequest`);
  }
}
