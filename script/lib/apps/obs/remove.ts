#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net --allow-read --allow-write --allow-run

import { $, $dirname, env } from "../../mod.ts";
import { constants } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($dirname(import.meta.url), constants.appArtifactsDir);

const isInstalled = typeof (await $.which("obs")) !== "undefined";
if (isInstalled) {
  if (env.OS === "darwin") {
    await $`brew uninstall --cask obs`.env({ HOMEBREW_NO_ANALYTICS: "1" });
  } else {
    await $`sudo apt purge -y obs-studio`;
    await $.sleep("5s"); // give apt time to release lock
    await $`sudo add-apt-repository -y --remove ppa:obsproject/obs-studio`;
  }
}

if (await $.exists(dotAppPath)) {
  await Deno.remove(dotAppPath, { recursive: true });
}
