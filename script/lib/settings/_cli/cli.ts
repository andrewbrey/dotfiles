#!/usr/bin/env -S deno run --allow-env --allow-net=deno.land --allow-read --allow-write --allow-run

import { colors, command } from "../../mod.ts";

const samoji = `${colors.yellow("(¬‿¬)")}`;
const sam = `${colors.yellow("Sam")}`;

await new command.Command()
  .name("sam")
  .version("1.0.0")
  .description(`${samoji} -- {(Hello, I'm ${sam}, your settings application manager)}`)
  .action(function defaultAction() {
    this.showHelp();
  })
  .parse(Deno.args);
