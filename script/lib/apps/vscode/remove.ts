#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net=deno.land --allow-read --allow-write --allow-run

import { $, $dirname, colors, env, invariant, osInvariant } from "../../mod.ts";
import { constants } from "../_cli/pamkit.ts";

osInvariant();

const dotAppPath = $.path.join($dirname(import.meta.url), constants.appArtifactsDir);

const isInstalled = typeof (await $.which("code")) !== "undefined";
if (isInstalled) {
  if (env.OS === "darwin") {
    await $`brew uninstall --cask visual-studio-code`.env({ HOMEBREW_NO_ANALYTICS: "1" });
  } else {
    invariant(
      typeof (await $.which("snap")) !== "undefined",
      `snap is required, install it with ${colors.magenta("pam install -a snapd")}`,
    );

    await $`sudo snap remove code`;
  }
}

if (await $.exists(dotAppPath)) {
  await Deno.remove(dotAppPath, { recursive: true });
}
