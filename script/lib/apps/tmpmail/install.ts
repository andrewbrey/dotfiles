#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net=deno.land --allow-read --allow-write --allow-run

import { $, invariant } from "../../mod.ts";
import { constants, InstallerMeta, linkBinaryToUserPath } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

if (await $.commandMissing("tmpmail")) {
  if ($.env.OS === "linux") {
    await $.requireCommand("xclip", "pam install -a peer-tools");
  }

  const sourcePath = $.path.join(dotAppPath, constants.sourceDir);
  const binPath = $.path.join(sourcePath, "tmpmail");

  await $`git clone https://github.com/sdushantha/tmpmail.git ${sourcePath}`;

  await linkBinaryToUserPath(binPath, "tmpmail");
}

const versionOutput = await $`tmpmail --version`.text(); // 1.2.3
const version = versionOutput ?? "";

const meta: InstallerMeta = {
  name: $.$dirname(import.meta.url, true),
  path: $.$dirname(import.meta.url),
  type: "installed-manual",
  version,
  lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
