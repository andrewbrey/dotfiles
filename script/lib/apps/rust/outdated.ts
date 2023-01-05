#!/usr/bin/env -S deno run --allow-env --allow-net --allow-read --allow-write --allow-run

import { $, $dirname, osInvariant } from "../../mod.ts";
import { getInstallerMetas, ghReleaseLatestInfo, wrapOutdatedCheck } from "../_cli/pamkit.ts";

osInvariant();

const [meta] = await getInstallerMetas(new Set([$dirname(import.meta.url, true)]));

const outdatedCheck = await wrapOutdatedCheck(meta, 7, async () => {
  const releaseInfo = await ghReleaseLatestInfo("rust-lang", "rust");
  const { tag_name } = releaseInfo;
  const latest = tag_name ?? "";

  return latest;
});

await $`echo ${JSON.stringify(outdatedCheck)}`.printCommand(false);