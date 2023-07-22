import {
    Composer,
    InlineKeyboard,
    conversations,
    createConversation,
    session,
} from "../../deps.deno.ts";
import { connect } from "../handlers/conversations.ts";
import { deleteMenu } from "../handlers/menu.ts";
import req from "../handlers/req.ts";
import type { MyContext } from "./bot.ts";
import { bot } from "./bot.ts";

export const commands = new Composer<MyContext>();
commands.use(session({ initial: () => ({}) }));
commands.use(conversations());
commands.use(createConversation(connect));

commands.on("callback_query:data", async (ctx: MyContext) => {
    if (ctx.callbackQuery?.data?.startsWith("sync:")) {
        return await ctx.conversation.enter("connect");
    } else if (ctx.callbackQuery?.data?.startsWith("reg:")) {
        const resp = await req(
            "register",
            ctx.callbackQuery.data.split(":")[1]
        );
        if (resp.status == 200) {
            return await ctx.reply(
                "🤝 You have successfully registered. Enjoy your use!"
            );
        } else {
            return await ctx.reply(
                "❌ Failed to register. Please try again later."
            );
        }
    }
});

commands.use(async (ctx, next) => {
    if (ctx.message?.chat.type === "private") {
        await next();
    } else {
        return;
    }

    bot.catch(err => {
        return console.log(`[ERROR] ${err.message}`);
    });
});

commands.command("start", async ctx => {
    const resp = await fetch(
        `https://api.decline.live/v2/is_registered/${
            ctx.chat.id
        }?token=${Deno.env.get("BOT_TOKEN")}`
    );

    await ctx.reply(
        "Welcome to [Atomic Emails - Telegram](https://www.decline.live/clients). This bot is a connector for [Atomic Emails](https://www.decline.live) service. You can use it to generate temporary email addresses and receive emails from them. \nTo get started, use the /help command.\n[GitHub](https://github.com/AtomicEmails/AtomicEmails) | [Website](https://www.decline.live) | [Telegram](https://t.me/atomicmailsbot)",
        { parse_mode: "Markdown" }
    );

    if (resp.status == 200) {
        await ctx.reply(
            "✅ You are already registered. Check /list to see your email addresses."
        );
    } else if (resp.status == 404) {
        await ctx.reply(
            "⚛️ You were not identified as a registered user. If you think this is a mistake, please click the button below and follow the instructions to sync between clients.",
            {
                reply_markup: new InlineKeyboard()
                    .text(
                        "🔗 Sync with Atomic Emails",
                        `sync:${ctx.chat.id}`
                    )
                    .row()
                    .text(
                        "✅ Create an account for me",
                        `reg:${ctx.chat.id}`
                    ),
            }
        );
    }
});

commands.command("help", async ctx => {
    await ctx.reply(
        `*Available commands*:
• /start - Start the bot.
• /help - Get help menu.
• /new - Generate a new email address.
• /delete - Delete the active email address.
• /purge - Purge all active email addresses.
• /list - Get the list of active email addresses.
• /forward - Turn the email forwarding on/off.
• /id - Get your Unique ID to sync between clients.`,
        { parse_mode: "Markdown" }
    );
});

commands.command("new", async ctx => {
    const resp = await req("assign", ctx.chat.id);
    if (resp.status !== 200) {
        return await ctx.reply(
            "❌ Failed to generate a new email address."
        );
    }
    await ctx.reply(`📧 New email address generated: ${resp.json.email}`);
});

commands.command("id", async ctx => {
    const resp = await req("unique_id", ctx.chat.id);

    if (resp.status !== 200) {
        return await ctx.reply(
            `❌ Failed to get your Unique ID. Please try again later.`
        );
    }

    await ctx.reply(
        `Your Unique ID: \n\`\`\`${resp.json.id}\`\`\`\nUnique ID grants access to your email addresses. *Do not share it with anyone.*`,
        { parse_mode: "Markdown" }
    );
});

commands.command("list", async ctx => {
    const resp = await req("list", ctx.chat.id);
    const json: { emails: string[] } = resp.json;
    if (
        resp.status == 404 ||
        json.emails == null ||
        json.emails.length == 0
    ) {
        return await ctx.reply(
            "❌ You don't have any email addresses yet. Use /new to generate a new one."
        );
    }

    if (resp.status !== 200) {
        return await ctx.reply("❌ Failed to fetch email addresses.");
    }

    await ctx.reply(
        "✅ Your email addresses:\n" +
            json.emails.map(e => `- ${e}`).join("\n")
    );
});

commands.command("purge", async ctx => {
    const resp = await req("reset", ctx.chat.id);

    if (resp.status !== 200) {
        return await ctx.reply(
            `❌ Failed to delete all email addresses. Please try again later.`
        );
    } else {
        await ctx.reply("🫥 All email addresses deleted.");
    }
});

commands.command("forward", async ctx => {
    const resp = await req("forward", ctx.chat.id);
    if (resp.status !== 200) {
        return await ctx.reply(`❌ Failed to switch forward mode.`);
    } else {
        await ctx.reply(
            `${resp.json.forward ? "📬" : "📪"} Email forwarding is now ${
                resp.json.forward ? "enabled" : "disabled"
            }.`
        );
    }
});

commands.command("delete", async ctx => {
    const resp = await req("list", ctx.chat?.id!);

    if (resp.status == 404) {
        return await ctx.reply(
            "❌ You don't have any email addresses yet. Use /new to generate a new one."
        );
    }

    await ctx.reply("Select the email address you want to delete.", {
        reply_markup: deleteMenu,
    });
});
