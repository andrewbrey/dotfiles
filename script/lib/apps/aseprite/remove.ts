#!/usr/bin/env -S deno run --allow-env --allow-net --allow-read --allow-write --allow-run

import { $, $dirname, env, osInvariant } from "../../mod.ts";
import { constants } from "../_cli/pamkit.ts";

osInvariant();

const dotAppPath = $.path.join($dirname(import.meta.url), constants.appArtifactsDir);

const isInstalled = typeof (await $.which("aseprite")) !== "undefined";
if (isInstalled) {
  if (env.OS === "darwin") {
    // TODO: need to uninstall from command line
    if (Math.random()) throw new Error("TODO: uninstall dmg from command line");
  } else {
    await $`sudo apt purge -y aseprite`;
  }
}

if (await $.exists(dotAppPath)) {
  await Deno.remove(dotAppPath, { recursive: true });
}
