#!/usr/bin/env -S deno run --allow-env --allow-net=deno.land,api.github.com --allow-read --allow-write --allow-run

import { $, $dirname, colors, env, invariant, osInvariant } from "../../mod.ts";
import { constants, ghReleaseLatestInfo, InstallerMeta } from "../_cli/pamkit.ts";

osInvariant();

const dotAppPath = $.path.join($dirname(import.meta.url), constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

let version = "0.0.0"; // special for compose-switch because at runtime, it's --version flag reports `docker compose` version, not the version of the compose-switch utility itself
const notInstalled = typeof (await $.which("docker-compose")) === "undefined";
if (notInstalled) {
  if (env.OS === "linux") {
    invariant(
      typeof (await $.which("docker")) !== "undefined",
      `docker is required, install it with ${colors.magenta("pam install -a docker")}`,
    );

    invariant(
      (await $`docker compose version`.noThrow().text()).trim() !== "",
      "docker compose plugin is required and should have been installed by docker",
    );

    await $`sudo sh`.stdin(
      await $`curl -fL https://raw.githubusercontent.com/docker/compose-switch/master/install_on_linux.sh`
        .text(),
    );

    const releaseInfo = await ghReleaseLatestInfo("docker", "compose-switch");
    const { tag_name } = releaseInfo;
    version = tag_name.split("v")?.at(1) ?? "";
  }
}

const meta: InstallerMeta = {
  name: $dirname(import.meta.url, true),
  path: $dirname(import.meta.url),
  type: env.OS === "darwin" ? "installed-managed" : "installed-manual",
  version,
  lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
