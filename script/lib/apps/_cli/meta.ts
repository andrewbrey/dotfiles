import { $, $dotdot, colors } from "../../mod.ts";

export type InstallerMeta = {
  /** Name used to identify this app with the app management cli */
  name: string;
  /** Absolute path on disk to this apps directory for the app management cli */
  path: string;
  /** Type of installation for this app */
  type: "uninstalled" | "installed-managed" | "installed-manual";
  /** Version number for this app, undefined if the app is not installed */
  version?: string;
  /** Date.now() from most recent "outdated" check, undefined if the app is not installed */
  lastCheck?: number;
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

export async function getInstallerMetas(inScope?: Set<string>) {
  const appsDir = $dotdot(import.meta.url);
  let appNames = await getAppNames();

  if (inScope) {
    appNames = appNames.filter((n) => inScope.has(n));
  }

  const installerMetas: InstallerMeta[] = [];

  for (const name of appNames) {
    const pamPath = $.path.join(appsDir, name);
    const meta: InstallerMeta = { name, path: pamPath, type: "uninstalled" };
    const metaManifestPath = $.path.join(pamPath, ".app", ".installer-meta.json");

    if (await $.exists(metaManifestPath)) {
      const rawManifest = await Deno.readTextFile(metaManifestPath);
      const parsedManifest = JSON.parse(rawManifest) as InstallerMeta;

      if (parsedManifest.type) meta.type = parsedManifest.type;
      if (parsedManifest.version) meta.version = parsedManifest.version;
      if (parsedManifest.lastCheck) meta.lastCheck = parsedManifest.lastCheck;
    }

    installerMetas.push(meta);
  }

  return installerMetas;
}

export async function calculateAppsInScope(
  opts: {
    /** Include **all** known apps */
    all: boolean;
    /** Include all *installed* apps */
    installed: boolean;
    /** Include all *uninstalled* apps */
    uninstalled: boolean;
    /** Included app names */
    apps: string[];
    /** Included app group names */
    groups: string[];
  },
) {
  const inScope: Set<string> = new Set();

  const allNames = await getAppNames();
  const allMetas = await getInstallerMetas();
  const appGroups = getGroups();

  // =====
  // handle simple opts
  // =====
  if (opts.all) {
    allNames.forEach((m) => inScope.add(m));
  }

  if (opts.installed) {
    allMetas.filter((m) => m.type !== "uninstalled").forEach((m) => inScope.add(m.name));
  }

  if (opts.uninstalled) {
    allMetas.filter((m) => m.type === "uninstalled").forEach((m) => inScope.add(m.name));
  }

  // =====
  // handle apps by name
  // =====
  const unknownAppNames = new Set<string>();
  for (const name of opts.apps) {
    if (allNames.includes(name)) {
      inScope.add(name);
    } else {
      unknownAppNames.add(name);
    }
  }

  // =====
  // handle apps by group
  // =====
  const unknownAppGroups = new Set<string>();
  for (const name of opts.groups) {
    const foundGroup = appGroups.get(name);

    if (foundGroup) {
      foundGroup.forEach((n) => {
        if (allNames.includes(n)) {
          inScope.add(n);
        } else {
          // =====
          // warn about bad apps within known groups
          // =====
          $.logError(
            "error:",
            `group called ${colors.blue(name)} contains unknown app ${colors.yellow(n)}`,
          );
        }
      });
    } else {
      unknownAppGroups.add(name);
    }
  }

  // =====
  // warn about unknown app names
  // =====
  unknownAppNames.forEach((a) => $.logError("error:", `unknown --app named ${colors.yellow(a)} `));

  // =====
  // warn about unknown app groups
  // =====
  unknownAppGroups.forEach((g) =>
    $.logError("error:", `unknown --group named ${colors.yellow(g)} `)
  );

  return inScope;
}
