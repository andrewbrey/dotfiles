#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { constants } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), constants.appArtifactsDir);

if (await $.commandExists("aseprite")) {
  if ($.env.OS === "darwin") {
    // TODO: need to uninstall from command line
    if (Math.random()) throw new Error("TODO: uninstall dmg from command line");
  } else {
    await $`sudo apt purge -y aseprite`;
  }
}

if (await $.exists(dotAppPath)) {
  await Deno.remove(dotAppPath, { recursive: true });
}
