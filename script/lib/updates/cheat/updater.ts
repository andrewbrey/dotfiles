#!/usr/bin/env -S deno run --allow-env --allow-net=deno.land --allow-read --allow-write --allow-run

import { $, env, osInvariant } from "../../mod.ts";

osInvariant();

const communityCheatPath = $.path.join(
  env.STANDARD_DIRS.DOT_DOTS_APPS,
  "cheat",
  "cheatsheets",
  "community",
);

if (await $.exists(communityCheatPath)) {
  await $`git -C ${communityCheatPath} pull`;
}
