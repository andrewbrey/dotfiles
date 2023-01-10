#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { constants, flatpakAppInstalled } from "../_cli/pamkit.ts";

await $.requireCommand("flatpak", "pam install -a flatpak");

const dotAppPath = $.path.join($.$dirname(import.meta.url), constants.appArtifactsDir);

const isInstalled = await flatpakAppInstalled("Blanket");
if (isInstalled) {
  if ($.env.OS === "linux") {
    await $`flatpak uninstall -y flathub com.rafaelmardojai.Blanket`;
  }
}

if (await $.exists(dotAppPath)) {
  await Deno.remove(dotAppPath, { recursive: true });
}
