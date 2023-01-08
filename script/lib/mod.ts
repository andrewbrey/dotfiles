import {
  cliffyAnsi,
  cliffyCmd,
  cliffyTable,
  dateFns,
  dax,
  handlebars,
  puppeteer,
  stdIntersect,
  stdLog,
  stdNodeOS,
  stdNodeUtil,
  stdSemver,
  strCase,
  UserAgent,
} from "./deps.ts";

/** Does nothing */
function noop() {}

/** Enforce that a condition is true, and narrow types based on the assertion */
function invariant(condition: any, message?: string): asserts condition {
  if (condition) return;

  const prefix = "Invariant failed";
  const value: string = message ? `${prefix}: ${message}` : prefix;
  throw new Error(value);
}

/** Simplified re-export of the stdlib node inspect function */
function inspect(what: any, depth: number = Infinity) {
  return stdNodeUtil.inspect(what, { colors: env.ALLOW_COLOR, depth, getters: true });
}

const basic$ = dax.build$();
basic$.setPrintCommand(true);

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
  OS: stdNodeOS.platform() as "darwin" | "linux" | "win32",
  USER: Deno.env.get("USER") ?? "",
  HOME: Deno.env.get("HOME") ?? "",
  STDIN_IS_TTY: Deno.isatty(Deno.stdin.rid),
  ALLOW_COLOR: !Deno.noColor,
  GH_TOKEN: Deno.env.get("GH_TOKEN") ?? Deno.env.get("GITHUB_TOKEN"),
  get STANDARD_DIRS() {
    return {
      CODE: basic$.path.join(env.HOME, "code"),
      NPM_INSTALL: basic$.path.join(env.HOME, ".npm-globals"),
      PNPM_INSTALL: basic$.path.join(env.HOME, ".pnpm-globals"),
      DOT_DOTS: basic$.path.join(env.HOME, ".dots"),
      DOT_DOTS_APPS: basic$.path.join(env.HOME, ".dots", "apps"),
      DOT_DOTS_SETTINGS: basic$.path.join(env.HOME, ".dots", "settings"),
      LOCAL_BIN: basic$.path.join(env.HOME, ".local", "bin"),
      LOCAL_SHARE_APPS: basic$.path.join(env.HOME, ".local", "share", "applications"),
    };
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
  const chezmoiYaml = basic$.path.join(env.HOME, ".config", "chezmoi", "chezmoi.yaml");

  invariant(await basic$.exists(chezmoiYaml), "unable to read chezmoi data before it is created");

  return await $`chezmoi data`.printCommand(false).json() as ChezmoiData;
}

/** Enforce that only linux and mac are supported */
function osInvariant() {
  invariant(
    ["linux", "darwin"].includes(env.OS),
    `unknown or unsupported operating system [${env.OS}]`,
  );
}

/**
 * Gets the absolute path of the directory containing the passed `import.meta.url`
 *
 * If `basenameOnly` is set to `true`, only returns the final segment of the path
 */
function $dirname(importMetaUrl: string, basenameOnly = false) {
  const fullDir = basic$.path.dirname(basic$.path.fromFileUrl(importMetaUrl));

  return basenameOnly ? basic$.path.basename(fullDir) : fullDir;
}

/** Gets the absolute path of the directory up `count` from the passed `import.meta.url` */
function $dotdot(importMetaUrl: string, count = 1) {
  invariant(count > 0, "dotdot count must be at least 1");

  const dots = new Array(count).fill("").map((i) => "..");
  return basic$.path.resolve($dirname(importMetaUrl), ...dots);
}

/** Gets if the provided path does not exist asynchronously */
async function missing(path: string) {
  return basic$.exists(path).then((exists) => !exists);
}

/** Gets if the provided path does not exist synchronously. */
function missingSync(path: string) {
  return !basic$.existsSync(path);
}

/** Determine if the provided command does not exist */
async function commandMissing(commandName: string) {
  return basic$.commandExists(commandName).then((exists) => !exists);
}

/** Determine if the provided command does not exist synchronously */
function commandMissingSync(commandName: string) {
  return !basic$.commandExistsSync(commandName);
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

const $helpers = {
  $dirname,
  $dotdot,
  browser: { puppeteer, UserAgent },
  cliffy: { cmd: cliffyCmd, table: cliffyTable },
  collections: { intersect: stdIntersect },
  colors: cliffyAnsi.colors,
  commandMissing,
  commandMissingSync,
  dateFns,
  env,
  envExists,
  envMissing,
  getChezmoiData,
  handlebars,
  inspect,
  invariant,
  logging: stdLog,
  missing,
  missingSync,
  noop,
  osInvariant,
  semver: stdSemver,
  strCase,
} as const;

type Extended$Type = dax.$Type & typeof $helpers;
export const $ = Object.assign(basic$, $helpers) satisfies Extended$Type;

// sanity-check / safeguards
osInvariant();
invariant(env.USER.trim().length > 0, "missing required env variable $USER");
invariant(env.HOME.trim().length > 0, "missing required env variable $HOME");
