#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { type InstallerMeta, pamkit } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

if (await $.commandMissing("brave-browser")) {
  if ($.env.OS === "darwin") {
    await $`brew install --cask brave-browser`.env({ HOMEBREW_NO_ANALYTICS: "1" });
  } else {
    await $.requireCommand("curl", "pam install -a core-tools");

    await $`sudo mkdir -p /usr/share/keyrings`;
    const braveGPGKeyringURL = "https://brave-browser-apt-release.s3.brave.com/"; // NOTE: trailing slash (needed in sources.list?)
    const braveGPGKeyringPath = "/usr/share/keyrings/brave-browser-archive-keyring.gpg";
    await $`sudo curl -fsSLo ${braveGPGKeyringPath} ${braveGPGKeyringURL}brave-browser-archive-keyring.gpg`;

    const arch = await $`dpkg --print-architecture`.text();

    await $`sudo tee /etc/apt/sources.list.d/brave-browser-release.list`.stdin(
      await $
        .raw`echo "deb [signed-by=${braveGPGKeyringPath} arch=${arch}] ${braveGPGKeyringURL} stable main"`
        .bytes(),
    );

    await $`sudo apt update`;
    await $`sudo apt install -y brave-browser`;
  }
}

const versionOutput = await $`brave-browser --version`.text(); // Brave Browser 108.1.46.144
const version = versionOutput.split(" ")?.at(2) ?? "";

const meta: InstallerMeta = {
  name: $.$dirname(import.meta.url, true),
  path: $.$dirname(import.meta.url),
  type: "installed-managed",
  version,
  lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, pamkit.constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
