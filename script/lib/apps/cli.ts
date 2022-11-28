#!/usr/bin/env -S deno run --allow-env --allow-net=deno.land --allow-read --allow-write

import { command } from "../mod.ts";
import { $dirname } from "../util.ts";

type InstallerMeta = {
  name: string;
  version: string;
  type: "uninstalled" | "installed-managed" | "installed-manual";
  updates: {
    checked: string;
    manual: boolean;
  } | false;
};

const apps: string[] = [];
for await (const entry of Deno.readDir($dirname(import.meta.url))) {
  if (entry.isDirectory) apps.push(entry.name);
}

const cli = await new command.Command()
  .name("pam")
  .version("1.0.0")
  .description("Personal application manager")
  .command("list", "List metadata about available apps.")
  .option("--all", "List metadata for all available apps, both installed and uninstalled.")
  .option("-i, --installed", "List metadata for installed apps.")
  .option("-u, --uninstalled", "List metadata for uninstalled apps.")
  .action(async ({ all, installed, uninstalled }, ...args) => {
    console.log(apps);
  })
  .parse(Deno.args);
