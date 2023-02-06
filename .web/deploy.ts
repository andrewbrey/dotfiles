#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net --allow-read --allow-run

import { $ } from "../script/lib/mod.ts";

await $.requireCommand("deployctl", "pam install -a deployctl");

await $`deployctl deploy --project dotfiles-andrewbrey --prod serve.ts`.cwd(
	$.$dirname(import.meta.url),
);
