#!/usr/bin/env -S deno run --allow-sys --allow-env --allow-net=deno.land --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";

const chezmoiData = await $.getChezmoiData();
const hasDconf = await $.commandExists("dconf");

if (!chezmoiData.is_containerized && (chezmoiData.is_popos || chezmoiData.is_ubuntu) && hasDconf) {
	const extensionsDir = $.path.join(
		$.$dotdot(import.meta.url, 2),
		"apps",
		"gnome-shell-extensions",
		".res",
		".extensions",
	);

	const extensionNames: string[] = [];
	for await (const ext of Deno.readDir(extensionsDir)) {
		extensionNames.push(ext.name);
	}
	extensionNames.sort();

	const dumpsWithErrors: string[] = [];
	for (const extName of extensionNames) {
		const extDir = $.path.join(extensionsDir, extName);

		const { dconf } = JSON.parse(
			await Deno.readTextFile($.path.join(extDir, "ext.json")),
		) as any;
		const dumpResult = await $`dconf dump ${dconf}`.noThrow().stdout("piped");

		if (dumpResult.code !== 0) {
			dumpsWithErrors.push(extName);
		} else {
			Deno.writeTextFile($.path.join(extDir, "settings.dconf"), dumpResult.stdout);
		}
	}

	if (dumpsWithErrors.length) {
		const lister = new Intl.ListFormat(undefined, { type: "conjunction", style: "short" });
		$.logError(
			"error:",
			`extension settings dumps completed with errors: ${lister.format(dumpsWithErrors)}`,
		);
	}
}
