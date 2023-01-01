import { env } from "./env.ts";
import { invariant, osInvariant } from "./util.ts";

export {
  cliffyCmd as command,
  cliffyPrompts as prompts,
  cliffyTable as table,
  dateFns,
  dedent,
  handlebars,
  pptr,
  semver,
  stdColors as colors,
  stdFlags as flags,
  stdLog as log,
  stdNodeFS as nodeFS,
  stdNodeOS as nodeOS,
  strCase,
  stripAnsi,
  UserAgent,
} from "./deps.ts";
export * from "./env.ts";
export * from "./fmt.ts";
export * from "./util.ts";

// sanity-check / safeguards
osInvariant();
invariant(env.USER.trim().length > 0, "missing required env variable $USER");
invariant(env.HOME.trim().length > 0, "missing required env variable $HOME");
