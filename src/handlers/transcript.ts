import { type TextChannel, type Guild, EmbedBuilder, Colors, AttachmentBuilder } from "discord.js";
import { getGuildConfig } from "../config.js";

type TicketType = "support" | "report" | "modticket";

const TYPE_LABELS: Record<TicketType, string> = {
  support: "🎫 Support Ticket",
  report: "🚨 Report",
  modticket: "⚖️ Moderation Ticket",
};

const TYPE_COLORS: Record<TicketType, number> = {
  support: Colors.Blue,
  report: Colors.Orange,
  modticket: Colors.DarkRed,
};

function detectType(name: string): TicketType {
  if (name.startsWith("report-")) return "report";
  if (name.startsWith("modticket-")) return "modticket";
  return "support";
}

export async function postTranscript(channel: TextChannel, guild: Guild, closedBy: string, reason: string) {
  const cfg = getGuildConfig(guild.id);
  if (!cfg.logChannelId) return;
  const logChannel = guild.channels.cache.get(cfg.logChannelId) as TextChannel | undefined;
  if (!logChannel) return;

  const type = detectType(channel.name);
  const messages: { timestamp: Date; author: string; authorId: string; content: string; attachments: string[] }[] = [];

  let lastId: string | undefined;
  while (messages.length < 500) {
    const batch = await channel.messages.fetch({ limit: 100, ...(lastId ? { before: lastId } : {}) });
    if (!batch.size) break;
    for (const m of batch.values()) {
      messages.push({ timestamp: m.createdAt, author: m.author.tag, authorId: m.author.id, content: m.content || "[embed/component]", attachments: m.attachments.map((a) => a.url) });
    }
    lastId = batch.last()?.id;
    if (batch.size < 100) break;
  }
  messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  const lines = [
    `═══════════════════════════════════════════════════════════`,
    `  TICKET TRANSCRIPT — ${TYPE_LABELS[type]}`,
    `═══════════════════════════════════════════════════════════`,
    `  Channel  : #${channel.name}`,
    `  Guild    : ${guild.name} (${guild.id})`,
    `  Closed by: ${closedBy}`,
    `  Reason   : ${reason}`,
    `  Messages : ${messages.length}`,
    `  Generated: ${new Date().toUTCString()}`,
    `═══════════════════════════════════════════════════════════`, "",
  ];

  for (const m of messages) {
    lines.push(`[${m.timestamp.toUTCString()}] ${m.author} (${m.authorId})`);
    lines.push(`  ${m.content}`);
    if (m.attachments.length) lines.push(`  Attachments: ${m.attachments.join(", ")}`);
    lines.push("");
  }

  const buffer = Buffer.from(lines.join("\n"), "utf-8");
  const attachment = new AttachmentBuilder(buffer, { name: `transcript-${channel.name}.txt` });

  const embed = new EmbedBuilder()
    .setTitle(`${TYPE_LABELS[type]} — Closed`)
    .setColor(TYPE_COLORS[type])
    .addFields(
      { name: "Channel", value: `#${channel.name}`, inline: true },
      { name: "Closed by", value: `<@${closedBy}>`, inline: true },
      { name: "Reason", value: reason, inline: false },
      { name: "Messages", value: `${messages.length}`, inline: true },
      { name: "Closed at", value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
    )
    .setTimestamp();

  try { await logChannel.send({ embeds: [embed], files: [attachment] }); } catch {}
}
