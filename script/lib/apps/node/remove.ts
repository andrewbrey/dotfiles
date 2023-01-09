#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net=deno.land --allow-read --allow-write --allow-run

import { $, $dirname, env } from "../../mod.ts";
import { constants, mostRelevantVersion } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($dirname(import.meta.url), constants.appArtifactsDir);
const dotResPath = $.path.join($dirname(import.meta.url), constants.appResourcesDir);

const nodeVersion = await mostRelevantVersion(dotResPath);
const isInstalled = typeof (await $.which("node")) !== "undefined";
if (isInstalled) {
  if (env.OS === "darwin") {
    await $`brew uninstall node@${nodeVersion}`.env({ HOMEBREW_NO_ANALYTICS: "1" });
  } else {
    // @see https://github.com/nodesource/distributions/blob/master/README.md#debuninstall
    await $`sudo apt purge -y nodejs`;
    await $`sudo rm -rf /etc/apt/sources.list.d/nodesource.list`;
  }
}

if (await $.exists(dotAppPath)) {
  await Deno.remove(dotAppPath, { recursive: true });
}
