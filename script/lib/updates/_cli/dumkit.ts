import { $dotdot } from "../../mod.ts";

export const constants = {
  updaterResourcesDir: ".res",
};

export async function getUpdaterNames() {
  const updatersDir = $dotdot(import.meta.url);
  const updaterNames: Set<string> = new Set();

  for await (const entry of Deno.readDir(updatersDir)) {
    if (entry.isDirectory && !entry.name.startsWith("_")) updaterNames.add(entry.name);
  }

  return updaterNames;
}
