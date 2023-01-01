#!/usr/bin/env -S deno run --allow-env --allow-net --allow-read --allow-run

import { $, $dirname, colors, invariant } from "../script/lib/mod.ts";

invariant(
  typeof (await $.which("deployctl")) !== "undefined",
  `deployctl is required, install it with ${colors.magenta("pam install -a deployctl")}`,
);

await $`deployctl deploy --project dotfiles-andrewbrey serve.ts`.cwd($dirname(import.meta.url));
