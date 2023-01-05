#!/usr/bin/env -S deno run --allow-env --allow-net --allow-read --allow-write --allow-run

import { $, $dirname, osInvariant } from "../../mod.ts";
import { getInstallerMetas, wrapOutdatedCheck } from "../_cli/pamkit.ts";

osInvariant();

const [meta] = await getInstallerMetas(new Set([$dirname(import.meta.url, true)]));

const outdatedCheck = await wrapOutdatedCheck(meta);

await $`echo ${JSON.stringify(outdatedCheck)}`.printCommand(false);