#!/usr/bin/env -S deno run --allow-env --allow-net=api.github.com,deno.land --allow-read --allow-write --allow-run

import { $, env, osInvariant } from "../../mod.ts";
import { getInstallerMetas, ghReleaseLatestInfo, wrapOutdatedCheck } from "../_cli/pamkit.ts";

osInvariant();

const [meta] = await getInstallerMetas(new Set(["gh"]));

const outdatedCheck = await wrapOutdatedCheck(meta, 3, async () => {
  if (env.OS === "darwin") {
    return ""; // managed on darwin
  } else {
    const releaseInfo = await ghReleaseLatestInfo("cli", "cli");
    const { tag_name } = releaseInfo;
    const latest = tag_name.split("v")[1];

    return latest;
  }
});

await $`echo ${JSON.stringify(outdatedCheck)}`.printCommand(false);