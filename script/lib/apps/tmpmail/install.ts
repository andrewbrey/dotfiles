#!/usr/bin/env -S deno run --allow-env --allow-net=deno.land --allow-read --allow-write --allow-run

import { $, $dirname, colors, env, invariant, osInvariant } from "../../mod.ts";
import { constants, InstallerMeta, linkBinaryToUserPath } from "../_cli/pamkit.ts";

osInvariant();

const dotAppPath = $.path.join($dirname(import.meta.url), constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

const notInstalled = typeof (await $.which("tmpmail")) === "undefined";
if (notInstalled) {
  if (env.OS === "linux") {
    invariant(
      typeof (await $.which("xclip")) !== "undefined",
      `xclip is required, install it with ${colors.magenta("pam install -a peer-tools")}`,
    );
  }

  const sourcePath = $.path.join(dotAppPath, constants.sourceDir);
  const binPath = $.path.join(sourcePath, "tmpmail");

  await $`git clone https://github.com/sdushantha/tmpmail.git ${sourcePath}`;

  await linkBinaryToUserPath(binPath, "tmpmail");
}

const versionOutput = await $`tmpmail --version`.text(); // 1.2.3
const version = versionOutput ?? "";

const meta: InstallerMeta = {
  name: $.path.basename($dirname(import.meta.url)),
  path: $dirname(import.meta.url),
  type: "installed-manual",
  version,
  lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
