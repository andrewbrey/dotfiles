#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net=deno.land --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { constants, unlinkBinaryFromUserPath, unlinkDesktopFileForApp } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), constants.appArtifactsDir);

if (await $.commandExists("youtube-music")) {
  if ($.env.OS === "darwin") {
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
