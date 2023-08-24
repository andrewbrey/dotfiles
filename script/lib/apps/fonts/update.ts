#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net=deno.land,api.github.com,github.com,objects.githubusercontent.com --allow-read --allow-write --allow-run

import { $, invariant } from "../../mod.ts";
import { pamkit } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

const jetbrains = $.env.OS === "darwin" ? "font-jetbrains-mono-nerd-font" : "JetBrainsMono";
const droid = $.env.OS === "darwin" ? "font-droid-sans-mono-nerd-font" : "DroidSansMono";
const intelone = $.env.OS === "darwin" ? "font-intel-one-mono" : "IntelOneMono";
const _hack = $.env.OS === "darwin" ? "font-hack-nerd-font" : "Hack"; // TODO: remove? this font is a huge download
const _iosevka = $.env.OS === "darwin" ? "font-iosevka-nerd-font" : "Iosevka"; // TODO: remove? this font is a huge download

const chezmoiData = await $.getChezmoiData();

const fonts = chezmoiData.is_containerized ? [droid] : [droid, jetbrains, intelone];

const [meta] = await pamkit.getInstallerMetas(new Set([$.$dirname(import.meta.url, true)]));
if (meta.type !== "uninstalled") {
	if ($.env.OS /* TODO: refactor to os helpers */ === "darwin") {
		$.logGroup(() => {
			$.logWarn(
				"warn:",
				$.dedent`
    			installation is managed; skipping manual update

    		`,
			);
		});
	} else {
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

		meta.lastCheck = Date.now();
	}
}

const metaManifestPath = $.path.join(dotAppPath, pamkit.constants.metaManifestName);
await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
