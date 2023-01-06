#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net=deno.land --allow-read --allow-write --allow-run

import { $, env, osInvariant } from "../../mod.ts";

osInvariant();

if (typeof (await $.which("youtube-dl")) !== "undefined") {
  await $`sudo youtube-dl -U`;
}
