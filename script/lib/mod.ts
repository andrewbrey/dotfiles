import * as cliffyColors from "@cliffy/ansi/colors";
import * as cliffyCmd from "@cliffy/command";
import * as cliffyTable from "@cliffy/table";
import * as dax from "@david/dax";
import * as dateFns from "@npm/date-fns";
import { default as handlebars } from "@npm/handlebars";
import { Browser, BrowserContext, chromium, Page } from "@npm/playwright";
import { intersect as stdIntersect } from "@std/collections/intersect";
import * as stdFS from "@std/fs";
import { parse as jsoncParse } from "@std/jsonc";
import type { FormatterFunction, Logger, LogRecord } from "@std/log";
import * as stdLog from "@std/log";
import * as stdNodeFS from "@std/node-fs";
import * as stdNodeUtil from "@std/node-util";
import * as stdPath from "@std/path";
import * as stdSemver from "@std/semver";
import * as stdText from "@std/text";
import { type UAOpts } from "./user-agents.d.ts";

export type { FormatterFunction, Logger, LogRecord };

/** Does nothing */
function noop() {}

/**
 * Enforce that a condition is true, and narrow types based on the assertion
 *
 * NOTE: not part of `$` because of https://github.com/microsoft/TypeScript/issues/36931
 */
export function invariant(condition: unknown, message?: string): asserts condition {
	if (condition) return;

	const prefix = cliffyColors.colors.red("Invariant failed");
	const value: string = message ? `${prefix}: ${message}` : prefix;
	throw new Error(value);
}

/** Simplified re-export of the stdlib node inspect function */
function inspect(what: unknown, depth: number = Infinity) {
	return stdNodeUtil.inspect(what, { colors: env.ALLOW_COLOR, depth, getters: true });
}

/** Convert text to bytes (Uint8Array) */
function asBytes(text: string) {
	const encoder = new TextEncoder();
	return encoder.encode(text);
}

/** Convert bytes (Uint8Array) to text */
function fromBytes(buffer: Uint8Array) {
	const decoder = new TextDecoder();
	return decoder.decode(buffer);
}

const basic$ = dax.build$({ requestBuilder: new dax.RequestBuilder().timeout(60_000) });
basic$.setPrintCommand(true);

/**
 * Gets the absolute path of the directory containing the passed `import.meta.url`
 *
 * If `basenameOnly` is set to `true`, only returns the final segment of the path
 */
function $dirname(importMetaUrl: string, basenameOnly = false) {
	const fullDir = stdPath.dirname(stdPath.fromFileUrl(importMetaUrl));

	return basenameOnly ? stdPath.basename(fullDir) : fullDir;
}

/** Gets the absolute path of the directory up `count` from the passed `import.meta.url` */
function $dotdot(importMetaUrl: string, count = 1) {
	invariant(count > 0, "dotdot count must be at least 1");

	const dots = new Array(count).fill("").map((_i) => "..");
	return stdPath.resolve($dirname(importMetaUrl), ...dots);
}

/** Collection of environment specific values detailing the context for execution */
const env = {
	CODESPACES: Deno.env.get("CODESPACES") === "true",
	REMOTE_CONTAINERS: Deno.env.get("REMOTE_CONTAINERS") === "true",
	GITPOD: Boolean(Deno.env.get("GITPOD_WORKSPACE_ID")),
	get IN_CLOUD_IDE() {
		return env.CODESPACES || env.GITPOD;
	},
	get IN_CONTAINER() {
		return env.CODESPACES || env.GITPOD || env.REMOTE_CONTAINERS;
	},
	OS: Deno.build.os,
	USER: Deno.env.get("USER") ?? "",
	HOME: Deno.env.get("HOME") ?? "",
	STDIN_IS_TTY: Deno.stdin.isTerminal(),
	ALLOW_COLOR: !Deno.noColor,
	GH_TOKEN: Deno.env.get("GH_TOKEN") ?? Deno.env.get("GITHUB_TOKEN"),
	get STANDARD_DIRS() {
		return {
			CODE: stdPath.join(env.HOME, "code"),
			NPM_INSTALL: stdPath.join(env.HOME, ".npm-globals"),
			PNPM_INSTALL: stdPath.join(env.HOME, ".pnpm-globals"),
			DOT_DOTS: stdPath.join(env.HOME, ".dots"),
			DOT_DOTS_APPS: stdPath.join(env.HOME, ".dots", "apps"),
			DOT_DOTS_SETTINGS: stdPath.join(env.HOME, ".dots", "settings"),
			LOCAL_BIN: stdPath.join(env.HOME, ".local", "bin"),
			LOCAL_SHARE_APPS: stdPath.join(env.HOME, ".local", "share", "applications"),
			DOTFILES: stdPath.join(env.HOME, ".local", "share", "chezmoi"),
		};
	},
	get DOTS_CLONE_IS_SSH() {
		const git = basic$.whichSync("git");

		if (!git) return false;

		const command = new Deno.Command(git, { args: ["remote", "get-url", "origin"] });
		const { code, stdout } = command.outputSync();

		if (code !== 0) return false;

		return fromBytes(stdout).startsWith("git@");
	},
};

type ChezmoiData = {
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
	standard_dirs: {
		code: string;
		npm_install: string;
		pnpm_install: string;
		dot_dots: string;
		dot_dots_apps: string;
		local_bin: string;
		local_share_apps: string;
	};
};

/** Returns the JSON data output from running `chezmoi data` */
async function getChezmoiData() {
	const chezmoiYaml = stdPath.join(env.HOME, ".config", "chezmoi", "chezmoi.yaml");

	invariant(await exists(chezmoiYaml), "unable to read chezmoi data before it is created");

	return await $`chezmoi data`.printCommand(false).json() as ChezmoiData;
}

/** Returns the entry for the specified dependency in the `deno.jsonc` import map, if present */
export function importMapDepVersion(depName: string): string | undefined {
	const denoJsonPath = stdPath.join(env.STANDARD_DIRS.DOTFILES, "deno.jsonc");

	invariant(existsSync(denoJsonPath), "unable to read deno configuration file");

	// deno-lint-ignore no-explicit-any
	const denoJson = jsoncParse(Deno.readTextFileSync(denoJsonPath)) as any;
	const dep = denoJson?.imports?.[depName];

	if (typeof dep === "undefined") return undefined;

	invariant(typeof dep === "string", `dependency ${depName} had unexpected format`);

	if (dep.startsWith("node:")) return undefined;

	return dep.split("@")?.at(-1);
}

/**
 * Gets if the provided path exists asynchronously.
 *
 * Although there is a potential for a race condition between the
 * time this check is made and the time some code is used, it may
 * not be a big deal to use this in some scenarios and simplify
 * the code a lot.
 */
function exists(path: string) {
	return basic$.path(path).exists();
}

/** Gets if the provided path exists synchronously. */
function existsSync(path: string) {
	return basic$.path(path).existsSync();
}

/** Gets if the provided path does not exist asynchronously */
function missing(path: string) {
	return exists(path).then((exists) => !exists);
}

/** Gets if the provided path does not exist synchronously. */
function missingSync(path: string) {
	return !existsSync(path);
}

/**
 * Enforce that the specified file or path exists, returning the absolute path
 * if it exists; relative paths are resolved against `Deno.cwd()`
 */
async function requireExists(path: string) {
	const absolutePath = stdPath.isAbsolute(path)
		? path
		: stdPath.resolve(stdPath.join(Deno.cwd(), path));

	const message = `nothing exists at ${cliffyColors.colors.blue(path)} but it is required`;

	invariant(await exists(absolutePath), message);

	return absolutePath;
}

/** Determine if the provided command does not exist */
function commandMissing(commandName: string) {
	return basic$.commandExists(commandName).then((exists) => !exists);
}

/** Determine if the provided command does not exist synchronously */
function commandMissingSync(commandName: string) {
	return !basic$.commandExistsSync(commandName);
}

/** Enforce that the specified command is available, returning value of `which cmd` if the `cmd` is available */
async function requireCommand(commandName: string, installCommand?: string) {
	let message = `${cliffyColors.colors.blue(commandName)} is required`;

	if (installCommand) {
		message = `${message}, install it with ${cliffyColors.colors.magenta(installCommand)}`;
	}

	invariant(await basic$.commandExists(commandName), message);

	return await basic$.which(commandName) as string; // we know it exists, coerce type
}

/** Check if the provided environment variable is defined and has a non-blank value */
function envExists(envName: string) {
	const value = Deno.env.get(envName)?.trim() ?? "";
	return value.length > 0;
}

/** Check if the provided environment variable is not defined or is defined but has a blank value */
function envMissing(envName: string) {
	const value = Deno.env.get(envName)?.trim() ?? "";
	return value.length === 0;
}

/** Enforce that the specified environment variable is defined, returning the env value if defined */
function requireEnv(envName: string, setCommand?: string) {
	let message = `missing required env ${cliffyColors.colors.blue(envName)}`;

	if (setCommand) {
		message = `${message} (try ${cliffyColors.colors.magenta(setCommand)})`;
	}

	invariant(envExists(envName), message);

	return Deno.env.get(envName)?.trim() as string; // we know it exists, coerce type
}

/** Attempt to alert via ntfy, but don't fail if not possible. */
async function ntfyAlert(alert: string, logger?: Logger) {
	try {
		const topic = requireEnv("NTFY_TOPIC");
		invariant(typeof alert === "string" && alert.length > 0, "missing required alert for ntfy");

		await basic$.request(`https://ntfy.sh/${topic}`).method("POST")
			.header({ "Title": "dots alert" }).body(alert).timeout(2_000);
	} catch (error) {
		if (logger) {
			logger.error(`ntfyAlert failed for ${alert}`);
			logger.error(error);
		}
	}
}

type GHReleaseInfo = {
	name: string;
	tag_name: string;
	assets: { name: string; browser_download_url: string }[];
	body: string;
};

/** Fetch the latest release information for a github repo */
async function ghReleaseInfo(user: string, repo: string) {
	const request = basic$.request(`https://api.github.com/repos/${user}/${repo}/releases/latest`);

	if (env.GH_TOKEN) request.header({ Authorization: `token ${env.GH_TOKEN}` });

	return await request.json<GHReleaseInfo>();
}

/** Download a file to the specified path */
async function streamDownload(url: string, dest: string) {
	const isGitHub = ["github.com", "api.github.com", "objects.githubusercontent.com"]
		.includes(new URL(url).hostname);

	const request = basic$.request(url);
	if (isGitHub && env.GH_TOKEN) request.header({ Authorization: `token ${env.GH_TOKEN}` });

	const toPath = stdPath.isAbsolute(dest) ? dest : stdPath.resolve(stdPath.join(Deno.cwd(), dest));

	await stdFS.ensureDir(stdPath.dirname(toPath));
	await request.showProgress().pipeToPath(toPath);

	basic$.logStep("done:", `download saved to ${toPath}`);
}

type RunInBrowserFn = (page: Page, browser: Browser) => Promise<void>;

/** Run the specified function in a real browser context */
async function runInBrowser(fn: RunInBrowserFn, opts?: { ua: unknown }) {
	const { default: UserAgent } = await import("@npm/user-agents");

	let browser: Browser | undefined;
	let context: BrowserContext | undefined;
	let page: Page | undefined;

	const defaultUAOpts = {
		platform: env.OS === "darwin" ? "MacIntel" : "Linux x86_64",
		vendor: "Google Inc.",
		deviceCategory: "desktop",
	} satisfies UAOpts;

	const uaOpts = Object.assign(
		defaultUAOpts,
		Array.isArray(opts?.ua) ? opts?.ua.at(0) : opts?.ua,
	);
	const ua = new UserAgent(uaOpts);
	const launchArgs: Parameters<typeof chromium.launch>[0] = {
		headless: true,
		args: ["--no-sandbox", "--disable-dev-shm-usage"],
	};

	try {
		browser = await chromium.launch(launchArgs);
		context = await browser.newContext({
			viewport: { width: 1920, height: 1080 },
			userAgent: ua.toString(),
		});
		page = await browser.newPage();

		await fn(page, browser);
	} catch (error) {
		if (error instanceof Error && error.message.includes("Executable doesn't exist at")) {
			const version = $.importMapDepVersion("@npm/playwright");

			invariant(typeof version === "string" && version.length > 0, "unknown playwright version");

			$.onLinux(async () => {
				await $`npx playwright@${version} install --with-deps`;
			});

			$.onMac(async () => {
				await $`npx playwright@${version} install`;
			});

			try {
				browser = await chromium.launch(launchArgs);
				context = await browser.newContext({
					viewport: { width: 1920, height: 1080 },
					userAgent: ua.toString(),
				});
				page = await browser.newPage();

				await fn(page, browser);
			} catch (retryError) {
				throw retryError;
			} finally {
				await page?.close();
				await context?.close();
				await browser?.close();
			}
		} else {
			throw error;
		}
	} finally {
		await page?.close();
		await context?.close();
		await browser?.close();
	}
}

type RunOnOSFn<T> = () => Promise<T>;

/** Run a function only when on the specified operating system */
function onOS<T>(os: typeof env.OS, fn: RunOnOSFn<T>) {
	if (env.OS === os) return fn();
}

const $helpers = {
	$dirname,
	$dotdot,
	cliffy: { cmd: cliffyCmd, table: cliffyTable },
	collections: { intersect: stdIntersect },
	colors: cliffyColors.colors,
	commandMissing,
	commandMissingSync,
	dateFns,
	env,
	envExists,
	envMissing,
	exists,
	existsSync,
	fs: stdFS,
	getChezmoiData,
	ghReleaseInfo,
	handlebars,
	importMapDepVersion,
	inspect,
	logging: stdLog,
	missing,
	missingSync,
	nodeFS: stdNodeFS,
	noop,
	ntfyAlert,
	onLinux: <T>(fn: RunOnOSFn<T>) => onOS("linux", fn),
	onMac: <T>(fn: RunOnOSFn<T>) => onOS("darwin", fn),
	path: Object.assign(basic$.path, stdPath) as typeof basic$.path & typeof stdPath,
	requireCommand,
	requireEnv,
	requireExists,
	runInBrowser,
	semver: stdSemver,
	streamDownload,
	strings: {
		case: {
			camel: stdText.toCamelCase,
			kebab: stdText.toKebabCase,
			pascal: stdText.toPascalCase,
			snake: stdText.toSnakeCase,
		},
		asBytes,
	},
} as const;

// TODO: for now, manually extend $Type with custom helpers using Object.assign
//       because the dax.build$({ extras: .... }) API does not support anything
//       but functions as of now; revisit if dax supports more things later.
type Extended$Type = dax.$Type & typeof $helpers;
export const $ = Object.assign(basic$, $helpers) satisfies Extended$Type;

// =====
// safeguards
// =====
requireEnv("USER");
requireEnv("HOME");
invariant(
	["linux", "darwin"].includes(env.OS),
	`unknown or unsupported operating system [${env.OS}]`,
);
