#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net --allow-read --allow-run

import { $, invariant } from "../script/lib/mod.ts";

invariant(
  typeof (await $.which("deployctl")) !== "undefined",
  `deployctl is required, install it with ${$.colors.magenta("pam install -a deployctl")}`,
);

await $`deployctl deploy --project dotfiles-andrewbrey --prod serve.ts`.cwd(
  $.$dirname(import.meta.url),
);
