#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { pamkit } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);

if (await $.commandExists("obsidian")) {
  if ($.env.OS === "darwin") {
    await $`brew uninstall --cask obsidian`.env({ HOMEBREW_NO_ANALYTICS: "1" });
  } else {
    await pamkit.unlinkDesktopFileForApp("obsidian");
    await pamkit.unlinkBinaryFromUserPath("obsidian");
  }
}

if (await $.exists(dotAppPath)) {
  await Deno.remove(dotAppPath, { recursive: true });
}
