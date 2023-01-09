#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { constants } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), constants.appArtifactsDir);

const isInstalled = typeof (await $.which("go")) !== "undefined";
if (isInstalled) {
  if ($.env.OS === "darwin") {
    await $`brew uninstall go`.env({ HOMEBREW_NO_ANALYTICS: "1" });
  } else {
    await $`sudo rm -rf /usr/local/go`;
  }
}

if (await $.exists(dotAppPath)) {
  await Deno.remove(dotAppPath, { recursive: true });
}
