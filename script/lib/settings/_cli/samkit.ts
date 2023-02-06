import { $ } from "../../mod.ts";

const constants = {
	settingResourcesDir: ".res",
};

async function getSettingNames() {
	const settingsDir = $.$dotdot(import.meta.url);
	const settingNames: Set<string> = new Set();

	for await (const entry of Deno.readDir(settingsDir)) {
		if (entry.isDirectory && !entry.name.startsWith("_")) settingNames.add(entry.name);
	}

	return settingNames;
}

export const samkit = {
	constants,
	getSettingNames,
} as const;
