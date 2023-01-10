#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { constants, InstallerMeta } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

if (await $.commandMissing("subl")) {
  if ($.env.OS === "darwin") {
    await $`brew install --cask sublime-text`.env({ HOMEBREW_NO_ANALYTICS: "1" });
  } else {
    await $.requireCommand("curl");

    await $`sudo mkdir -p /etc/apt/trusted.gpg.d`;
    await $`sudo gpg --dearmor -o /etc/apt/trusted.gpg.d/sublimehq-archive.gpg`.stdin(
      await $`curl -fsSL https://download.sublimetext.com/sublimehq-pub.gpg`.text(),
    );

    await $`sudo tee /etc/apt/sources.list.d/sublime-text.list`.stdin(
      await $.raw`echo "deb https://download.sublimetext.com/ apt/stable/"`.text(),
    );

    await $`sudo apt update`;
    await $`sudo apt install -y sublime-text`;
  }
}

const versionOutput = await $`subl --version`.text(); // Sublime Text Build 4143
const build = versionOutput.split(" ")?.at(3) ?? "0";
const version = `${build}.0.0`;

const meta: InstallerMeta = {
  name: $.$dirname(import.meta.url, true),
  path: $.$dirname(import.meta.url),
  type: "installed-managed",
  version,
  lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
