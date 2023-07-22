import { InlineKeyboard, Router } from "../../deps.deno.ts";
import { bot } from "../core/bot.ts";

const n = (s: string) => {
    if (new TextEncoder().encode(s).length > 4096) {
        return s.slice(0, 4093) + "...";
    } else {
        return s;
    }
};

export const router = new Router();

router.post("/send", async ctx => {
    const secret = ctx.request.url.searchParams.get("secret");
    if (!secret || secret !== Deno.env.get("BOT_TOKEN")) {
        return ctx.throw(401, "Unauthorized");
    }

    if (!ctx.request.hasBody) {
        return ctx.throw(400, "Bad Request: body is missing");
    }

    const body: {
        message: {
            from: string;
            to: string;
            text: string;
            subject: string;
        };
        id: string;
        rendered_uri?: string;
        files?: string[];
    } = await ctx.request.body().value;

    const options: {
        parse_mode: any;
        disable_web_page_preview: boolean;
        reply_markup?: InlineKeyboard;
    } = {
        parse_mode: "Markdown",
        disable_web_page_preview: true,
    };

    if (!body) {
        return ctx.throw(400, "Bad Request: body is missing");
    }

    if (!body.message) {
        return ctx.throw(400, "Bad Request: message is missing");
    }

    if (!body.id) {
        return ctx.throw(400, "Bad Request: id is missing");
    }

    if (body.rendered_uri) {
        Object.assign(options, {
            reply_markup: new InlineKeyboard().url(
                "🚀 Show Preview",
                body.rendered_uri
            ),
        });
    }

    try {
        await bot.api.sendMessage(
            body.id,
            `Subject: ${body.message.subject}
${body.message.from} → ${body.message.to}

${n(body.message.text)}`,
            options
        );
    } catch {
        await bot.api.sendMessage(
            body.id,
            "❌ Failed to parse message, use preview instead.",
            options
        );
    }

    if (body.files) {
        for (const file of body.files) {
            await bot.api.sendDocument(body.id, file);
        }
    }
});
