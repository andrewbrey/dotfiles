#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net=deno.land --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";

// TODO: uncomment upgrade
$.logWarn(
  "WARNING!!!!",
  "Skipping upgrade to deno because we hit this line (TBD why): https://deno.land/std@0.174.0/node/_core.ts?source#L26",
);
$.sleep("5s");
// await $`deno upgrade`;
