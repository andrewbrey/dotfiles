#!/usr/bin/env -S deno run --allow-env --allow-net=deno.land --allow-read --allow-write --allow-run

import { $, $dirname, env, osInvariant } from "../../mod.ts";
import { constants, getChezmoiData } from "../_cli/pamkit.ts";

osInvariant();

const dotAppPath = $.path.join($dirname(import.meta.url), constants.appArtifactsDir);

const installRootPath = $.path.join("/", "usr", "lib", "pop-launcher", "scripts");
const dirLinkInstallPath = $.path.join(installRootPath, env.USER);

const installed = await $.exists(dirLinkInstallPath);
if (installed) {
  const chezmoiData = await getChezmoiData();

  if (chezmoiData.is_popos) {
    await $`sudo rm -f ${dirLinkInstallPath}`;
  }
}

if (await $.exists(dotAppPath)) {
  await Deno.remove(dotAppPath, { recursive: true });
}
