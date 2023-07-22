import { Menu } from "../../deps.deno.ts";
import req from "./req.ts";
export const deleteMenu = new Menu("deleteMenu")
    .dynamic(async (ctx, range) => {
        const resp = await req("list", ctx.chat?.id!);
        const json: { emails: string[] } = resp.json;

        for (const email of json.emails) {
            if (email !== `${ctx.chat?.id}@decline.live`) {
                range
                    .text(email, async ctx => {
                        const resp = await fetch(
                            `https://api.decline.live/v2/delete/${
                                ctx.chat?.id
                            }/${email}?token=${Deno.env.get("BOT_TOKEN")}`
                        );

                        if (resp.status !== 200) {
                            return await ctx.reply(
                                `❌ Failed to delete email address. Please try again later.`,
                                { parse_mode: "Markdown" }
                            );
                        } else {
                            await ctx.reply("🫥 Email address deleted.");
                        }

                        return await ctx.deleteMessage();
                    })
                    .row();
            }
        }
        return range;
    })
    .text("🚫 Cancel", async ctx => {
        await ctx.reply("📕 Menu closed.");

        await ctx.deleteMessage();
    });
