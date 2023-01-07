import { stdColors } from "./deps.ts";

export function blackOnYellow(what: string) {
  return stdColors.black(stdColors.bgYellow(what));
}
