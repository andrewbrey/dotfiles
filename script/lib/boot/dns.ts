import { $, invariant, type Logger } from "../mod.ts";

type CFDNSRecord = { name: string; type: string; content: string };

export async function etcHosts(logger: Logger, artifactsPath: string) {
  const marker = $.path.join(artifactsPath, ".hosts");

  if (await $.exists(marker)) {
    logger.info("marker file already exists, skipping etcHosts");
  } else {
    const zoneId = $.requireEnv("SECRET_CF_BREY_FAMILY_ZONE_ID");
    const apiToken = $.requireEnv("SECRET_CF_BREY_FAMILY_DNS_READ_TOKEN");

    const { result: dnsRecords } = await $.request(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`,
    ).header({ "Authorization": `Bearer ${apiToken}` }).json<{ result: CFDNSRecord[] }>();

    try {
      const ip = dnsRecords.find((r) => r.name === "brey.family" && r.type === "A")?.content;

      invariant(typeof ip === "string" && ip.length > 0, "missing required apex ip");

      const homelabHostsScript = $.path.join(
        $.env.STANDARD_DIRS.DOT_DOTS_SETTINGS,
        "hostsfile",
        ".homelab-hosts.sh",
      );

      await $`sudo ${homelabHostsScript} ${ip}`;
    } catch (error) {
      const message = "etcHosts failed, check dotsboot log for details";

      $.ntfyAlert(message, logger);
      logger.error(message);
      logger.error(error);
    }

    await Deno.writeTextFile(marker, "ok");
    logger.info(`marker set for etcHosts`);
  }
}
