/**
 * You can use https://deno.land/x/udd to bump deps
 *
 * e.g.
 *
 * deno run --allow-read=. --allow-write=. --allow-net https://deno.land/x/udd/main.ts script/lib/deps.ts .web/serve.ts
 */
export { intersect as stdIntersect } from "https://deno.land/std@0.224.0/collections/intersect.ts";
export * as stdFS from "https://deno.land/std@0.224.0/fs/mod.ts";
export * as stdLog from "https://deno.land/std@0.224.0/log/mod.ts";
export type {
	FormatterFunction,
	Logger,
	LogRecord,
} from "https://deno.land/std@0.224.0/log/mod.ts";
export * as stdPath from "https://deno.land/std@0.224.0/path/mod.ts";
export * as stdSemver from "https://deno.land/std@0.224.0/semver/mod.ts";
export * as cliffyAnsi from "https://deno.land/x/cliffy@v1.0.0-rc.4/ansi/mod.ts";
export * as cliffyCmd from "https://deno.land/x/cliffy@v1.0.0-rc.4/command/mod.ts";
export * as cliffyTable from "https://deno.land/x/cliffy@v1.0.0-rc.4/table/mod.ts";
export * as puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts";
export * as dax from "jsr:@david/dax@0.40.0";
export * as stdNodeFS from "node:fs";
export * as stdNodeUtil from "node:util";
export { default as strCase } from "npm:case@1.6.3";
export * as dateFns from "npm:date-fns@3.6.0";
export { default as handlebars } from "npm:handlebars@4.7.8";
// @deno-types="npm:@types/user-agents@1.0.4"
export { default as UserAgent } from "npm:user-agents@2.0.0-alpha.228";
