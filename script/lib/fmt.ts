import { stdColors } from "./deps.ts";

// TODO: look into removing this, and perhaps bringing the cliffy/colors module in which is fluent and more convenient to use
export function blackOnYellow(what: string) {
  return stdColors.black(stdColors.bgYellow(what));
}
