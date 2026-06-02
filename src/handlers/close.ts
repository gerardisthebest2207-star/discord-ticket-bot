import {
  type TextChannel, type ButtonInteraction,
  type ChatInputCommandInteraction,
  EmbedBuilder, Colors,
} from "discord.js";
import { postTranscript } from "./transcript.js";

export async function closeTicketChannel(channel: TextChannel, closedBy: string, reason?: string) {
  const resolvedReason = reason ?? "No reason provided";

  await postTranscript(channel, channel.guild, closedBy, resolvedReason);

  const embed = new EmbedBuilder()
    .setTitle("🔒 Ticket Closed")
    .setColor(Colors.Red)
    .addFields(
      { name: "Closed by", value: `<@${closedBy}>`, inline: true },
      { name: "Reason", value: resolvedReason, inline: true },
    )
    .setTimestamp();

  await channel.send({ embeds: [embed] });
  await new Promise((r) => setTimeout(r, 3000));
  try { await channel.delete(`Closed by ${closedBy}`); } catch {}
}

export async function handleCloseCommand(interaction: ChatInputCommandInteraction) {
  if (!interaction.inGuild()) return;
  const channel = interaction.channel as TextChannel;
  const isTicket = channel.name.startsWith("ticket-") || channel.name.startsWith("report-") || channel.name.startsWith("modticket-");
  if (!isTicket) {
    await interaction.reply({ content: "❌ This can only be used inside a ticket channel.", ephemeral: true });
    return;
  }
  await interaction.reply({ content: "🔒 Saving transcript and closing ticket..." });
  await closeTicketChannel(channel, interaction.user.id, interaction.options.getString("reason") ?? undefined);
}

export async function handleCloseButton(interaction: ButtonInteraction) {
  const channel = interaction.channel as TextChannel;
  await interaction.reply({ content: "🔒 Saving transcript and closing ticket..." });
  await closeTicketChannel(channel, interaction.user.id, "Closed via button");
}
