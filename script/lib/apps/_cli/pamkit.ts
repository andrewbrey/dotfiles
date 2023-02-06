import { $, invariant } from "../../mod.ts";

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

const constants = {
	appArtifactsDir: ".app",
	appResourcesDir: ".res",
	sourceDir: "source",
	metaManifestName: ".installer-meta.json",
	jsonReleaseInfoName: ".release-info.json",
	htmlReleaseInfoName: ".release-info.html",
	plainReleaseInfoName: ".release-info",
	versionPrefsName: ".versions.json",
	executableMask: 0o755,
};

function getGroups() {
	const groups: Map<string, Set<string>> = new Map();

	// NOTE: if installation order matters, make sure to list
	// prerequisites earlier in the app name array
	groups.set(
		"devcontainer",
		new Set<string>(["core-tools", "delta", "node", "npm-globals", "bat", "gh"]),
	);
	groups.set("codespaces", new Set<string>(["core-tools", "bat"]));
	groups.set(
		"popos",
		new Set<string>([
			"core-tools",
			"system-libs",
			"peer-tools",
			"delta",
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

async function getAppNames() {
	const appsDir = $.$dotdot(import.meta.url);
	const appNames: Set<string> = new Set();

	for await (const entry of Deno.readDir(appsDir)) {
		if (entry.isDirectory && !entry.name.startsWith("_")) appNames.add(entry.name);
	}

	return appNames;
}

async function getInstallerMetas(inScope?: Set<string>) {
	const appsDir = $.$dotdot(import.meta.url);
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
async function calculateAppsInScope(
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
						`group called ${$.colors.blue(name)} contains unknown app ${$.colors.yellow(n)}`,
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
	unknownAppNames.forEach((a) =>
		$.logError("error:", `unknown --app named ${$.colors.yellow(a)} `)
	);

	// =====
	// warn about unknown app groups
	// =====
	unknownAppGroups.forEach((g) =>
		$.logError("error:", `unknown --group named ${$.colors.yellow(g)} `)
	);

	return inScope;
}

async function mostRelevantVersion(resourcesDir: string) {
	let version;
	let versionKeyUsed;

	const chezmoiData = await $.getChezmoiData();
	const dotVersionInfo = JSON.parse(
		await Deno.readTextFile($.path.join(resourcesDir, constants.versionPrefsName)),
	) as Record<string, string>;

	const isMine = chezmoiData.is_personal_machine ? "personal" : "work";

	version ??= dotVersionInfo?.[`${isMine}-${$.env.OS}`];
	if (version && !versionKeyUsed) versionKeyUsed = `${isMine}-${$.env.OS}`;

	version ??= dotVersionInfo?.[`${$.env.OS}`];
	if (version && !versionKeyUsed) versionKeyUsed = `${$.env.OS}`;

	version ??= dotVersionInfo?.[`${isMine}`];
	if (version && !versionKeyUsed) versionKeyUsed = `${isMine}`;

	invariant(typeof version !== "undefined", "no version target available");

	$.log("  debug:", `target version ${version} from version key ${versionKeyUsed}`);

	return version;
}

function isNewerVersion(latest: string = "", current: string = "") {
	const latestSem = $.semver.valid(latest);
	const currentSem = $.semver.valid(current);

	invariant(latestSem !== null, "missing required latest version");
	invariant(currentSem !== null, "missing required current version");

	return $.semver.gt(latestSem, currentSem) as boolean;
}

export type OutdatedCheck = {
	name: string;
	current?: string;
	latest?: string;
	skip?: string;
	outdated?: boolean;
};

async function wrapOutdatedCheck(
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
		const lastCheckDistance = $.dateFns.differenceInDays(Date.now(), meta.lastCheck ?? Date.now());
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

async function linkBinaryToUserPath(realBinaryPath: string, linkedBinaryName: string) {
	const linkPath = $.path.join($.env.STANDARD_DIRS.LOCAL_BIN, linkedBinaryName);

	try {
		$.nodeFS.accessSync(realBinaryPath, $.nodeFS.constants.X_OK);
	} catch (error) {
		await $`chmod +x ${realBinaryPath}`;
	}

	if ($.env.OS === "darwin") {
		await $`ln -sf ${realBinaryPath} ${linkPath}`;
	} else {
		await $`ln -sf ${realBinaryPath} ${linkPath}`;
	}

	return linkPath;
}

async function unlinkBinaryFromUserPath(linkedBinaryName: string) {
	const linkPath = $.path.join($.env.STANDARD_DIRS.LOCAL_BIN, linkedBinaryName);

	const stat = await Deno.stat(linkPath);
	if (stat.isSymlink) {
		if ($.env.OS === "darwin") {
			await $`rm -f ${linkPath}`;
		} else {
			await $`rm -f ${linkPath}`;
		}
	}

	return linkPath;
}

async function linkDesktopFileForApp(app: string) {
	const desktopFile = $.path.join($.env.STANDARD_DIRS.DOT_DOTS_APPS, app, ".desktop");
	const linkPath = $.path.join($.env.STANDARD_DIRS.LOCAL_SHARE_APPS, `${app}.desktop`);

	invariant(await $.exists(desktopFile), `missing required .desktop file at ${desktopFile}`);

	if ($.env.OS === "darwin") {
		await $`ln -sf ${desktopFile} ${linkPath}`;
	} else {
		await $`ln -sf ${desktopFile} ${linkPath}`;
	}
}

async function unlinkDesktopFileForApp(app: string) {
	const linkPath = $.path.join($.env.STANDARD_DIRS.LOCAL_SHARE_APPS, `${app}.desktop`);

	if ($.env.OS === "darwin") {
		await $`rm -f ${linkPath}`;
	} else {
		await $`rm -f ${linkPath}`;
	}
}

type NativefierAppArgs = { appName: string; displayName: string; website: string };
async function createAndLinkNativefierApp(
	{ appName, displayName, website }: NativefierAppArgs,
) {
	$.requireCommand("node", "pam install -a node");
	$.requireCommand("npm", "pam install -a node");

	invariant(typeof appName === "string" && appName.length > 0, "invalid appName");
	invariant(typeof displayName === "string" && displayName.length > 0, "invalid displayName");
	invariant(typeof website === "string" && website.length > 0, "invalid website");
	invariant(website.startsWith("https://"), "invalid website protocol");

	const allAppNames = await getAppNames();
	invariant(allAppNames.has(appName), "unknown app name");

	const [{ path }] = await getInstallerMetas(new Set([appName]));
	const sourceDir = $.path.join(path, constants.appArtifactsDir, constants.sourceDir);
	const iconPath = $.path.join($.env.STANDARD_DIRS.DOT_DOTS_APPS, appName, ".icon.png");
	const desktopPath = $.path.join($.env.STANDARD_DIRS.DOT_DOTS_APPS, appName, ".desktop");

	await $.requireExists(iconPath);
	await $.requireExists(desktopPath);

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
	await $.requireExists(builtAppBin);

	await linkBinaryToUserPath(builtAppBin, appName);
	await linkDesktopFileForApp(appName);
}

async function unlinkNativefierApp(appName: string) {
	const allAppNames = await getAppNames();
	invariant(allAppNames.has(appName), "unknown app name");

	await unlinkDesktopFileForApp(appName);
	await unlinkBinaryFromUserPath(appName);
}

async function flatpakAppInstalled(appName: string) {
	const flatpakApps = await $`flatpak list --app --columns=name`.bytes();

	const { code } = await $.raw`grep -q "^${appName}$"`.stdin(flatpakApps).noThrow();

	return code === 0;
}

async function flatpakAppMissing(appName: string) {
	const installed = await flatpakAppInstalled(appName);

	return !installed;
}

/**
 * Install the specified dmg file
 *
 * @see https://apple.stackexchange.com/a/311511
 */
async function installDmg(dmgPath: string) {
	dmgPath = await $.requireExists(dmgPath);

	invariant(dmgPath.endsWith(".dmg"), `bad dmg file name ${dmgPath}`);
	invariant($.env.OS === "darwin", "installer only available on mac");

	const mountOutput = await $`sudo hdiutil attach ${dmgPath}`.text();
	const volumeLine = await $`grep Volumes`.stdinText(mountOutput).text();
	const volume = (await $`cut -f 3`.stdinText(volumeLine).text() ?? "").trim();
	const mountPoint = (await $`cut -f 1`.stdinText(volumeLine).text() ?? "").trim();

	invariant(typeof volume === "string" && volume.startsWith("/Volumes/"), "invalid volume");
	invariant(
		typeof mountPoint === "string" && mountPoint.startsWith("/dev/disk"),
		"invalid mountPoint",
	);

	// IDEA: handle `.pkg` style installers too (per https://apple.stackexchange.com/a/311511)?

	let dotAppPaths: string[] = [];
	for await (const file of $.fs.expandGlob($.path.join(volume, "*.app"))) {
		dotAppPaths.push(file.path);
	}

	invariant(dotAppPaths.length > 0, "no .app packages were found in dmg, unable to install");
	invariant(dotAppPaths.length === 1, "more than one .app package found in dmg, unable to install");

	const [app] = dotAppPaths;

	await $`sudo cp -rf ${app} /Applications`;

	await $`sudo hdiutil detach ${mountPoint}`;
}

async function brewAppInstalled(appName: string) {
	const { code } = await $`brew list ${appName}`.noThrow().quiet("both");

	return code === 0;
}

async function brewAppMissing(appName: string) {
	const installed = await brewAppInstalled(appName);

	return !installed;
}

export const pamkit = {
	brewAppInstalled,
	brewAppMissing,
	calculateAppsInScope,
	constants,
	createAndLinkNativefierApp,
	flatpakAppInstalled,
	flatpakAppMissing,
	getAppNames,
	getGroups,
	getInstallerMetas,
	installDmg,
	isNewerVersion,
	linkBinaryToUserPath,
	linkDesktopFileForApp,
	mostRelevantVersion,
	unlinkBinaryFromUserPath,
	unlinkDesktopFileForApp,
	unlinkNativefierApp,
	wrapOutdatedCheck,
} as const;
