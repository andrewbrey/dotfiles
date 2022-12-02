#!/usr/bin/env -S deno run --allow-env --allow-net=deno.land --allow-read --allow-write --allow-run

import { $, osInvariant } from "../../mod.ts";
import { getInstallerMetas, wrapOutdatedCheck } from "../_cli/pamkit.ts";

osInvariant();

const [meta] = await getInstallerMetas(new Set(["node"]));

const outdatedCheck = await wrapOutdatedCheck(meta);

await $`echo ${JSON.stringify(outdatedCheck)}`.printCommand(false);
