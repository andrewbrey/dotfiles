#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { constants, unlinkBinaryFromUserPath, unlinkDesktopFileForApp } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), constants.appArtifactsDir);

if (await $.commandExists("beekeeper-studio")) {
  if ($.env.OS === "darwin") {
    await $`brew uninstall --cask beekeeper-studio`.env({ HOMEBREW_NO_ANALYTICS: "1" });
  } else {
    await unlinkDesktopFileForApp("beekeeper-studio");
    await unlinkBinaryFromUserPath("beekeeper-studio");
  }
}

if (await $.exists(dotAppPath)) {
  await Deno.remove(dotAppPath, { recursive: true });
}
