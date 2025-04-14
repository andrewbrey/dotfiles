#!/usr/bin/env -S deno run --allow-sys --allow-env --allow-net=deno.land,api.github.com,github.com,objects.githubusercontent.com --allow-read --allow-write --allow-run

import { $, invariant } from "../../mod.ts";
import { pamkit } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

const cascadia = $.env.OS === "darwin" ? "font-caskaydia-mono-nerd-font" : "CascadiaMono";
const droid = $.env.OS === "darwin" ? "font-droid-sans-mono-nerd-font" : "DroidSansMono";
const intelone = $.env.OS === "darwin" ? "font-intone-mono-nerd-font" : "IntelOneMono";
const jetbrains = $.env.OS === "darwin" ? "font-jetbrains-mono-nerd-font" : "JetBrainsMono";
const meslo = $.env.OS === "darwin" ? "font-meslo-lg-nerd-font" : "Meslo";
const monaspace = $.env.OS === "darwin" ? "font-monaspace-nerd-font" : "Monaspace";
const recursive = $.env.OS === "darwin" ? "font-recursive-mono-nerd-font" : "Recursive";
const victor = $.env.OS === "darwin" ? "font-victor-mono-nerd-font" : "VictorMono";
const _envycoder = $.env.OS === "darwin" ? "font-envy-code-r-nerd-font" : "EnvyCodeR";
const _hurmit = $.env.OS === "darwin" ? "font-hurmit-nerd-font" : "Hermit";
const _hack = $.env.OS === "darwin" ? "font-hack-nerd-font" : "Hack"; // TODO: remove? this font is a huge download
const _iosevka = $.env.OS === "darwin" ? "font-iosevka-nerd-font" : "Iosevka"; // TODO: remove? this font is a huge download

// TODO: Add Maple Mono font https://font.subf.dev/en/ (and update wezterm configuration?)

const chezmoiData = await $.getChezmoiData();

const fonts = chezmoiData.is_containerized
	? [droid]
	: [cascadia, droid, jetbrains, intelone, meslo, monaspace, recursive, victor];

const [meta] = await pamkit.getInstallerMetas(
	new Set([$.$dirname(import.meta.url, true)]),
);

await $.onMac(async () => {
	if (meta.type === "uninstalled") {
		await $`brew tap homebrew/cask-fonts`.env({ HOMEBREW_NO_ANALYTICS: "1" });
		await $`brew install --cask ${fonts}`.env({ HOMEBREW_NO_ANALYTICS: "1" });
	}
});

await $.onLinux(async () => {
	if (meta.type === "uninstalled") {
		const releaseInfoPath = $.path.join(dotAppPath, pamkit.constants.jsonReleaseInfoName);

		const releaseInfo = await $.ghReleaseInfo("ryanoasis", "nerd-fonts");
		await Deno.writeTextFile(releaseInfoPath, JSON.stringify(releaseInfo, null, 2));

		const { assets, tag_name } = releaseInfo;
		meta.version = tag_name.split("v")?.at(1) ?? "0.0.0";

		const fontsDirPath = $.path.join($.env.HOME, ".local", "share", "fonts");
		await $.fs.ensureDir(fontsDirPath);

		for (const fontName of fonts) {
			const targetName = `${fontName}.zip`;
			const targetAsset = assets.find((a) => a.name === targetName);

			invariant(typeof targetAsset !== "undefined", "no suitable download target found");

			const archivePath = $.path.join(dotAppPath, targetName);

			await $.streamDownload(targetAsset.browser_download_url, archivePath);
			await $`unzip -o ${archivePath} -d ${fontsDirPath}`;
			await $`rm -f ${archivePath}`;
		}

		await $`fc-cache -vr`;
		await $`sudo fc-cache -vr`;
	}
});

meta.type = $.env.OS === "darwin" ? "installed-managed" : "installed-manual";
meta.lastCheck = Date.now();

const metaManifestPath = $.path.join(dotAppPath, pamkit.constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
