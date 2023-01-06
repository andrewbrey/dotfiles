#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net --allow-read --allow-write --allow-run

import { $, $dirname, env, osInvariant } from "../../mod.ts";
import { getInstallerMetas, wrapOutdatedCheck } from "../_cli/pamkit.ts";

osInvariant();

const [meta] = await getInstallerMetas(new Set([$dirname(import.meta.url, true)]));

const outdatedCheck = await wrapOutdatedCheck(meta, 3, async () => {
  if (env.OS === "darwin") {
    return ""; // managed on darwin
  } else {
    const latestReleasePageText = await $.request("https://insomnia.rest/changelog").text();
    const latest = latestReleasePageText.match(/id="(\d+\.\d+\.\d+)"/)?.at(1) ?? ""; // id="2022.7.0"

    return latest;
  }
});

await $`echo ${JSON.stringify(outdatedCheck)}`.printCommand(false);
