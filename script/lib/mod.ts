import { dax, stdColors, stdNodeOS, stdNodeUtil, stdPath } from "./deps.ts";

export {
  cliffyCmd as command,
  cliffyPrompts as prompts,
  cliffyTable as table,
  dateFns,
  handlebars,
  pptr,
  stdColors as colors,
  stdFlags as flags,
  stdIntersect as intersect,
  stdLog as log,
  stdNodeFS as nodeFS,
  stdNodeOS as nodeOS,
  stdSemver as semver,
  strCase,
  UserAgent,
} from "./deps.ts";

const basic$ = dax.build$();
const $helpers = {
  /** Gets if the provided path does not exist asynchronously */
  async missing(path: string) {
    return basic$.exists(path).then((exists) => !exists);
  },
  /** Gets if the provided path does not exist synchronously. */
  missingSync(path: string) {
    return !basic$.existsSync(path);
  },
  /** Determine if the provided command does not exist */
  async commandMissing(commandName: string) {
    return basic$.commandExists(commandName).then((exists) => !exists);
  },
  /** Determine if the provided command does not exist synchronously */
  commandMissingSync(commandName: string) {
    return !basic$.commandExistsSync(commandName);
  },
  /** Check if the provided environment variable is defined and has a non-blank value */
  envExists(envName: string) {
    const value = Deno.env.get(envName)?.trim() ?? "";
    return value.length > 0;
  },
  /** Check if the provided environment variable is not defined or is defined but has a blank value */
  envMissing(envName: string) {
    const value = Deno.env.get(envName)?.trim() ?? "";
    return value.length === 0;
  },
} as const;

type Extended$Type = dax.$Type & typeof $helpers;
export const $ = Object.assign(basic$, $helpers) satisfies Extended$Type;
$.setPrintCommand(true);

export const env = {
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
      CODE: $.path.join(env.HOME, "code"),
      NPM_INSTALL: $.path.join(env.HOME, ".npm-globals"),
      PNPM_INSTALL: $.path.join(env.HOME, ".pnpm-globals"),
      DOT_DOTS: $.path.join(env.HOME, ".dots"),
      DOT_DOTS_APPS: $.path.join(env.HOME, ".dots", "apps"),
      DOT_DOTS_SETTINGS: $.path.join(env.HOME, ".dots", "settings"),
      LOCAL_BIN: $.path.join(env.HOME, ".local", "bin"),
      LOCAL_SHARE_APPS: $.path.join(env.HOME, ".local", "share", "applications"),
    };
  },
};

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

export async function getChezmoiData() {
  const dataReady = await $.exists($.path.join(env.HOME, ".config", "chezmoi", "chezmoi.yaml"));

  if (!dataReady) throw new Error("unable to read chezmoi data before it is created");

  return await $`chezmoi data`.printCommand(false).json() as ChezmoiData;
}

export function noop() {}

export function invariant(condition: any, message?: string): asserts condition {
  if (condition) return;

  const prefix = "Invariant failed";
  const value: string = message ? `${prefix}: ${message}` : prefix;
  throw new Error(value);
}

export function inspect(what: any, depth: number = Infinity) {
  return stdNodeUtil.inspect(what, { colors: env.ALLOW_COLOR, depth, getters: true });
}

export function osInvariant() {
  invariant(
    ["linux", "darwin"].includes(env.OS),
    `unknown or unsupported operating system [${env.OS}]`,
  );
}

export function $dirname(importMetaUrl: string, basenameOnly = false) {
  const fullDir = stdPath.dirname(stdPath.fromFileUrl(importMetaUrl));

  return basenameOnly ? stdPath.basename(fullDir) : fullDir;
}

export function $dotdot(importMetaUrl: string, count = 1) {
  invariant(count > 0, "dotdot count must be at least 1");

  const dots = new Array(count).fill("").map((i) => "..");
  return stdPath.resolve($dirname(importMetaUrl), ...dots);
}

export function blackOnYellow(what: string) {
  return stdColors.black(stdColors.bgYellow(what));
}

// sanity-check / safeguards
osInvariant();
invariant(env.USER.trim().length > 0, "missing required env variable $USER");
invariant(env.HOME.trim().length > 0, "missing required env variable $HOME");
