import {
  $,
  $dotdot,
  colors,
  dateFns,
  env,
  getChezmoiData,
  invariant,
  pptr,
  semver,
  UserAgent,
} from "../../mod.ts";

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
  appResourcesDir: ".res",
  sourceDir: "source",
  metaManifestName: ".installer-meta.json",
  ghReleaseInfoName: ".release-info.json",
  htmlReleaseInfoName: ".release-info.html",
  plainReleaseInfoName: ".release-info",
  versionPrefsName: ".versions.json",
  executableMask: 0o755,
};

export function getGroups() {
  const groups: Map<string, Set<string>> = new Map();

  // NOTE: if installation order matters, make sure to list
  // prerequisites earlier in the app name array
  groups.set(
    "devcontainer",
    new Set<string>(["core-tools", "node", "npm-globals", "bat", "gh"]),
  );
  groups.set("codespaces", new Set<string>(["core-tools", "bat"]));
  groups.set(
    "popos",
    new Set<string>([
      "core-tools",
      "system-libs",
      "peer-tools",
      "pop-launcher",
      "snapd",
      "flatpak",
      "kitty",
      "fonts",
      "node",
      "npm-globals",
      "gh",
      "bat",
      "vscode",
    ]),
  );

  return groups;
}

export async function getAppNames() {
  const appsDir = $dotdot(import.meta.url);
  const appNames: Set<string> = new Set();

  for await (const entry of Deno.readDir(appsDir)) {
    if (entry.isDirectory && !entry.name.startsWith("_")) appNames.add(entry.name);
  }

  return appNames;
}

export async function getInstallerMetas(inScope?: Set<string>) {
  const appsDir = $dotdot(import.meta.url);
  const allAppNames = await getAppNames();
  const inScopeApps = inScope
    ? Array.from(inScope).filter((n) => allAppNames.has(n))
    : Array.from(allAppNames);

  const installerMetas: InstallerMeta[] = [];

  for (const name of inScopeApps) {
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
    if (allNames.has(name)) {
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
        if (allNames.has(n)) {
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
  const request = $.request(`https://api.github.com/repos/${user}/${repo}/releases/latest`);

  if (env.GH_TOKEN) request.header({ Authorization: `token ${env.GH_TOKEN}` });

  return await request.json() as GHReleaseInfo;
}

export async function streamDownload(url: string, dest: string) {
  const isGitHub = ["github.com", "api.github.com", "objects.githubusercontent.com"]
    .includes(new URL(url).hostname);

  const request = $.request(url);
  if (isGitHub && env.GH_TOKEN) request.header({ Authorization: `token ${env.GH_TOKEN}` });

  const toPath = $.path.isAbsolute(dest) ? dest : $.path.resolve($.path.join(Deno.cwd(), dest));

  await $.fs.ensureDir($.path.dirname(toPath));
  await request.showProgress().pipeToPath(toPath);

  $.logStep("done:", `download saved to ${toPath}`);
}

export async function mostRelevantVersion(resourcesDir: string) {
  let version;
  let versionKeyUsed;

  const chezmoiData = await getChezmoiData();
  const dotVersionInfo = JSON.parse(
    await Deno.readTextFile($.path.join(resourcesDir, constants.versionPrefsName)),
  ) as Record<string, string>;

  const isMine = chezmoiData.is_personal_machine ? "personal" : "work";

  version ??= dotVersionInfo?.[`${isMine}-${env.OS}`];
  if (version && !versionKeyUsed) versionKeyUsed = `${isMine}-${env.OS}`;

  version ??= dotVersionInfo?.[`${env.OS}`];
  if (version && !versionKeyUsed) versionKeyUsed = `${env.OS}`;

  version ??= dotVersionInfo?.[`${isMine}`];
  if (version && !versionKeyUsed) versionKeyUsed = `${isMine}`;

  invariant(typeof version !== "undefined", "no version target available");

  $.log("  debug:", `target version ${version} from version key ${versionKeyUsed}`);

  return version;
}

export function isNewerVersion(latest: string = "", current: string = "") {
  const currentSem = semver.coerce(current);
  const latestSem = semver.coerce(latest);

  invariant(currentSem !== null, "missing required current version");
  invariant(latestSem !== null, "missing required latest version");

  return semver.gt(latestSem, currentSem) as boolean;
}

export type OutdatedCheck = {
  name: string;
  current?: string;
  latest?: string;
  skip?: string;
  outdated?: boolean;
};

export async function wrapOutdatedCheck(
  meta: InstallerMeta,
  frequencyDays = 3,
  latestFetcher = async () => (""),
  isNewer = isNewerVersion,
) {
  const outdatedCheck: OutdatedCheck = {
    name: meta.name,
    current: meta.version,
    skip: meta.type === "installed-manual"
      ? ""
      : meta.type === "installed-managed"
      ? "installation is managed"
      : "not installed",
  };

  if (meta.type === "installed-manual") {
    const lastCheckDistance = dateFns.differenceInDays(Date.now(), meta.lastCheck ?? Date.now());
    if (lastCheckDistance >= frequencyDays) {
      const latest = await latestFetcher();
      outdatedCheck.latest = latest;
      outdatedCheck.outdated = isNewer(latest, meta.version);

      meta.lastCheck = Date.now();

      const dotAppPath = $.path.join(meta.path, constants.appArtifactsDir);
      const metaManifestPath = $.path.join(dotAppPath, constants.metaManifestName);

      await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
    } else {
      outdatedCheck.skip = "last check too recent";
    }
  }

  return outdatedCheck;
}

export async function linkBinaryToUserPath(realBinaryPath: string, linkedBinaryName: string) {
  const linkPath = $.path.join(env.STANDARD_DIRS.LOCAL_BIN, linkedBinaryName);

  await $`chmod +x ${realBinaryPath}`;

  if (env.OS === "darwin") {
    await $`ln -sf ${realBinaryPath} ${linkPath}`;
  } else {
    await $`ln -sf ${realBinaryPath} ${linkPath}`;
  }

  return linkPath;
}

export async function unlinkBinaryFromUserPath(linkedBinaryName: string) {
  const linkPath = $.path.join(env.STANDARD_DIRS.LOCAL_BIN, linkedBinaryName);

  if (env.OS === "darwin") {
    await $`rm -f ${linkPath}`;
  } else {
    await $`rm -f ${linkPath}`;
  }

  return linkPath;
}

export async function linkDesktopFileForApp(app: string) {
  const desktopFile = $.path.join(env.STANDARD_DIRS.DOT_DOTS_APPS, app, ".desktop");
  const linkPath = $.path.join(env.STANDARD_DIRS.LOCAL_SHARE_APPS, `${app}.desktop`);

  invariant(await $.exists(desktopFile), `missing required .desktop file at ${desktopFile}`);

  if (env.OS === "darwin") {
    await $`ln -sf ${desktopFile} ${linkPath}`;
  } else {
    await $`ln -sf ${desktopFile} ${linkPath}`;
  }
}

export async function unlinkDesktopFileForApp(app: string) {
  const linkPath = $.path.join(env.STANDARD_DIRS.LOCAL_SHARE_APPS, `${app}.desktop`);

  if (env.OS === "darwin") {
    await $`rm -f ${linkPath}`;
  } else {
    await $`rm -f ${linkPath}`;
  }
}

export const getUA = (opts?: ConstructorParameters<typeof UserAgent>[0]) => {
  opts = Array.isArray(opts) ? opts.at(0) : opts;
  opts ??= {
    platform: "Linux x86_64",
    vendor: "Google Inc.",
    deviceCategory: "desktop",
    screenHeight: 1920,
    screenWidth: 1080,
  };

  return `${new UserAgent(opts)}`;
};
export type RunInBrowserFn = (browser: pptr.Browser) => Promise<void>;
export async function runInBrowser(fn: RunInBrowserFn) {
  let browser;

  try {
    browser = await pptr.default.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-dev-shm-usage",
      ],
    });

    await fn(browser);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Could not find browser revision")) {
      const puppeteerVersion = error.message.match(/Run "[^@]+@([^/]+)[^"]+" to download/i)?.at(1);

      invariant(
        typeof puppeteerVersion === "string" && puppeteerVersion.length > 0,
        "no browser download instructions provided",
      );

      // @see https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md#chrome-headless-doesnt-launch-on-unix
      const systemDeps = [
        "ca-certificates",
        "curl",
        "fonts-liberation",
        "libappindicator3-1",
        "libasound2",
        "libatk-bridge2.0-0",
        "libatk1.0-0",
        "libc6",
        "libcairo2",
        "libcups2",
        "libdbus-1-3",
        "libdrm2",
        "libexpat1",
        "libfontconfig1",
        "libgbm1",
        "libgcc1",
        "libglib2.0-0",
        "libgtk-3-0",
        "libnspr4",
        "libnss3",
        "libpango-1.0-0",
        "libpangocairo-1.0-0",
        "libstdc++6",
        "libx11-6",
        "libx11-xcb1",
        "libxcb1",
        "libxcomposite1",
        "libxcursor1",
        "libxdamage1",
        "libxext6",
        "libxfixes3",
        "libxi6",
        "libxkbcommon0",
        "libxrandr2",
        "libxrender1",
        "libxshmfence1",
        "libxss1",
        "libxtst6",
        "lsb-release",
        "unzip",
        "wget",
        "xdg-utils",
      ];

      await $`sudo apt install -y --no-install-recommends ${systemDeps}`;

      await $`deno run -A --unstable https://deno.land/x/puppeteer@${puppeteerVersion}/install.ts`
        .env({ PUPPETEER_PRODUCT: "chrome" });

      try {
        browser ??= await pptr.default.launch({
          headless: true,
          args: [
            "--no-sandbox",
            "--disable-dev-shm-usage",
          ],
        });

        await fn(browser);
      } catch (retryError) {
        throw retryError;
      } finally {
        await browser?.close();
      }
    } else {
      throw error;
    }
  } finally {
    await browser?.close();
  }
}

type NativefierAppArgs = { appName: string; displayName: string; website: string };
export async function createAndLinkNativefierApp(
  { appName, displayName, website }: NativefierAppArgs,
) {
  invariant(typeof (await $.which("node")) !== "undefined", "node is required");
  invariant(typeof (await $.which("npm")) !== "undefined", "npm is required");

  invariant(typeof appName === "string" && appName.length > 0, "invalid appName");
  invariant(typeof displayName === "string" && displayName.length > 0, "invalid displayName");
  invariant(typeof website === "string" && website.length > 0, "invalid website");
  invariant(website.startsWith("https://"), "invalid website protocol");

  const allAppNames = await getAppNames();
  invariant(allAppNames.has(appName), "unknown app name");

  const [{ path }] = await getInstallerMetas(new Set([appName]));
  const sourceDir = $.path.join(path, constants.appArtifactsDir, constants.sourceDir);
  const iconPath = $.path.join(env.STANDARD_DIRS.DOT_DOTS_APPS, appName, ".icon.png");
  const desktopPath = $.path.join(env.STANDARD_DIRS.DOT_DOTS_APPS, appName, ".desktop");

  invariant(await $.exists(iconPath), "icon file missing");
  invariant(await $.exists(desktopPath), "desktop file missing");

  await $.fs.ensureDir(sourceDir);
  await $.fs.emptyDir(sourceDir);

  await $`npx --yes nativefier@latest --name="${appName}" --icon="${iconPath}" --file-download-options='{"openFolderWhenDone": true}' ${website} ${sourceDir}`;

  let builtAppDir = "";
  for await (const dir of Deno.readDir(sourceDir)) {
    if (dir.isDirectory) builtAppDir = $.path.join(sourceDir, dir.name);
    break;
  }

  invariant(typeof builtAppDir === "string" && builtAppDir.length > 0, "invalid built app dir");

  const builtPackageJsonPath = $.path.join(builtAppDir, "resources", "app", "package.json");
  const builtPackageJson = JSON.parse(await Deno.readTextFile(builtPackageJsonPath));
  await Deno.writeTextFile(
    builtPackageJsonPath,
    JSON.stringify({ ...builtPackageJson, name: displayName }, null, 2),
  );

  const builtAppBin = $.path.join(builtAppDir, appName);
  invariant(await $.exists(builtAppBin), "app bin missing");

  await linkBinaryToUserPath(builtAppBin, appName);
  await linkDesktopFileForApp(appName);
}

export async function unlinkNativefierApp(appName: string) {
  const allAppNames = await getAppNames();
  invariant(allAppNames.has(appName), "unknown app name");

  await unlinkDesktopFileForApp(appName);
  await unlinkBinaryFromUserPath(appName);
}
