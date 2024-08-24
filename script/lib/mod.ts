import type { Logger } from "./deps.ts";
import {
	cliffyAnsi,
	cliffyCmd,
	cliffyTable,
	dateFns,
	dax,
	handlebars,
	puppeteer,
	stdFS,
	stdIntersect,
	stdLog,
	stdNodeFS,
	stdNodeUtil,
	stdPath,
	stdSemver,
	strCase,
} from "./deps.ts";
import { type UAOpts } from "./user-agents.d.ts";

export type { FormatterFunction, Logger, LogRecord } from "./deps.ts";

/** Does nothing */
function noop() {}

/**
 * Enforce that a condition is true, and narrow types based on the assertion
 *
 * NOTE: not part of `$` because of https://github.com/microsoft/TypeScript/issues/36931
 */
export function invariant(condition: any, message?: string): asserts condition {
	if (condition) return;

	const prefix = cliffyAnsi.colors.red("Invariant failed");
	const value: string = message ? `${prefix}: ${message}` : prefix;
	throw new Error(value);
}

/** Simplified re-export of the stdlib node inspect function */
function inspect(what: any, depth: number = Infinity) {
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

	const dots = new Array(count).fill("").map((i) => "..");
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

/**
 * Gets if the provided path exists asynchronously.
 *
 * Although there is a potential for a race condition between the
 * time this check is made and the time some code is used, it may
 * not be a big deal to use this in some scenarios and simplify
 * the code a lot.
 */
async function exists(path: string) {
	return basic$.path(path).exists();
}

/** Gets if the provided path exists synchronously. */
function existsSync(path: string) {
	return basic$.path(path).existsSync();
}

/** Gets if the provided path does not exist asynchronously */
async function missing(path: string) {
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

	const message = `nothing exists at ${cliffyAnsi.colors.blue(path)} but it is required`;

	invariant(await exists(absolutePath), message);

	return absolutePath;
}

/** Determine if the provided command does not exist */
async function commandMissing(commandName: string) {
	return basic$.commandExists(commandName).then((exists) => !exists);
}

/** Determine if the provided command does not exist synchronously */
function commandMissingSync(commandName: string) {
	return !basic$.commandExistsSync(commandName);
}

/** Enforce that the specified command is available, returning value of `which cmd` if the `cmd` is available */
async function requireCommand(commandName: string, installCommand?: string) {
	let message = `${cliffyAnsi.colors.blue(commandName)} is required`;

	if (installCommand) {
		message = `${message}, install it with ${cliffyAnsi.colors.magenta(installCommand)}`;
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
	let message = `missing required env ${cliffyAnsi.colors.blue(envName)}`;

	if (setCommand) {
		message = `${message} (try ${cliffyAnsi.colors.magenta(setCommand)})`;
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

type RunInBrowserFn = (page: puppeteer.Page, browser: puppeteer.Browser) => Promise<void>;

/** Run the specified function in a real browser context */
async function runInBrowser(fn: RunInBrowserFn, opts?: { ua: unknown }) {
	const { default: UserAgent } = await import("user-agents");

	let browser: puppeteer.Browser | undefined;
	let page: puppeteer.Page | undefined;

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
	const launchArgs: Parameters<typeof puppeteer.default.launch>[0] = {
		headless: true,
		defaultViewport: { width: 1920, height: 1080 },
		args: ["--no-sandbox", "--disable-dev-shm-usage"],
	};

	try {
		browser = await puppeteer.default.launch(launchArgs);
		page = await browser.newPage();
		await page.setUserAgent(ua.toString());

		await fn(page, browser);
	} catch (error) {
		if (error instanceof Error && error.message.includes("Could not find browser revision")) {
			const puppeteerVersion = error.message.match(/Run "[^@]+@([^/]+)[^"]+" to download/i)?.at(1);

			invariant(
				typeof puppeteerVersion === "string" && puppeteerVersion.length > 0,
				"no browser download instructions provided",
			);

			if (env.OS === "linux") {
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
			}

			await $`deno run -A https://deno.land/x/puppeteer@${puppeteerVersion}/install.ts`
				.env({ PUPPETEER_PRODUCT: "chrome" });

			try {
				browser ??= await puppeteer.default.launch(launchArgs);
				page ??= await browser.newPage();
				await page.setUserAgent(ua.toString());

				await fn(page, browser);
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

type RunOnOSFn<T> = () => Promise<T>;

/** Run a function only when on the specified operating system */
async function onOS<T>(os: typeof env.OS, fn: RunOnOSFn<T>) {
	if (env.OS === os) return fn();
}

const $helpers = {
	$dirname,
	$dotdot,
	cliffy: { cmd: cliffyCmd, table: cliffyTable },
	collections: { intersect: stdIntersect },
	colors: cliffyAnsi.colors,
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
	inspect,
	logging: stdLog,
	missing,
	missingSync,
	nodeFS: stdNodeFS,
	noop,
	ntfyAlert,
	onLinux: async <T>(fn: RunOnOSFn<T>) => onOS("linux", fn),
	onMac: async <T>(fn: RunOnOSFn<T>) => onOS("darwin", fn),
	path: Object.assign(basic$.path, stdPath) as typeof basic$.path & typeof stdPath,
	requireCommand,
	requireEnv,
	requireExists,
	runInBrowser,
	semver: stdSemver,
	streamDownload,
	strings: { case: strCase, asBytes },
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
