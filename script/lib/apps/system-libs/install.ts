#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net=deno.land --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { type InstallerMeta, pamkit } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

const list = $.env.OS === "darwin" ? [] : [
	"apt-transport-https",
	"build-essential",
	"ca-certificates",
	"clang",
	"file",
	"gir1.2-gmenu-3.0",
	"libayatana-appindicator3-dev",
	"libgtk-3-dev",
	"libgtksourceview-3.0-dev",
	"libnss3-tools",
	"librsvg2-dev",
	"libssl-dev",
	"libwebkit2gtk-4.0-dev",
	"lsb-release",
	"nsis",
	"squashfs-tools",
	"xdg-desktop-portal-gnome",
];
if ($.env.OS /* TODO: refactor to os helpers */ === "darwin") {
	if (list.length) {
		await $`brew install ${list}`.env({ HOMEBREW_NO_ANALYTICS: "1" });
	}
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
