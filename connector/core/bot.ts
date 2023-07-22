import {
    Bot,
    ConversationFlavor,
    ParseModeFlavor,
    autoRetry,
    hydrateReply,
    type Context,
    type Conversation,
} from "../../deps.deno.ts";
import { deleteMenu } from "../handlers/menu.ts";
import { commands } from "./cmd.ts";

export type MyContext = Context &
    ParseModeFlavor<Context> &
    ConversationFlavor;
export type MyConversation = Conversation<MyContext>;

export const bot = new Bot<MyContext>(Deno.env.get("BOT_TOKEN")!, {
    client: {
        canUseWebhookReply: method => method === "sendChatAction",
    },
});

bot.api.config.use(autoRetry());
bot.use(deleteMenu);
bot.use(hydrateReply<MyContext>);
bot.use(commands);
await bot.api.setMyCommands([
    { command: "start", description: "Start the bot." },
    { command: "help", description: "Get help menu." },
    { command: "new", description: "Generate a new email address." },
    {
        command: "delete",
        description: "Delete the active email address.",
    },
    {
        command: "purge",
        description: "Purge all active email addresses.",
    },
    {
        command: "list",
        description: "Get the list of active email addresses.",
    },
    {
        command: "forward",
        description: "Turn the email forwarding on/off.",
    },
    {
        command: "id",
        description: "Get your Unique ID to sync between clients.",
    },
]);

await bot.init();
