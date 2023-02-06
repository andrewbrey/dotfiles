#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net=deno.land,starship.rs --allow-read --allow-run --allow-write

// =====
// NOTE: this script (and all subsequent bootstrap scripts) expect
// to be run from an interactive terminal (TTY). There might be
// issues if that is not the case
// =====

import { $ } from "../mod.ts";

const id = `==> ${$.path.basename(import.meta.url)}`;

$.logGroup($.colors.black.bgYellow(id));

if (await $.commandMissing("gpg")) {
	$.logWarn("warn: gpg not found");

	$.logGroup();

	$.logStep("installing gpg...");

	const gnupg = $.env.OS === "darwin" ? "gnupg" : "gnupg";
	if ($.env.OS === "darwin") {
		await $`brew install ${gnupg}`.env({ HOMEBREW_NO_ANALYTICS: "1" });
	} else {
		await $`sudo apt install -y ${gnupg}`;
	}

	$.logGroupEnd();
}

$.logGroupEnd();

$.logStep("done with", id);
