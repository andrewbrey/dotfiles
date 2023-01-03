#!/usr/bin/env -S deno run --allow-env --allow-net --allow-read --allow-write --allow-run

import { $, $dirname, colors, env, invariant, osInvariant } from "../../mod.ts";
import { constants, getUA, InstallerMeta, runInBrowser, streamDownload } from "../_cli/pamkit.ts";

osInvariant();

const asepriteToken = Deno.env.get("HUMBLE_ASEPRITE_TOKEN");

invariant(
  typeof asepriteToken !== "undefined" && asepriteToken.length > 0,
  `missing required env $HUMBLE_ASEPRITE_TOKEN (try ${colors.magenta("use_humble")})`,
);

const dotAppPath = $.path.join($dirname(import.meta.url), constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

const notInstalled = typeof (await $.which("aseprite")) === "undefined";
if (notInstalled) {
  const releaseInfoPath = $.path.join(dotAppPath, constants.htmlReleaseInfoName);
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

  invariant(releaseInfo.length > 0, "unable to fetch release information");

  await Deno.writeTextFile(releaseInfoPath, releaseInfo);

  if (env.OS === "darwin") {
    const dmgInstallerPath = $.path.join(dotAppPath, "aseprite.dmg");
    const dmgURI = releaseInfo.match(/href="(https.*Aseprite-v\d+\.\d+\.\d+.*-macOS\.dmg.*)"/)
      ?.at(1)?.replaceAll("&amp;", "&");

    invariant(typeof dmgURI === "string" && dmgURI.length > 0, "unable to determine download");

    await streamDownload(dmgURI, dmgInstallerPath);

    // TODO: https://apple.stackexchange.com/questions/73926/is-there-a-command-to-install-a-dmg
    if (Math.random()) throw new Error("TODO: install dmg from command line");
  } else {
    const debInstallerPath = $.path.join(dotAppPath, "aseprite.deb");
    const debURI = releaseInfo.match(/href="(https.*Aseprite_\d+\.\d+\.\d+.*_amd64\.deb.*)"/)
      ?.at(1)?.replaceAll("&amp;", "&");

    invariant(typeof debURI === "string" && debURI.length > 0, "unable to determine download");

    await streamDownload(debURI, debInstallerPath);

    await $`sudo apt install -y ${debInstallerPath}`;
  }
}

// TODO: same output on mac?
const versionOutput = await $`aseprite --version`.text(); // Aseprite 1.2.40-x64
const version = versionOutput.split(" ")?.at(1)?.split("-")?.at(0) ?? "";

const meta: InstallerMeta = {
  name: $dirname(import.meta.url, true),
  path: $dirname(import.meta.url),
  type: "installed-manual",
  version,
  lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
