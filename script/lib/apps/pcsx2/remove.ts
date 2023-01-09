#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net --allow-read --allow-write --allow-run

import { $, invariant } from "../../mod.ts";
import { constants, flatpakAppInstalled } from "../_cli/pamkit.ts";

invariant(typeof (await $.which("flatpak")) !== "undefined", "flatpak is required");

const dotAppPath = $.path.join($.$dirname(import.meta.url), constants.appArtifactsDir);

const isInstalled = await flatpakAppInstalled("PCSX2");
if (isInstalled) {
  if ($.env.OS === "linux") {
    await $`flatpak uninstall -y flathub net.pcsx2.PCSX2`;
  }
}

if (await $.exists(dotAppPath)) {
  await Deno.remove(dotAppPath, { recursive: true });
}
