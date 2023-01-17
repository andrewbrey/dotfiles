#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { pamkit } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);

if (await $.commandExists("rustc")) {
  const rustupPath = $.path.join($.env.HOME, ".rustup");
  const cargoPath = $.path.join($.env.HOME, ".cargo");

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
