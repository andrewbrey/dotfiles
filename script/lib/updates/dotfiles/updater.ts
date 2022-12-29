#!/usr/bin/env -S deno run --allow-env --allow-net=deno.land --allow-read --allow-write --allow-run

import { $, $dirname, invariant, osInvariant } from "../../mod.ts";

osInvariant();

const gitRoot = await $`git rev-parse --show-toplevel`.cwd(
  $dirname(import.meta.url),
).text();
const dotfileRepoStatus =
  (await $`git -C ${gitRoot} status --porcelain`.lines()).filter(Boolean);

const OK_TO_BE_DIRTY: string[] = [];
const worthWarningAbout = dotfileRepoStatus.filter((stl) =>
  !OK_TO_BE_DIRTY.some((ok) => stl.includes(ok))
);

invariant(
  worthWarningAbout.length === 0,
  "dotfiles repo has changes that need to be committed",
);

const { code: chezmoiStatus } = await $`chezmoi verify`.noThrow();

invariant(chezmoiStatus === 0, "chezmoi target state is out of sync");
