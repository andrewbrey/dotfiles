#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { constants, flatpakAppInstalled } from "../_cli/pamkit.ts";

await $.requireCommand("flatpak");

const dotAppPath = $.path.join($.$dirname(import.meta.url), constants.appArtifactsDir);

if (await flatpakAppInstalled("Kooha")) {
  if ($.env.OS === "linux") {
    await $`flatpak uninstall -y flathub io.github.seadve.Kooha`;
  }
}

if (await $.exists(dotAppPath)) {
  await Deno.remove(dotAppPath, { recursive: true });
}
