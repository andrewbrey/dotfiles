#!/usr/bin/env -S deno run --allow-env --allow-net --allow-read --allow-write --allow-run

import { $, $dirname, env, osInvariant } from "../../mod.ts";
import { constants, unlinkBinaryFromUserPath, unlinkDesktopFileForApp } from "../_cli/pamkit.ts";

osInvariant();

const dotAppPath = $.path.join($dirname(import.meta.url), constants.appArtifactsDir);

const isInstalled = typeof (await $.which("obsidian")) !== "undefined";
if (isInstalled) {
  if (env.OS === "darwin") {
    await $`brew uninstall --cask obsidian`.env({ HOMEBREW_NO_ANALYTICS: "1" });
  } else {
    await unlinkDesktopFileForApp("obsidian");
    await unlinkBinaryFromUserPath("obsidian");
  }
}

if (await $.exists(dotAppPath)) {
  await Deno.remove(dotAppPath, { recursive: true });
}
