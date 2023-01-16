#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net=deno.land --allow-read --allow-write --allow-run

import { $, invariant } from "../../mod.ts";

const chezmoiData = await $.getChezmoiData();

if ($.env.OS === "darwin") {
  $.logGroup(() => {
    $.logWarn(
      "warn:",
      $.dedent`
				skipping network settings for mac

			`,
    );
  });
} else {
  if (
    !$.env.IN_CONTAINER && chezmoiData.is_personal_machine &&
    (chezmoiData.is_popos || chezmoiData.is_ubuntu)
  ) {
    await $.requireCommand("nmcli");

    const ipv4DNS = $.requireEnv("SECRET_DNS_ADBLOCK_IPV4_ADDRESS");
    const ipv6DNS = $.requireEnv("SECRET_DNS_ADBLOCK_IPV6_ADDRESS");

    const activeNetworks = await $`nmcli con show --active`.lines();
    const activeWifiLine = activeNetworks.find((a) => a.includes("wifi"));

    if (!activeWifiLine) {
      $.logWarn("warn:", "no active wifi connection, skipping dns update for wifi");
    } else {
      const [activeWifiName, _id, _type, activeWifiDevice] = activeWifiLine.split(" ")
        .filter(Boolean).map((i) => i.trim());

      invariant(
        activeWifiName !== "" && typeof activeWifiName !== "undefined",
        "could not determine active wifi name",
      );
      invariant(
        activeWifiDevice !== "" && typeof activeWifiDevice !== "undefined",
        "could not determine active wifi device",
      );

      const activeWifiDeviceFacts = await $`nmcli device show ${activeWifiDevice}`.lines();

      const activeWifiIPV4DNS = activeWifiDeviceFacts.find((f) => f.includes("IP4.DNS"))?.split(":")
        ?.at(1)?.trim() ?? "";
      const activeWifiIPV6DNS = activeWifiDeviceFacts.find((f) => f.includes("IP6.DNS"))?.split(":")
        ?.slice(1)?.join(":")?.trim() ?? "";

      if (activeWifiIPV4DNS !== ipv4DNS || activeWifiIPV6DNS !== ipv6DNS) {
        await $`nmcli con mod ${activeWifiName} ipv4.dns ${ipv4DNS}`;
        await $`nmcli con mod ${activeWifiName} ipv6.dns ${ipv6DNS}`;

        await $`nmcli con down ${activeWifiName}`;
        await $.sleep("5s");
        await $`nmcli con up ${activeWifiName}`;
      } else {
        $.logStep("  ok:", "dns already correctly configured");
      }
    }
  }
}
