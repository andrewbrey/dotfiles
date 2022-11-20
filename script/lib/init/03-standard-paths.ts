#!/usr/bin/env -S deno run --allow-env --allow-net=deno.land --allow-read --allow-write

import { $, blackOnYellow, colors, doneWith, env, osInvariant } from "../mod.ts";

osInvariant();

const id = `==> ${$.path.basename(import.meta.url)}`;

$.logGroup(blackOnYellow(id));

$.logStep("step: place standard dirs");

for (const [name, path] of Object.entries(env.STANDARD_DIRS)) {
  $.logLight(
    `ensuring presence of ${colors.magenta(name.toLocaleLowerCase())} directory at ${
      colors.magenta(path)
    }`,
  );
  await $.fs.ensureDir(path);
}

$.logGroupEnd();

doneWith(id);
