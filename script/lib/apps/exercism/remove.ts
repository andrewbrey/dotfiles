#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net --allow-read --allow-write --allow-run

import { $, $dirname, env } from "../../mod.ts";
import { constants, unlinkBinaryFromUserPath } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($dirname(import.meta.url), constants.appArtifactsDir);

const isInstalled = typeof (await $.which("exercism")) !== "undefined";
if (isInstalled) {
  if (env.OS === "darwin") {
    await $`brew uninstall exercism`.env({ HOMEBREW_NO_ANALYTICS: "1" });
  } else {
    await unlinkBinaryFromUserPath("exercism");
  }

  const workspaceDir = $.path.join(env.STANDARD_DIRS.CODE, "exercism");
  if (await $.exists(workspaceDir)) {
    await Deno.remove(workspaceDir, { recursive: true });
  }
}

if (await $.exists(dotAppPath)) {
  await Deno.remove(dotAppPath, { recursive: true });
}
