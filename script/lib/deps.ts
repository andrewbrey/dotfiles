/**
 * You can use https://deno.land/x/udd to bump deps
 *
 * e.g.
 *
 * deno run --allow-read=. --allow-write=. --allow-net https://deno.land/x/udd/main.ts script/lib/deps.ts .web/serve.ts
 */
export * as cliffyAnsi from "https://deno.land/x/cliffy@v1.0.0-rc.3/ansi/mod.ts";
export * as cliffyCmd from "https://deno.land/x/cliffy@v1.0.0-rc.3/command/mod.ts";
export * as cliffyTable from "https://deno.land/x/cliffy@v1.0.0-rc.3/table/mod.ts";
export * as puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts";
export * as dax from "jsr:@david/dax@0.39.2";
export { intersect as stdIntersect } from "jsr:@std/collections@0.219.1/intersect";
export * as stdFS from "jsr:@std/fs@0.219.1";
export * as stdLog from "jsr:@std/log@0.219.1";
export type { FormatterFunction, LogRecord, Logger } from "jsr:@std/log@0.219.1";
export * as stdPath from "jsr:@std/path@0.219.1";
export * as stdSemver from "jsr:@std/semver@0.219.1";
export * as stdNodeFS from "node:fs";
export * as stdNodeUtil from "node:util";
export { default as strCase } from "npm:case@1.6.3";
export * as dateFns from "npm:date-fns@3.4.0";
export { default as handlebars } from "npm:handlebars@4.7.8";
// @deno-types="npm:@types/user-agents@1.0.4"
export { default as UserAgent } from "npm:user-agents@2.0.0-alpha.140";
