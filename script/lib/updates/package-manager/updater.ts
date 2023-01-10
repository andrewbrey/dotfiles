#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net=deno.land --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";

if ($.env.OS === "darwin") {
  await $`brew update`;
  await $`brew upgrade`;
  await $`brew cleanup`;
  await $`brew autoremove`;
  await $`brew doctor`;
} else {
  await $`sudo apt update`;
  await $`sudo apt upgrade -y`;
  await $`sudo apt autoremove -y`;

  if (await $.commandExists("snap")) {
    await $`sudo snap refresh`;
  }

  if (await $.commandExists("flatpak")) {
    await $`flatpak update -y`;
  }
}
