#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net --allow-read --allow-write --allow-run

import { $, invariant } from "../../mod.ts";
import { getInstallerMetas, wrapOutdatedCheck } from "../_cli/pamkit.ts";

const asepriteToken = Deno.env.get("HUMBLE_ASEPRITE_TOKEN");

invariant(
  typeof asepriteToken !== "undefined" && asepriteToken.length > 0,
  `missing required env $HUMBLE_ASEPRITE_TOKEN (try ${$.colors.magenta("use_humble")})`,
);

const [meta] = await getInstallerMetas(new Set([$.$dirname(import.meta.url, true)]));

const outdatedCheck = await wrapOutdatedCheck(meta, 3, async () => {
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
