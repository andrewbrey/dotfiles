#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net=deno.land,starship.rs --allow-read --allow-run --allow-write

// =====
// NOTE: this script (and all subsequent bootstrap scripts) expect
// to be run from an interactive terminal (TTY). There might be
// issues if that is not the case
// =====

import { $ } from "../mod.ts";

const id = `==> ${$.path.basename(import.meta.url)}`;

$.logGroup($.colors.black.bgYellow(id));

if (await $.commandMissing("starship")) {
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

$.logStep("done with", id);
