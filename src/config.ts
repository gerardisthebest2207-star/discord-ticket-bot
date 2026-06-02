import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = path.resolve(__dirname, "../bot-config.json");

export interface GuildConfig {
  modRoleId?: string;
  supportRoleId?: string;
  supportCategoryId?: string;
  reportsCategoryId?: string;
  modCategoryId?: string;
  logChannelId?: string;
  ticketCounter: number;
}

interface BotConfig {
  guilds: Record<string, GuildConfig>;
}

function load(): BotConfig {
  try {
    if (fs.existsSync(CONFIG_PATH))
      return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8")) as BotConfig;
  } catch {}
  return { guilds: {} };
}

function save(cfg: BotConfig) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2));
}

export function getGuildConfig(guildId: string): GuildConfig {
  const cfg = load();
  if (!cfg.guilds[guildId]) {
    cfg.guilds[guildId] = { ticketCounter: 0 };
    save(cfg);
  }
  return cfg.guilds[guildId];
}

export function updateGuildConfig(guildId: string, updates: Partial<GuildConfig>) {
  const cfg = load();
  if (!cfg.guilds[guildId]) cfg.guilds[guildId] = { ticketCounter: 0 };
  Object.assign(cfg.guilds[guildId], updates);
  save(cfg);
}

export function nextTicketNumber(guildId: string): number {
  const cfg = load();
  if (!cfg.guilds[guildId]) cfg.guilds[guildId] = { ticketCounter: 0 };
  cfg.guilds[guildId].ticketCounter += 1;
  const num = cfg.guilds[guildId].ticketCounter;
  save(cfg);
  return num;
}
