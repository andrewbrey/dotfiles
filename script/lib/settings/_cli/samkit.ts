import { $dotdot } from "../../mod.ts";

export const constants = {
  settingResourcesDir: ".res",
};

export async function getSettingNames() {
  const settingsDir = $dotdot(import.meta.url);
  const settingNames: Set<string> = new Set();

  for await (const entry of Deno.readDir(settingsDir)) {
    if (entry.isDirectory && !entry.name.startsWith("_")) settingNames.add(entry.name);
  }

  return settingNames;
}
