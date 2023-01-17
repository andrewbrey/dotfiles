#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { pamkit } from "../_cli/pamkit.ts";

const asepriteToken = $.requireEnv("HUMBLE_ASEPRITE_TOKEN", "use_humble");

const [meta] = await pamkit.getInstallerMetas(new Set([$.$dirname(import.meta.url, true)]));

const outdatedCheck = await pamkit.wrapOutdatedCheck(meta, 3, async () => {
  let releaseInfo = "";

  await $.runInBrowser(async (page) => {
    await page.goto(`https://www.humblebundle.com/downloads?key=${asepriteToken}`, {
      waitUntil: "networkidle2",
    });
    releaseInfo = await page.content();
  });

  if ($.env.OS === "darwin") {
    const dmgURI = releaseInfo.match(/href="(https.*Aseprite-v\d+\.\d+\.\d+.*-macOS\.dmg.*)"/)
      ?.at(1)?.replaceAll("&amp;", "&") ?? "";

    return new URL(dmgURI).pathname.split("/").at(-1)?.split("-")?.at(1)?.split("v")?.at(1) ?? "";
  } else {
    const debURI = releaseInfo.match(/href="(https.*Aseprite_\d+\.\d+\.\d+.*_amd64\.deb.*)"/)
      ?.at(1)?.replaceAll("&amp;", "&") ?? "";

    return new URL(debURI).pathname.split("/").at(-1)?.split("-")?.at(0)?.split("_")?.at(1) ?? "";
  }
});

await $`echo ${JSON.stringify(outdatedCheck)}`.printCommand(false);
