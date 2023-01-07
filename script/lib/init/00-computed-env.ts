#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net=deno.land --allow-read

import { $, blackOnYellow, env, inspect, osInvariant } from "../mod.ts";

osInvariant();

const id = `==> ${$.path.basename(import.meta.url)}`;

$.logGroup(blackOnYellow(id), () => {
  $.log("computed env:");
  $.log(inspect(env));
});

$.logStep("done with", id);
