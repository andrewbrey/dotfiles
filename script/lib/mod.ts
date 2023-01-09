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
  stdNodeFS,
  stdNodeOS,
  stdNodeUtil,
  stdSemver,
  strCase,
  UserAgent,
} from "./deps.ts";

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

/** Enforce that the specified command is available */
async function requireCommand(commandName: string, installCommand?: string) {
  let message = `${cliffyAnsi.colors.blue(commandName)} is required`;

  if (installCommand) {
    message = `${message}, install it with ${cliffyAnsi.colors.magenta(installCommand)}`;
  }

  invariant(await basic$.commandExists(commandName), message);
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

/** Enforce that the specified environment variable is defined */
function requireEnv(envName: string) {
  invariant(envExists(envName), `missing required env variable $${envName}`);
}

type GHReleaseInfo = {
  name: string;
  tag_name: string;
  assets: { name: string; browser_download_url: string }[];
  body: string;
};

/** Fetch the latest release information for a github repo */
async function ghReleaseInfo(user: string, repo: string) {
  // TODO: make signature a single parameter, e.g. `ghReleaseLatestInfo(project: string /* "andrewbrey/dotfiles" */)`
  const request = $.request(`https://api.github.com/repos/${user}/${repo}/releases/latest`);

  if (env.GH_TOKEN) request.header({ Authorization: `token ${env.GH_TOKEN}` });

  return await request.json<GHReleaseInfo>();
}

/** Download a file to the specified path */
async function streamDownload(url: string, dest: string) {
  const isGitHub = ["github.com", "api.github.com", "objects.githubusercontent.com"]
    .includes(new URL(url).hostname);

  const request = $.request(url);
  if (isGitHub && env.GH_TOKEN) request.header({ Authorization: `token ${env.GH_TOKEN}` });

  const toPath = $.path.isAbsolute(dest) ? dest : $.path.resolve($.path.join(Deno.cwd(), dest));

  await $.fs.ensureDir($.path.dirname(toPath));
  await request.showProgress().pipeToPath(toPath);

  $.logStep("done:", `download saved to ${toPath}`);
}

type UAOpts = NonNullable<ConstructorParameters<typeof UserAgent>[0]>;
type RunInBrowserFn = (page: puppeteer.Page, browser: puppeteer.Browser) => Promise<void>;

/** Run the specified function in a real browser context */
async function runInBrowser(fn: RunInBrowserFn, opts?: { ua: UAOpts }) {
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

      await $`deno run -A --unstable https://deno.land/x/puppeteer@${puppeteerVersion}/install.ts`
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
  getChezmoiData,
  ghReleaseInfo,
  handlebars,
  inspect,
  logging: stdLog,
  missing,
  missingSync,
  nodeFS: stdNodeFS,
  noop,
  requireCommand,
  requireEnv,
  runInBrowser,
  semver: stdSemver,
  streamDownload,
  strings: { case: strCase },
} as const;

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
