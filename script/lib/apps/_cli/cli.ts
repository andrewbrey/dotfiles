#!/usr/bin/env -S deno run --allow-env --allow-net=deno.land --allow-read --allow-write

import { colors, command } from "../../mod.ts";
import { install } from "./cmd/install.ts";
import { list } from "./cmd/list.ts";

const pamoji = `${colors.yellow("且_(・-・)")}`;
const pam = `${colors.yellow("Pam")}`;

await new command.Command()
  .name("pam")
  .version("1.0.0")
  .description(`${pamoji} -- {(Hello, I'm ${pam}, your personal application manager)}`)
  .action(function defaultAction() {
    this.showHelp();
  })
  .command("list", list)
  .command("install", install)
  .parse(Deno.args);
