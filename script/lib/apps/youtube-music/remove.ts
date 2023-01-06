#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net=deno.land --allow-read --allow-write --allow-run

import { $, $dirname, env, osInvariant } from "../../mod.ts";
import { constants, unlinkBinaryFromUserPath, unlinkDesktopFileForApp } from "../_cli/pamkit.ts";

osInvariant();

const dotAppPath = $.path.join($dirname(import.meta.url), constants.appArtifactsDir);

const isInstalled = typeof (await $.which("youtube-music")) !== "undefined";
if (isInstalled) {
  if (env.OS === "darwin") {
    // TODO: need to uninstall from command line
    if (Math.random()) throw new Error("TODO: uninstall dmg from command line");
  } else {
    await unlinkDesktopFileForApp("youtube-music");
    await unlinkBinaryFromUserPath("youtube-music");
  }
}

if (await $.exists(dotAppPath)) {
  await Deno.remove(dotAppPath, { recursive: true });
}
