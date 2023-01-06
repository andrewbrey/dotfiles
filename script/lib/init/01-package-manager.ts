#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net=deno.land,raw.githubusercontent.com --allow-read --allow-run --allow-write

// =====
// NOTE: this script (and all subsequent bootstrap scripts) expect
// to be run from an interactive terminal (TTY). There might be
// issues if that is not the case
// =====

import { $, blackOnYellow, doneWith, env, osInvariant } from "../mod.ts";

osInvariant();

const id = `==> ${$.path.basename(import.meta.url)}`;

$.logGroup(blackOnYellow(id));

switch (env.OS) {
  case "linux":
    // IDEA: handle other package managers if needed; pretty happy with debain derived variants and `apt` for now ¯\_(ツ)_/¯

    if (env.IN_CLOUD_IDE) {
      await $`sudo apt update`;
    } else {
      await $`sudo apt update && sudo apt upgrade -y && sudo apt autoremove -y`;
    }

    break;
  case "darwin":
    $.logStep("installing software center updates...");
    await $`sudo softwareupdate -i -a`;

    $.logStep("installing xcode...");
    await $`xcode-select --install`;

    if (!(await $.which("brew"))) {
      $.logWarn("warn: brew not found");

      $.logGroup();

      $.logStep("installing brew...");
      const installScript = await Deno.makeTempFile({ prefix: "dotfiles_brew_", suffix: ".sh" });
      const brewInstallSource =
        "https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh";
      await Deno.writeTextFile(installScript, await $.request(brewInstallSource).text());
      await Deno.chmod(installScript, 0o744);

      await $`bash ${installScript}`.env({ NONINTERACTIVE: "1" });

      $.logGroupEnd();
    }

    await $`brew update && brew upgrade && brew cleanup`;
    break;
  default:
    Deno.exit(1);
}

$.logGroupEnd();

doneWith(id);
