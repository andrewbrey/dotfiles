#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net --allow-read --allow-write --allow-run

import { $, $dirname, env, osInvariant } from "../../mod.ts";
import { constants } from "../_cli/pamkit.ts";

osInvariant();

const dotAppPath = $.path.join($dirname(import.meta.url), constants.appArtifactsDir);

const isInstalled = typeof (await $.which("rustc")) !== "undefined";
if (isInstalled) {
  const rustupPath = $.path.join(env.HOME, ".rustup");
  const cargoPath = $.path.join(env.HOME, ".cargo");

  if (await $.exists(rustupPath)) {
    await Deno.remove(rustupPath, { recursive: true });
  }

  if (await $.exists(cargoPath)) {
    await Deno.remove(cargoPath, { recursive: true });
  }
}

if (await $.exists(dotAppPath)) {
  await Deno.remove(dotAppPath, { recursive: true });
}
