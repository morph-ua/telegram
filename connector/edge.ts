import { Application, Router, webhookCallback } from "../deps.deno.ts";
import { bot } from "./core/bot.ts";
import { router } from "./handlers/receiver.ts";

const webParser = new Router()
    .redirect("/", `https://${bot.botInfo.username}.t.me`)
    .post(`/bot/${bot.token}`, webhookCallback(bot, "oak"));

await new Application()
    .use(webParser.routes())
    .use(router.routes())
    .use(router.allowedMethods())
    .listen({ port: parseInt(Deno.env.get("PORT")!) || 7000 });
