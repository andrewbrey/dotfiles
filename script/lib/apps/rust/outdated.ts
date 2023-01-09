#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { getInstallerMetas, wrapOutdatedCheck } from "../_cli/pamkit.ts";

const [meta] = await getInstallerMetas(new Set([$.$dirname(import.meta.url, true)]));

const outdatedCheck = await wrapOutdatedCheck(meta, 7, async () => {
  const releaseInfo = await $.ghReleaseInfo("rust-lang", "rust");
  const { tag_name } = releaseInfo;
  const latest = tag_name ?? "";

  return latest;
});

await $`echo ${JSON.stringify(outdatedCheck)}`.printCommand(false);
