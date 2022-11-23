import { env } from "./env.ts";
import { invariant, osInvariant } from "./util.ts";

export { stdColors as colors, stdFlags as flags } from "./deps.ts";
export * from "./env.ts";
export * from "./fmt.ts";
export * from "./util.ts";

// sanity-check / safeguards
osInvariant();
invariant(env.USER.trim().length > 0, "missing required env variable $USER");
invariant(env.HOME.trim().length > 0, "missing required env variable $HOME");
