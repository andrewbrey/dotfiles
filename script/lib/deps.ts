/**
 * You can use https://deno.land/x/udd to bump deps
 *
 * e.g.
 *
 * deno run --allow-read=. --allow-write=. --allow-net https://deno.land/x/udd/main.ts script/lib/deps.ts .web/serve.ts
 */
export { intersect as stdIntersect } from "https://deno.land/std@0.176.0/collections/intersect.ts";
export * as stdLog from "https://deno.land/std@0.176.0/log/mod.ts";
export type {
  FormatterFunction,
  Logger,
  LogRecord,
} from "https://deno.land/std@0.176.0/log/mod.ts";
export * as stdNodeFS from "https://deno.land/std@0.176.0/node/fs.ts";
export * as stdNodeOS from "https://deno.land/std@0.176.0/node/os.ts";
export * as stdNodeUtil from "https://deno.land/std@0.176.0/node/util.ts";
export * as stdSemver from "https://deno.land/std@0.176.0/semver/mod.ts";
export * as cliffyAnsi from "https://deno.land/x/cliffy@v0.25.7/ansi/mod.ts";
export * as cliffyCmd from "https://deno.land/x/cliffy@v0.25.7/command/mod.ts";
export * as cliffyTable from "https://deno.land/x/cliffy@v0.25.7/table/mod.ts";
export * as dax from "https://deno.land/x/dax@0.24.1/mod.ts";
export * as puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts";
export { default as strCase } from "npm:case@1.6.3";
export * as dateFns from "npm:date-fns@2.29.3";
export { default as handlebars } from "npm:handlebars@4.7.7";
// @deno-types="npm:@types/user-agents@1.0.2"
export { default as UserAgent } from "npm:user-agents@1.0.1274";
