#!/usr/bin/env -S deno run --allow-sys --allow-env --allow-net=deno.land --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { apply } from "./cmd/apply.ts";

const samoji = `${$.colors.yellow("(¬‿¬)_且")}`;
const sam = `${$.colors.yellow("Sam")}`;

await new $.cliffy.cmd.Command()
	.name("sam")
	.version("1.0.0")
	.description(`${samoji} -- {(Hello, I'm ${sam}, your settings application manager)}`)
	.action(function defaultAction() {
		this.showHelp();
	})
	.command("apply", apply)
	.parse(Deno.args);
