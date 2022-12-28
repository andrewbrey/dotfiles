#!/usr/bin/env -S deno run --allow-env --allow-net=deno.land --allow-read --allow-write --allow-run

import { osInvariant } from "../../mod.ts";

osInvariant();

// TODO: update apt

// TODO: incorporate old updaters
// alias daily_updates="deno run -A --unstable ${HOME}/dotfiles/scripts/daily-updates/cli.ts"
// alias daily_updates="brew update && brew upgrade && brew cleanup && brew autoremove && brew doctor"
