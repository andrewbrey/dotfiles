#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net --allow-read --allow-write --allow-run

import { $, invariant } from "../../mod.ts";
import { constants } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), constants.appArtifactsDir);

if (await $.commandExists("intellij-idea-ultimate")) {
  if ($.env.OS === "darwin") {
    await $`brew uninstall --cask intellij-idea`.env({ HOMEBREW_NO_ANALYTICS: "1" });
  } else {
    await $.requireCommand("snap", "pam install -a snapd");

    await $`sudo snap remove intellij-idea-ultimate`;
  }
}

if (await $.exists(dotAppPath)) {
  await Deno.remove(dotAppPath, { recursive: true });
}
