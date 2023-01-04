#!/usr/bin/env -S deno run --allow-env --allow-net --allow-read --allow-write --allow-run

import { $, $dirname, osInvariant } from "../../mod.ts";
import { constants, unlinkBinaryFromUserPath } from "../_cli/pamkit.ts";

osInvariant();

const dotAppPath = $.path.join($dirname(import.meta.url), constants.appArtifactsDir);

const isInstalled = typeof (await $.which("skate")) !== "undefined";
if (isInstalled) {
  await unlinkBinaryFromUserPath("skate");
}

if (await $.exists(dotAppPath)) {
  await Deno.remove(dotAppPath, { recursive: true });
}