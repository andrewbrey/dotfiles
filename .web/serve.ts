import { serve } from "https://deno.land/std@0.175.0/http/server.ts";

serve(async (_req) =>
  new Response(await Deno.readTextFile("script.sh"), {
    headers: { "content-type": "text/plain;charset=UTF-8" },
  })
);
