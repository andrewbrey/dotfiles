#!/usr/bin/env -S deno run --allow-env --allow-net=example.com --allow-read --allow-write --allow-run

import { $, $dirname, env, osInvariant } from "../../mod.ts";
import { constants } from "../_cli/pamkit.ts";

osInvariant();

const dotAppPath = $.path.join($dirname(import.meta.url), constants.appArtifactsDir);

const isInstalled = typeof (await $.which("bat")) !== "undefined";
if (isInstalled) {
  if (env.OS === "darwin") {
    await $`brew uninstall bat`.env({ HOMEBREW_NO_ANALYTICS: "1" });
  } else {
    await $`sudo apt purge -y bat`;
  }
}

if (await $.exists(dotAppPath)) {
  await Deno.remove(dotAppPath, { recursive: true });
}
