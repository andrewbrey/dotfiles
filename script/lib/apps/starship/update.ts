#!/usr/bin/env -S deno run --allow-env --allow-net=deno.land,starship.rs --allow-read --allow-write --allow-run

import { $, $dirname, osInvariant } from "../../mod.ts";
import { constants, getInstallerMetas } from "../_cli/pamkit.ts";

osInvariant();

const dotAppPath = $.path.join($dirname(import.meta.url), constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

const [meta] = await getInstallerMetas(new Set([$dirname(import.meta.url, true)]));

const installed = typeof (await $.which("starship")) !== "undefined";
if (installed) {
  // NOTE: copied from script/lib/init/02-zsh-and-zgenom.ts

  const installScript = await Deno.makeTempFile({ prefix: "dotfiles_starship_", suffix: ".sh" });
  const starshipInstallSource = "https://starship.rs/install.sh";
  await Deno.writeTextFile(installScript, await $.request(starshipInstallSource).text());
  await Deno.chmod(installScript, 0o744);

  await $`sudo sh ${installScript} --yes`;

  meta.lastCheck = Date.now();
}

const versionOutput = await $`starship --version`.lines(); // starship 1.11.0\n....
const version = versionOutput?.at(0)?.split(" ")?.at(1) ?? "";

meta.version = version;

const metaManifestPath = $.path.join(dotAppPath, constants.metaManifestName);
await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
