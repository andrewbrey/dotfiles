#!/usr/bin/env -S deno run --allow-env --allow-net --allow-read --allow-write --allow-run

import { $, $dirname, colors, env, invariant, osInvariant } from "../../mod.ts";
import { getInstallerMetas, getUA, runInBrowser, wrapOutdatedCheck } from "../_cli/pamkit.ts";

osInvariant();

const asepriteToken = Deno.env.get("HUMBLE_ASEPRITE_TOKEN");

invariant(
  typeof asepriteToken !== "undefined" && asepriteToken.length > 0,
  `missing required env $HUMBLE_ASEPRITE_TOKEN (try ${colors.magenta("use_humble")})`,
);

const [meta] = await getInstallerMetas(new Set([$dirname(import.meta.url, true)]));

const outdatedCheck = await wrapOutdatedCheck(meta, 3, async () => {
  let releaseInfo = "";

  await runInBrowser(async (browser) => {
    const page = await browser.newPage();
    await page.setUserAgent(getUA({
      platform: env.OS === "darwin" ? "MacIntel" : "Linux x86_64",
      vendor: "Google Inc.",
      deviceCategory: "desktop",
      screenHeight: 1920,
      screenWidth: 1080,
    }));
    await page.goto(`https://www.humblebundle.com/downloads?key=${asepriteToken}`, {
      waitUntil: "networkidle2",
    });
    releaseInfo = await page.content();
  });

  if (env.OS === "darwin") {
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
