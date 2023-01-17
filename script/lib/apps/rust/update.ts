#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { pamkit } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

const [meta] = await pamkit.getInstallerMetas(new Set([$.$dirname(import.meta.url, true)]));

if (await $.commandExists("rustc")) {
  const installScriptPath = $.path.join(dotAppPath, "rust-install.sh");

  await $.streamDownload("https://sh.rustup.rs", installScriptPath);
  await Deno.chmod(installScriptPath, pamkit.constants.executableMask);

  await $`${installScriptPath} --no-modify-path -y`;

  meta.lastCheck = Date.now();
}

const versionOutput = await $`rustc --version`.text(); // rustc 1.66.0 (69f9c33d7 2022-12-12)
const version = versionOutput.split(" ")?.at(1) ?? "";

meta.version = version;

const metaManifestPath = $.path.join(dotAppPath, pamkit.constants.metaManifestName);
await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
