#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { pamkit } from "../_cli/pamkit.ts";

await $.requireCommand("flatpak", "pam install -a flatpak");

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);

if (await pamkit.flatpakAppInstalled("Kooha")) {
  if ($.env.OS === "linux") {
    await $`flatpak uninstall -y flathub io.github.seadve.Kooha`;
  }
}

if (await $.exists(dotAppPath)) {
  await Deno.remove(dotAppPath, { recursive: true });
}
