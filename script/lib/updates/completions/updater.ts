#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net=deno.land --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";

if (await $.commandExists("bw")) {
	const completions = await $`bw completion --shell zsh`.timeout("5s").text();

	await Deno.writeTextFile(
		$.path.join($.env.STANDARD_DIRS.DOT_DOTS, "completions", "_bw"),
		completions,
	);
}

if (await $.commandExists("chezmoi")) {
	const completions = await $`chezmoi completion zsh`.timeout("5s").text();

	await Deno.writeTextFile(
		$.path.join($.env.STANDARD_DIRS.DOT_DOTS, "completions", "_chezmoi"),
		completions,
	);
}

if (await $.commandExists("deno")) {
	const completions = await $`deno completions --unstable zsh`.timeout("5s").text();

	await Deno.writeTextFile(
		$.path.join($.env.STANDARD_DIRS.DOT_DOTS, "completions", "_deno"),
		completions,
	);
}
if (await $.commandExists("flyctl")) {
	const completions = await $`flyctl completion zsh`.timeout("5s").text();

	await Deno.writeTextFile(
		$.path.join($.env.STANDARD_DIRS.DOT_DOTS, "completions", "_flyctl"),
		completions,
	);
}

if (await $.commandExists("gh")) {
	const completions = await $`gh completion -s zsh`.timeout("5s").text();

	await Deno.writeTextFile(
		$.path.join($.env.STANDARD_DIRS.DOT_DOTS, "completions", "_gh"),
		completions,
	);
}

if (await $.commandExists("supabase")) {
	const completions = await $`supabase completion zsh`.timeout("5s").text();

	await Deno.writeTextFile(
		$.path.join($.env.STANDARD_DIRS.DOT_DOTS, "completions", "_supabase"),
		completions,
	);
}
