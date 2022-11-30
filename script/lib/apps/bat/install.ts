#!/usr/bin/env -S deno run --allow-env --allow-net=example.com --allow-read --allow-write --allow-run

import { $, $dirname, env, osInvariant } from "../../mod.ts";

osInvariant();

if (env.OS === "darwin") {
  await $`brew install bat`;
} else {
  await $.fs.ensureDir($.path.join($dirname(import.meta.url), ".app"));
}

// TODO: write InstallationMeta
