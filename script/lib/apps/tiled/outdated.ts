#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { getInstallerMetas, wrapOutdatedCheck } from "../_cli/pamkit.ts";

const [meta] = await getInstallerMetas(new Set([$.$dirname(import.meta.url, true)]));

const outdatedCheck = await wrapOutdatedCheck(meta, 3, async () => {
  if ($.env.OS === "darwin") {
    return ""; // managed on darwin
  } else {
    const releaseInfo = await $.ghReleaseInfo("mapeditor", "tiled");
    const { tag_name } = releaseInfo;
    const latest = tag_name.split("v")?.at(1) ?? "";

    return latest;
  }
});

await $`echo ${JSON.stringify(outdatedCheck)}`.printCommand(false);
