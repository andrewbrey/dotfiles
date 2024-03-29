#!/usr/bin/env -S deno run --allow-sys --allow-env --allow-net=deno.land --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { type InstallerMeta, pamkit } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

const ffmpeg = $.env.OS === "darwin" ? "ffmpeg" : "ffmpeg";
const imagemagick = $.env.OS === "darwin" ? "imagemagick" : "imagemagick";

const list = [ffmpeg, imagemagick];

if ($.env.OS /* TODO: refactor to os helpers */ === "linux") {
	[
		"libnotify-bin",
		"wmctrl",
		"xclip",
		"xdotool",
		"xsel",
	].forEach((p) => list.push(p));
}

if ($.env.OS /* TODO: refactor to os helpers */ === "darwin") {
	await $`brew install ${list}`.env({ HOMEBREW_NO_ANALYTICS: "1" });
} else {
	await $`sudo apt install -y ${list}`;
}

const meta: InstallerMeta = {
	name: $.$dirname(import.meta.url, true),
	path: $.$dirname(import.meta.url),
	type: "installed-managed",
	version: "",
	lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, pamkit.constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
