import { stdNodeUtil, stdPath } from "./deps.ts";
import { env } from "./env.ts";

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
