import { Client, GatewayIntentBits, Events, ActivityType, REST, Routes } from "discord.js";
import { commands } from "./commands.js";
import { handleInteraction } from "./handlers/interactions.js";

const token = process.env["DISCORD_BOT_TOKEN"];
if (!token) { console.error("❌ DISCORD_BOT_TOKEN is not set."); process.exit(1); }

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, async (ready) => {
  console.log(`✅ Logged in as ${ready.user.tag}`);
  ready.user.setPresence({ activities: [{ name: "ticket channels", type: ActivityType.Watching }], status: "online" });

  const rest = new REST({ version: "10" }).setToken(token);
  try {
    await rest.put(Routes.applicationCommands(ready.user.id), { body: commands });
    console.log(`✅ Registered ${commands.length} slash commands.`);
  } catch (err) {
    console.error("Failed to register commands:", err);
  }
});

client.on(Events.InteractionCreate, handleInteraction);
client.on(Events.Error, (err) => console.error("Client error:", err));

client.login(token);
