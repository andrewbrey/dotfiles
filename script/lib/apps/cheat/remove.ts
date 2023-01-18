#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net=deno.land --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { pamkit } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);

if (await $.commandExists("cheat")) {
  if ($.env.OS /* TODO: refactor to os helpers */ === "darwin") {
    await $`brew uninstall cheat`.env({ HOMEBREW_NO_ANALYTICS: "1" });
  } else {
    await pamkit.unlinkBinaryFromUserPath("cheat");
  }

  const communityCheatPath = $.path.join(
    $.env.STANDARD_DIRS.DOT_DOTS_APPS,
    "cheat",
    "cheatsheets",
    "community",
  );
  if (await $.exists(communityCheatPath)) {
    await Deno.remove(communityCheatPath, { recursive: true });
  }
}

if (await $.exists(dotAppPath)) {
  await Deno.remove(dotAppPath, { recursive: true });
}
