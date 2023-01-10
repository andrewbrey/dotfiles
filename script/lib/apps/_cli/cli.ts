#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net=deno.land --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { install } from "./cmd/install.ts";
import { list } from "./cmd/list.ts";
import { outdated } from "./cmd/outdated.ts";
import { remove } from "./cmd/remove.ts";
import { scaffold } from "./cmd/scaffold.ts";
import { update } from "./cmd/update.ts";

const pamoji = `${$.colors.yellow("且_(・-・)")}`;
const pam = `${$.colors.yellow("Pam")}`;

await new $.cliffy.cmd.Command()
  .name("pam")
  .version("1.0.0")
  .description(`${pamoji} -- {(Hello, I'm ${pam}, your personal application manager)}`)
  .action(function defaultAction() {
    this.showHelp();
  })
  .command("list", list)
  .command("install", install)
  .command("outdated", outdated)
  .command("update", update)
  .command("remove", remove)
  .command("new", scaffold)
  .parse(Deno.args);
