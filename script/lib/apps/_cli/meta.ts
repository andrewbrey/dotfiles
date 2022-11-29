import { $, $dotdot } from "../../mod.ts";

export type InstallerMeta = {
  /** Name used to identify this app with the app management cli */
  name: string;
  /** Type of installation for this app */
  type: "uninstalled" | "installed-managed" | "installed-manual";
  /** Version number for this app, undefined if the app is not installed */
  version?: string;
  /** Info about app updates, or undefined if app is not installed */
  updates?: {
    /** Date.now() from most recent "outdated" check */
    checked: number;
    /** True if updates need to be performed manually */
    manual: boolean;
  };
};

export function getGroups() {
  const groups: Map<string, Set<string>> = new Map();
  // TODO: establish groups
  groups.set("basic", new Set<string>(["bat", "fonts", "starship"]));

  return groups;
}

export async function getAppNames() {
  const appsDir = $dotdot(import.meta.url);
  const appNames: string[] = [];

  for await (const entry of Deno.readDir(appsDir)) {
    if (entry.isDirectory && !entry.name.startsWith("_")) appNames.push(entry.name);
  }

  return appNames;
}

export async function getInstallerMetas() {
  const appsDir = $dotdot(import.meta.url);
  const appNames = await getAppNames();

  const installerMetas: InstallerMeta[] = [];

  for (const name of appNames) {
    const meta: InstallerMeta = { name, type: "uninstalled" };

    const metaManifestPath = $.path.join(appsDir, name, ".app", ".installer-meta.json");
    if (await $.exists(metaManifestPath)) {
      const rawManifest = await Deno.readTextFile(metaManifestPath);
      const parsedManifest = JSON.parse(rawManifest) as InstallerMeta;

      if (parsedManifest.type) meta.type = parsedManifest.type;
      if (parsedManifest.version) meta.version = parsedManifest.version;
      if (parsedManifest.updates) meta.updates = parsedManifest.updates;
    }

    installerMetas.push(meta);
  }

  return installerMetas;
}
