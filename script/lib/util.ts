import { stdNodeUtil, stdPath } from "./deps.ts";
import { $, env } from "./env.ts";

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

export function $dirname(importMetaUrl: string) {
  return stdPath.dirname(stdPath.fromFileUrl(importMetaUrl));
}
