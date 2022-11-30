import { stdColors } from "./deps.ts";
import { $, env } from "./env.ts";

export function doneWith(id: string) {
  $.logStep("done with", id, env.EOL);
}

export function blackOnYellow(what: string) {
  return stdColors.black(stdColors.bgYellow(what));
}
