#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net=deno.land --allow-read --allow-write --allow-run

import { $, $dirname, osInvariant } from "../../mod.ts";
import { getInstallerMetas, ghReleaseLatestInfo, wrapOutdatedCheck } from "../_cli/pamkit.ts";

osInvariant();

const [meta] = await getInstallerMetas(new Set([$dirname(import.meta.url, true)]));

const outdatedCheck = await wrapOutdatedCheck(meta, 7, async () => {
  const releaseInfo = await ghReleaseLatestInfo("th-ch", "youtube-music");
  const { tag_name } = releaseInfo;
  const latest = tag_name.split("v")?.at(1) ?? "";

  return latest;
});

await $`echo ${JSON.stringify(outdatedCheck)}`.printCommand(false);
