#!/usr/bin/env -S deno run --allow-env --allow-net --allow-read --allow-write --allow-run

import { $, $dirname, env, invariant, osInvariant } from "../../mod.ts";
import { constants } from "../_cli/pamkit.ts";

osInvariant();
invariant(typeof (await $.which("flatpak")) !== "undefined", "flatpak is required");

const dotAppPath = $.path.join($dirname(import.meta.url), constants.appArtifactsDir);

const isInstalled =
  (await $`grep -q "^Kooha$"`.stdin(await $`flatpak list --app --columns=name`.text()).noThrow())
    .code === 0;
if (isInstalled) {
  if (env.OS === "linux") {
    await $`flatpak uninstall -y flathub io.github.seadve.Kooha`;
  }
}

if (await $.exists(dotAppPath)) {
  await Deno.remove(dotAppPath, { recursive: true });
}
