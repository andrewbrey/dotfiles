#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net --allow-read --allow-write --allow-run

import { $, invariant } from "../../mod.ts";
import { constants } from "../_cli/pamkit.ts";

invariant(
  typeof (await $.which("snap")) !== "undefined",
  `snap is required, install it with ${$.colors.magenta("pam install -a snapd")}`,
);

const dotAppPath = $.path.join($.$dirname(import.meta.url), constants.appArtifactsDir);

if ($.env.OS === "linux") {
  if (typeof (await $.which("snapcraft")) !== "undefined") {
    await $`sudo snap remove snapcraft`;
  }

  if (typeof (await $.which("snap-review")) !== "undefined") {
    await $`sudo snap remove snap-review`;
  }
}

if (await $.exists(dotAppPath)) {
  await Deno.remove(dotAppPath, { recursive: true });
}
