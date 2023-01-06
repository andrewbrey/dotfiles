#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net=deno.land --allow-read --allow-write --allow-run

import { $, dedent, env, getChezmoiData, invariant, osInvariant } from "../../mod.ts";

osInvariant();

const chezmoiData = await getChezmoiData();

if (env.OS === "darwin") {
  $.logGroup(() => {
    $.logWarn(
      "warn:",
      dedent(`
				skipping network settings for mac

			`),
    );
  });
} else {
  if (
    !env.IN_CONTAINER && chezmoiData.is_personal_machine &&
    (chezmoiData.is_popos || chezmoiData.is_ubuntu)
  ) {
    invariant(typeof (await $.which("nmcli")) !== "undefined", "nmcli is required");

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
      const aciveWifiIPV4DNS = activeWifiDeviceFacts.find((f) => f.includes("IP4.DNS"))?.split(":")
        ?.at(1)?.trim() ?? "";

      const piholeLocalAddress = "192.168.0.40";

      if (aciveWifiIPV4DNS !== piholeLocalAddress) {
        await $`nmcli con mod ${activeWifiName} ipv4.dns ${piholeLocalAddress}`;

        // Ensure that we only use the static pihole ipv4 address for dns resolution, and
        // don't allow ipv6 dns lookups to take priority (subverting pihole)
        await $`nmcli con mod ${activeWifiName} ipv6.method "disabled"`;

        await $`nmcli con down ${activeWifiName}`;
        await $.sleep("5s");
        await $`nmcli con up ${activeWifiName}`;
      }
    }
  }
}
