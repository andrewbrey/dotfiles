#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net=deno.land --allow-read --allow-write --allow-run

import { $, env, osInvariant } from "../../mod.ts";

osInvariant();

if (typeof (await $.which("bw")) !== "undefined") {
  await Deno.writeTextFile(
    $.path.join($.env.STANDARD_DIRS.DOT_DOTS, "completions", "_bw"),
    await $`bw completion --shell zsh`.text(),
  );
}

if (typeof (await $.which("chezmoi")) !== "undefined") {
  await Deno.writeTextFile(
    $.path.join($.env.STANDARD_DIRS.DOT_DOTS, "completions", "_chezmoi"),
    await $`chezmoi completion zsh`.text(),
  );
}

if (typeof (await $.which("deno")) !== "undefined") {
  await Deno.writeTextFile(
    $.path.join($.env.STANDARD_DIRS.DOT_DOTS, "completions", "_deno"),
    await $`deno completions --unstable zsh`.text(),
  );
}
if (typeof (await $.which("flyctl")) !== "undefined") {
  await Deno.writeTextFile(
    $.path.join($.env.STANDARD_DIRS.DOT_DOTS, "completions", "_flyctl"),
    await $`flyctl completion zsh`.text(),
  );
}

if (typeof (await $.which("gh")) !== "undefined") {
  await Deno.writeTextFile(
    $.path.join($.env.STANDARD_DIRS.DOT_DOTS, "completions", "_gh"),
    await $`gh completion -s zsh`.text(),
  );
}

if (typeof (await $.which("supabase")) !== "undefined") {
  await Deno.writeTextFile(
    $.path.join($.env.STANDARD_DIRS.DOT_DOTS, "completions", "_supabase"),
    await $`supabase completion zsh`.text(),
  );
}
