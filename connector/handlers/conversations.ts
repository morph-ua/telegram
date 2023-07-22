import { MyContext, MyConversation } from "../core/bot.ts";

export async function connect(
    conversation: MyConversation,
    ctx: MyContext
) {
    await ctx.reply(
        "To connect the bot to your account, please enter your Unique ID.\n\n**Hint:** You can use /id to get your Unique ID in any Atomic Emails telegram connector.",
        {
            parse_mode: "Markdown",
        }
    );
    const { message } = await conversation.wait();
    await ctx.reply(
        `You have entered the following ID: \`\`\`${message?.text}\`\`\`\n*Starting the connection process...*`,
        {
            parse_mode: "Markdown",
        }
    );
    const resp = await fetch(
        `https://api.decline.live/v2/connect/${
            ctx.chat?.id
        }?token=${Deno.env.get("BOT_TOKEN")}&uid=${message?.text}`
    );
    if (resp.status == 200) {
        return await ctx.reply(
            `✅ You have successfully connected your account. Enjoy your use!`
        );
    } else {
        return await ctx.reply(
            `❌ Failed to connect your account. Service returned ${resp.status} status code.\n*Please try again later.*`,
            {
                parse_mode: "Markdown",
            }
        );
    }
}
