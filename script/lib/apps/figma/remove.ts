#!/usr/bin/env -S deno run --allow-env --allow-net --allow-read --allow-write --allow-run

import { $, $dirname, env, osInvariant } from "../../mod.ts";
import { constants, unlinkNativefierApp } from "../_cli/pamkit.ts";

osInvariant();

const dotAppPath = $.path.join($dirname(import.meta.url), constants.appArtifactsDir);

const name = $dirname(import.meta.url, true);
const isInstalled = typeof (await $.which(name)) !== "undefined";
if (isInstalled) {
  await unlinkNativefierApp(name);
}

if (await $.exists(dotAppPath)) {
  await Deno.remove(dotAppPath, { recursive: true });
}