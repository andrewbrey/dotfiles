#!/usr/bin/env -S deno run --allow-env --allow-net=deno.land --allow-read --allow-write

import { flags } from "../mod.ts";

type InstallerMeta = {
  name: string;
  version: string;
  type: "uninstalled" | "installed-managed" | "installed-manual";
  updates: {
    checked: string;
    manual: boolean;
  } | false;
};

const args = flags.parse<{ group: string }>(Deno.args, {});

// TODO: implement app install cli
