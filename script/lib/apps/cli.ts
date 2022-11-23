#!/usr/bin/env -S deno run --allow-env --allow-net=deno.land --allow-read --allow-write

import { command } from "../mod.ts";

type InstallerMeta = {
  name: string;
  version: string;
  type: "uninstalled" | "installed-managed" | "installed-manual";
  updates: {
    checked: string;
    manual: boolean;
  } | false;
};

const cli = await new command.Command()
  .name("appz")
  .version("1.0.0")
  .description("personal application manager")
  .command("list", "list installed apps with their metadata")
  .action((options, ...args) => {
    console.log(options, args);
  })
  .parse(Deno.args);
