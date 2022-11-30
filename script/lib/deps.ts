export * as stdFlags from "https://deno.land/std@0.165.0/flags/mod.ts";
export * as stdColors from "https://deno.land/std@0.165.0/fmt/colors.ts";
export * as stdNodeOS from "https://deno.land/std@0.165.0/node/os.ts";
export * as stdNodeUtil from "https://deno.land/std@0.165.0/node/util.ts";
export * as stdPath from "https://deno.land/std@0.165.0/path/mod.ts";
export * as cliffyAnsi from "https://deno.land/x/cliffy@v0.25.4/ansi/mod.ts";
export * as cliffyCmd from "https://deno.land/x/cliffy@v0.25.4/command/mod.ts";
export * as cliffyFlag from "https://deno.land/x/cliffy@v0.25.4/flags/mod.ts";
export * as cliffyKey from "https://deno.land/x/cliffy@v0.25.4/keycode/mod.ts";
export * as cliffyPress from "https://deno.land/x/cliffy@v0.25.4/keypress/mod.ts";
export * as cliffyPrompts from "https://deno.land/x/cliffy@v0.25.4/prompt/mod.ts";
export * as cliffyTable from "https://deno.land/x/cliffy@v0.25.4/table/mod.ts";
export * as dax from "https://deno.land/x/dax@0.15.0/mod.ts";
export * as dateFns from "npm:date-fns@2.29.3";
// workaround for cjs/esm type goofuhmup. @see https://youtu.be/eRs_MGdCXGU?t=1995
import dedentImport from "npm:string-dedent@3.0.1";
export const dedent = (dedentImport as any as typeof dedentImport["default"]);
