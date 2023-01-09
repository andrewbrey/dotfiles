#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { getInstallerMetas, wrapOutdatedCheck } from "../_cli/pamkit.ts";

const [meta] = await getInstallerMetas(new Set([$.$dirname(import.meta.url, true)]));

const outdatedCheck = await wrapOutdatedCheck(meta, 1, async () => {
  const releaseInfo = await $.ghReleaseInfo("denoland", "deployctl");
  const { tag_name: latest } = releaseInfo;

  return latest;
});

await $`echo ${JSON.stringify(outdatedCheck)}`.printCommand(false);
