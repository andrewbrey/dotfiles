#!/usr/bin/env -S deno run --allow-env --allow-net --allow-read --allow-write --allow-run

import { $, $dirname, env, osInvariant } from "../../mod.ts";
import { getInstallerMetas, ghReleaseLatestInfo, wrapOutdatedCheck } from "../_cli/pamkit.ts";

osInvariant();

const [meta] = await getInstallerMetas(new Set([$dirname(import.meta.url, true)]));

const outdatedCheck = await wrapOutdatedCheck(meta, 3, async () => {
  if (env.OS === "darwin") {
    return ""; // managed on darwin
  } else {
    const releaseInfo = await ghReleaseLatestInfo("mr-karan", "doggo");
    const { tag_name } = releaseInfo;
    const latest = tag_name.split("v")?.at(1) ?? "";

    return latest;
  }
});

await $`echo ${JSON.stringify(outdatedCheck)}`.printCommand(false);
