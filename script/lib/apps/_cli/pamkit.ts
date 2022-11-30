import { $, $dotdot, colors, got, nodeFS, prettyBytes } from "../../mod.ts";

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

export type GHReleaseInfo = {
  name: string;
  tag_name: string;
  assets: { name: string; browser_download_url: string }[];
};

export const constants = {
  appArtifactsDir: ".app",
  appResourcesDir: ".resources",
  metaManifestName: ".installer-meta.json",
  ghReleaseInfoName: ".release-info.json",
};

export function getGroups() {
  const groups: Map<string, Set<string>> = new Map();

  // NOTE: if installation order matters, make sure to list
  // prerequisites earlier in the app name array
  groups.set("devcontainer", new Set<string>(["node", "npm-globals", "bat", "gh"]));

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
    const metaManifestPath = $.path.join(
      pamPath,
      constants.appArtifactsDir,
      constants.metaManifestName,
    );

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

/**
 * Determine all apps that should be included in a given operation.
 *
 * Note that if there are dependencies/prerequisites for some
 * apps, such as might be the case when installing apps, you
 * need to manually ensure that prerequisites are in place,
 * perhaps by running your pam commands in stages (or using
 * app groups which can specify order)
 */
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

export async function ghReleaseLatestInfo(user: string, repo: string) {
  return await $.request(`https://api.github.com/repos/${user}/${repo}/releases/latest`)
    .json() as GHReleaseInfo;
}

export async function streamDownload(url: string, dest: string) {
  return new Promise<void>((resolve, reject) => {
    const downloadStream = got.stream(url);
    const fileWriterStream = nodeFS.createWriteStream(dest);

    let progressAnnounce = 10;

    // `downloadStream` is a nodejs `Request` from `got`, not a web standard
    //  one, ignore TypeScript complaints about EventEmitter methods :shrug:
    (downloadStream as any)
      .on("downloadProgress", ({ transferred, total, percent }: any) => {
        const percentage = Math.round(percent * 100);
        if (percentage >= progressAnnounce) {
          $.logLight(
            "  debug:",
            `${prettyBytes(transferred)} of ${prettyBytes(total)} (${percentage}%)`,
          );
          progressAnnounce += 10;
        }
      })
      .on("error", (error: Error) => {
        $.logError("error:", error.message);
        reject();
      });

    fileWriterStream
      .on("error", (error) => {
        $.logError("error:", error.message);
        reject();
      })
      .on("finish", () => {
        $.logStep("done:", `download saved to ${dest}`);
        resolve();
      });

    $.log(`downloading ${url} to ${dest}`);
    downloadStream.pipe(fileWriterStream);
  });
}

/** Useful subset of the data available when running `chezmoi data` */
export type ChezmoiData = {
  chezmoi: {
    arch: string;
    fqdnHostname: string;
    hostname: string;
    kernel: { osrelease: string; ostype: string; version: string };
    os: string;
    osRelease: {
      id: string;
      idLike: string;
      name: string;
      prettyName: string;
      version: string;
      versionCodename: string;
      versionID: string;
    };
  };
  is_cloud: boolean;
  is_codespaces: boolean;
  is_containerized: boolean;
  is_gitpod: boolean;
  is_linux: boolean;
  is_mac: boolean;
  is_personal_machine: boolean;
  is_popos: boolean;
  is_remote_container: boolean;
  is_ubuntu: boolean;
  standard_dirs: { code: string; npm_install: string; pnpm_install: string };
};

export async function getChezmoiData() {
  return await $`chezmoi data`.json() as ChezmoiData;
}
