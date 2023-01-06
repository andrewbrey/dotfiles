#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net=deno.land,starship.rs --allow-read --allow-run --allow-write

// =====
// NOTE: this script (and all subsequent bootstrap scripts) expect
// to be run from an interactive terminal (TTY). There might be
// issues if that is not the case
// =====

import { $, blackOnYellow, doneWith, osInvariant } from "../mod.ts";

osInvariant();

const id = `==> ${$.path.basename(import.meta.url)}`;

$.logGroup(blackOnYellow(id));

if (!(await $.which("starship"))) {
  $.logWarn("warn: starship not found");

  $.logGroup();

  $.logStep("installing starship...");
  const installScript = await Deno.makeTempFile({ prefix: "dotfiles_starship_", suffix: ".sh" });
  const starshipInstallSource = "https://starship.rs/install.sh";
  await Deno.writeTextFile(installScript, await $.request(starshipInstallSource).text());
  await Deno.chmod(installScript, 0o744);

  await $`sh ${installScript} --yes`;

  $.logGroupEnd();
}

$.logGroupEnd();

doneWith(id);
