import { $dotdot } from "../../mod.ts";

export type InstallerMeta = {
  name: string;
  version: string;
  type: "uninstalled" | "installed-managed" | "installed-manual";
  updates: {
    checked: string;
    manual: boolean;
  } | false;
};

export async function getInstallerMetas() {
  const apps: string[] = [];

  for await (const entry of Deno.readDir($dotdot(import.meta.url))) {
    if (entry.isDirectory && !entry.name.startsWith("_")) apps.push(entry.name);
  }

  const installerMetas: InstallerMeta[] = [];

  for (const app of apps) {
    // TODO: check for an installer meta manifest, if found, read/parse and add - otherwise make a default
    const meta: InstallerMeta = {
      name: app,
      version: "",
      type: "uninstalled",
      updates: false,
    };

    installerMetas.push(meta);
  }

  return installerMetas;
}
