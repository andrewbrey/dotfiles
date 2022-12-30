/**
 * You can use https://deno.land/x/udd to bump deps
 *
 * e.g.
 *
 * deno install -rf --allow-read=. --allow-write=. --allow-net https://deno.land/x/udd/main.ts
 * udd script/lib/deps.ts
 */
export * as stdFlags from "https://deno.land/std@0.170.0/flags/mod.ts";
export * as stdColors from "https://deno.land/std@0.170.0/fmt/colors.ts";
export * as stdNodeFS from "https://deno.land/std@0.170.0/node/fs.ts";
export * as stdNodeOS from "https://deno.land/std@0.170.0/node/os.ts";
export * as stdNodeUtil from "https://deno.land/std@0.170.0/node/util.ts";
export * as stdPath from "https://deno.land/std@0.170.0/path/mod.ts";
export * as cliffyAnsi from "https://deno.land/x/cliffy@v0.25.6/ansi/mod.ts";
export * as cliffyCmd from "https://deno.land/x/cliffy@v0.25.6/command/mod.ts";
export * as cliffyFlag from "https://deno.land/x/cliffy@v0.25.6/flags/mod.ts";
export * as cliffyKey from "https://deno.land/x/cliffy@v0.25.6/keycode/mod.ts";
export * as cliffyPress from "https://deno.land/x/cliffy@v0.25.6/keypress/mod.ts";
export * as cliffyPrompts from "https://deno.land/x/cliffy@v0.25.6/prompt/mod.ts";
export * as cliffyTable from "https://deno.land/x/cliffy@v0.25.6/table/mod.ts";
export * as dax from "https://deno.land/x/dax@0.19.0/mod.ts";
export * as pptr from "https://deno.land/x/puppeteer@16.2.0/mod.ts";
export { default as strCase } from "npm:case@1.6.3";
export * as dateFns from "npm:date-fns@2.29.3";
export { default as handlebars } from "npm:handlebars@4.7.7";
// @deno-types="npm:@types/semver@7.3.13"
export { default as semver } from "npm:semver@7.3.8";
export { default as stripAnsi } from "npm:strip-ansi@7.0.1";
// @deno-types="npm:@types/user-agents@1.0.2"
export { default as UserAgent } from "npm:user-agents@1.0.1241";
// workarounds for cjs/esm type goofuhmup. @see https://youtu.be/eRs_MGdCXGU?t=1995
import dedentImport from "npm:string-dedent@3.0.1";
export const dedent = (dedentImport as any as typeof dedentImport["default"]);
