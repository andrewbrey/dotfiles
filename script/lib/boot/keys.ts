import { $, type Logger } from "../mod.ts";

export async function keyFetchRequest(logger: Logger, artifactsPath: string) {
  const marker = $.path.join(artifactsPath, ".key_fetch_request");

  if (await $.exists(marker)) {
    logger.info("marker file already exists, skipping keyFetchRequest");
  } else {
    const hosts = $.requireEnv("SECRET_BOOT_KEY_FETCH_HOSTS").split(/,\s*/);
    const port = 4057;
    for (const host of hosts) {
      try {
        logger.info(`trying ${host} with a keyFetch request`);

        await $.request(`http://${host}:${port}`).timeout(2_000);
      } catch (error) {
        logger.error(`keyFetchRequest failed for http://${host}:${port}`);
        logger.error(error);
      }
    }

    await Deno.writeTextFile(marker, "ok");
    logger.info(`marker set for keyFetchRequest`);
  }
}
