#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net=deno.land --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { dumkit } from "../_cli/dumkit.ts";

const dotMemoPath = $.path.join($.$dirname(import.meta.url), dumkit.constants.updaterMemoDir);
await $.fs.ensureDir(dotMemoPath);

const zgenomCheckFile = $.path.join(dotMemoPath, ".check_timestamp");
const now = new Date();
const next = $.dateFns.addDays(now, 7);
const nextUnix = $.dateFns.getUnixTime(next);

let shouldNotify = true;

if (!(await $.exists(zgenomCheckFile))) {
	await Deno.writeTextFile(zgenomCheckFile, `${nextUnix}`);
} else {
	const savedUnix = $.dateFns.fromUnixTime(Number(
		(await Deno.readTextFile(zgenomCheckFile)).trim(),
	));

	if ($.dateFns.isAfter(now, savedUnix)) {
		await Deno.writeTextFile(zgenomCheckFile, `${nextUnix}`);
	} else {
		shouldNotify = false;
	}
}

if (shouldNotify) {
	$.log($.dedent`
		Update ${$.colors.bold($.colors.yellow("zgenom"))} by running the following:

		${$.colors.green("zgenom selfupdate && zgenom update && rm -rf ~/.zcompdump*")}

		This will update zgenom itself, then update all of your
		repositories, then remove the compiled completions which
		will be rebuilt on next shell restart.
	`);
}
