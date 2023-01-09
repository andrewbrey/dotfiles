#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net=deno.land --allow-read --allow-write --allow-run

import { $, $dirname } from "../../mod.ts";
import { getInstallerMetas, wrapOutdatedCheck } from "../_cli/pamkit.ts";

const [meta] = await getInstallerMetas(new Set([$dirname(import.meta.url, true)]));

const outdatedCheck = await wrapOutdatedCheck(meta);

await $`echo ${JSON.stringify(outdatedCheck)}`.printCommand(false);
