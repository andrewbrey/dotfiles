#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net --allow-read --allow-write --allow-run

import { $, $dirname } from "../../mod.ts";
import { constants, getInstallerMetas, streamDownload } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($dirname(import.meta.url), constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

const [meta] = await getInstallerMetas(new Set([$dirname(import.meta.url, true)]));

const installed = typeof (await $.which("rustc")) !== "undefined";
if (installed) {
  const installScriptPath = $.path.join(dotAppPath, "rust-install.sh");

  await streamDownload("https://sh.rustup.rs", installScriptPath);
  await Deno.chmod(installScriptPath, constants.executableMask);

  await $`${installScriptPath} --no-modify-path -y`;

  meta.lastCheck = Date.now();
}

const versionOutput = await $`rustc --version`.text(); // rustc 1.66.0 (69f9c33d7 2022-12-12)
const version = versionOutput.split(" ")?.at(1) ?? "";

meta.version = version;

const metaManifestPath = $.path.join(dotAppPath, constants.metaManifestName);
await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
