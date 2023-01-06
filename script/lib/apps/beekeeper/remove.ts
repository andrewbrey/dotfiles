#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net --allow-read --allow-write --allow-run

import { $, $dirname, env, osInvariant } from "../../mod.ts";
import { constants, unlinkBinaryFromUserPath, unlinkDesktopFileForApp } from "../_cli/pamkit.ts";

osInvariant();

const dotAppPath = $.path.join($dirname(import.meta.url), constants.appArtifactsDir);

const isInstalled = typeof (await $.which("beekeeper-studio")) !== "undefined";
if (isInstalled) {
  if (env.OS === "darwin") {
    await $`brew uninstall --cask beekeeper-studio`.env({ HOMEBREW_NO_ANALYTICS: "1" });
  } else {
    await unlinkDesktopFileForApp("beekeeper-studio");
    await unlinkBinaryFromUserPath("beekeeper-studio");
  }
}

if (await $.exists(dotAppPath)) {
  await Deno.remove(dotAppPath, { recursive: true });
}
