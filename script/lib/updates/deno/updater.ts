#!/usr/bin/env -S deno run --allow-env --allow-net=deno.land --allow-read --allow-write --allow-run

import { $, env, osInvariant } from "../../mod.ts";

osInvariant();

await $`deno upgrade`;