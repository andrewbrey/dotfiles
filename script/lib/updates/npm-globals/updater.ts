#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net=deno.land --allow-read --allow-write --allow-run

import { $, invariant } from "../../mod.ts";

const hasNode = await $.commandExists("node");
const hasNPM = await $.commandExists("npm");
const hasNCU = await $.commandExists("ncu");

if (hasNode && hasNPM && hasNCU) {
  const ncu = await $`ncu -g`.stdout("inheritPiped").stderr("null");
  if (ncu.stdout.includes("All global packages are up-to-date")) {
    Deno.exit(0);
  }

  const updateLine = ncu.stdout.split("\n").find((l) => l.startsWith("npm -g"));

  invariant(typeof updateLine !== "undefined", "invalid update line");

  const packagesWithUpdates = updateLine.split("npm -g install ")?.at(1)?.split(" ") ?? [];
  const packagesToIgnore: string[] = [];

  const packagesToUpdate = (
    packagesToIgnore.length
      ? packagesWithUpdates.filter((p) => packagesToIgnore.some((i) => !p.includes(i)))
      : [...packagesWithUpdates]
  ).map((p) => p.trim());

  if (!packagesToUpdate.length) {
    await $`echo skipping update of ignored packages: ${packagesToIgnore}`;
  }

  await $`npm i -g --ignore-engines ${packagesToUpdate}`;
}
