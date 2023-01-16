#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net=deno.land --allow-read --allow-write --allow-run

import { $ } from "../mod.ts";

const id = `==> ${$.path.basename(import.meta.url)}`;

$.logGroup($.colors.black.bgYellow(id), () => {
  $.log("computed env:");
  $.log($.inspect($.env));
});

$.logStep("done with", id);
