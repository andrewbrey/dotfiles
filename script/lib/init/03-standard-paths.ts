#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net=deno.land --allow-read --allow-write --allow-run

import { $ } from "../mod.ts";

const id = `==> ${$.path.basename(import.meta.url)}`;

$.logGroup($.colors.black.bgYellow(id));

$.logStep("step: place standard dirs");

for (const [name, path] of Object.entries($.env.STANDARD_DIRS)) {
	$.logLight(
		`ensuring presence of ${$.colors.magenta(name.toLocaleLowerCase())} directory at ${
			$.colors.magenta(path)
		}`,
	);
	await $.fs.ensureDir(path);
}

$.logStep("step: place standard files");

await $.fs.ensureFile(`${$.env.HOME}/.hushlogin`);
await $.fs.ensureDir($.env.STANDARD_DIRS.DOT_DOTS);

const dotExtra = `${$.env.STANDARD_DIRS.DOT_DOTS}/.extra`;
if (!(await $.exists(dotExtra))) {
	await Deno.writeTextFile(
		dotExtra,
		`#!/usr/bin/env zsh

# =====
# chezmoi ignored
# =====
#
# this file can contain shell-exports (variables, functions, and aliases) that
# are ignored by dotfiles management.

`,
	);
}

$.logGroupEnd();

$.logStep("done with", id);
