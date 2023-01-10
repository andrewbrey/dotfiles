#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net=deno.land --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";

if (await $.commandExists("bw")) {
  await Deno.writeTextFile(
    $.path.join($.env.STANDARD_DIRS.DOT_DOTS, "completions", "_bw"),
    await $`bw completion --shell zsh`.text(),
  );
}

if (await $.commandExists("chezmoi")) {
  await Deno.writeTextFile(
    $.path.join($.env.STANDARD_DIRS.DOT_DOTS, "completions", "_chezmoi"),
    await $`chezmoi completion zsh`.text(),
  );
}

if (await $.commandExists("deno")) {
  await Deno.writeTextFile(
    $.path.join($.env.STANDARD_DIRS.DOT_DOTS, "completions", "_deno"),
    await $`deno completions --unstable zsh`.text(),
  );
}
if (await $.commandExists("flyctl")) {
  await Deno.writeTextFile(
    $.path.join($.env.STANDARD_DIRS.DOT_DOTS, "completions", "_flyctl"),
    await $`flyctl completion zsh`.text(),
  );
}

if (await $.commandExists("gh")) {
  await Deno.writeTextFile(
    $.path.join($.env.STANDARD_DIRS.DOT_DOTS, "completions", "_gh"),
    await $`gh completion -s zsh`.text(),
  );
}

if (await $.commandExists("supabase")) {
  await Deno.writeTextFile(
    $.path.join($.env.STANDARD_DIRS.DOT_DOTS, "completions", "_supabase"),
    await $`supabase completion zsh`.text(),
  );
}
