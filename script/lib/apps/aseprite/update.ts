#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net --allow-read --allow-write --allow-run

import { $, invariant } from "../../mod.ts";
import { constants, getInstallerMetas } from "../_cli/pamkit.ts";

const asepriteToken = Deno.env.get("HUMBLE_ASEPRITE_TOKEN");

invariant(
  typeof asepriteToken !== "undefined" && asepriteToken.length > 0,
  `missing required env $HUMBLE_ASEPRITE_TOKEN (try ${$.colors.magenta("use_humble")})`,
);

const dotAppPath = $.path.join($.$dirname(import.meta.url), constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

const [meta] = await getInstallerMetas(new Set([$.$dirname(import.meta.url, true)]));

const installed = typeof (await $.which("aseprite")) !== "undefined";
if (installed) {
  const releaseInfoPath = $.path.join(dotAppPath, constants.htmlReleaseInfoName);
  let releaseInfo = "";

  await $.runInBrowser(async (page) => {
    await page.goto(`https://www.humblebundle.com/downloads?key=${asepriteToken}`, {
      waitUntil: "networkidle2",
    });
    releaseInfo = await page.content();
  });

  invariant(releaseInfo.length > 0, "unable to fetch release information");

  await Deno.writeTextFile(releaseInfoPath, releaseInfo);

  if ($.env.OS === "darwin") {
    const dmgInstallerPath = $.path.join(dotAppPath, "aseprite.dmg");
    const dmgURI = releaseInfo.match(/href="(https.*Aseprite-v\d+\.\d+\.\d+.*-macOS\.dmg.*)"/)
      ?.at(1)?.replaceAll("&amp;", "&");

    invariant(typeof dmgURI === "string" && dmgURI.length > 0, "unable to determine download");

    await $.streamDownload(dmgURI, dmgInstallerPath);

    // TODO: https://apple.stackexchange.com/questions/73926/is-there-a-command-to-install-a-dmg
    if (Math.random()) throw new Error("TODO: install dmg from command line");
  } else {
    const debInstallerPath = $.path.join(dotAppPath, "aseprite.deb");
    const debURI = releaseInfo.match(/href="(https.*Aseprite_\d+\.\d+\.\d+.*_amd64\.deb.*)"/)
      ?.at(1)?.replaceAll("&amp;", "&");

    invariant(typeof debURI === "string" && debURI.length > 0, "unable to determine download");

    await $.streamDownload(debURI, debInstallerPath);

    await $`sudo apt install -y ${debInstallerPath}`;

    meta.lastCheck = Date.now();
  }
}

// TODO: same output on mac?
const versionOutput = await $`aseprite --version`.text(); // Aseprite 1.2.40-x64
const version = versionOutput.split(" ")?.at(1)?.split("-")?.at(0) ?? "";

meta.version = version;

const metaManifestPath = $.path.join(dotAppPath, constants.metaManifestName);
await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
