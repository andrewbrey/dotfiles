/**
 * You can use https://deno.land/x/udd to bump deps
 *
 * e.g.
 *
 * deno run --allow-read=. --allow-write=. --allow-net https://deno.land/x/udd/main.ts script/lib/deps.ts .web/serve.ts
 */
export * as cliffyAnsi from "https://deno.land/x/cliffy@v1.0.0-rc.4/ansi/mod.ts";
export * as cliffyCmd from "https://deno.land/x/cliffy@v1.0.0-rc.4/command/mod.ts";
export * as cliffyTable from "https://deno.land/x/cliffy@v1.0.0-rc.4/table/mod.ts";
export * as puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts";
export * as dax from "jsr:@david/dax@0.40.0";
export { intersect as stdIntersect } from "jsr:@std/collections@1.0.5/intersect";
export * as stdFS from "jsr:@std/fs@1.0.1";
export * as stdLog from "jsr:@std/log@0.224.5";
export type { FormatterFunction, Logger, LogRecord } from "jsr:@std/log@0.224.5";
export * as stdPath from "jsr:@std/path@1.0.2";
export * as stdSemver from "jsr:@std/semver@1.0.1";
export * as stdNodeFS from "node:fs";
export * as stdNodeUtil from "node:util";
export { default as strCase } from "npm:case@1.6.3"; // TODO: use @std/text
export * as dateFns from "npm:date-fns@3.6.0";
export { default as handlebars } from "npm:handlebars@4.7.8";
