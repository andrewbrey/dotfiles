#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net --allow-read --allow-write --allow-run

import { $, $dirname, env, invariant, osInvariant } from "../../mod.ts";
import { constants, InstallerMeta } from "../_cli/pamkit.ts";

osInvariant();

const dotAppPath = $.path.join($dirname(import.meta.url), constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

const notInstalled = typeof (await $.which("brave-browser")) === "undefined";
if (notInstalled) {
  if (env.OS === "darwin") {
    await $`brew install --cask brave-browser`.env({ HOMEBREW_NO_ANALYTICS: "1" });
  } else {
    invariant(typeof (await $.which("curl")) !== "undefined", "curl is required");

    await $`sudo mkdir -p /usr/share/keyrings`;
    const braveGPGKeyringURL = "https://brave-browser-apt-release.s3.brave.com/"; // NOTE: trailing slash (needed in sources.list?)
    const braveGPGKeyringPath = "/usr/share/keyrings/brave-browser-archive-keyring.gpg";
    await $`sudo curl -fsSLo ${braveGPGKeyringPath} ${braveGPGKeyringURL}brave-browser-archive-keyring.gpg`;

    const arch = await $`dpkg --print-architecture`.text();

    await $`sudo tee /etc/apt/sources.list.d/brave-browser-release.list`.stdin(
      await $
        .raw`echo "deb [signed-by=${braveGPGKeyringPath} arch=${arch}] ${braveGPGKeyringURL} stable main"`
        .text(),
    );

    await $`sudo apt update`;
    await $`sudo apt install -y brave-browser`;
  }
}

const versionOutput = await $`brave-browser --version`.text(); // Brave Browser 108.1.46.144
const version = versionOutput.split(" ")?.at(2) ?? "";

const meta: InstallerMeta = {
  name: $dirname(import.meta.url, true),
  path: $dirname(import.meta.url),
  type: "installed-managed",
  version,
  lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
