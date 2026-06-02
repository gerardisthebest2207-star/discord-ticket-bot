import {
  type ChatInputCommandInteraction, type ButtonInteraction, type ModalSubmitInteraction, type Guild,
  ChannelType, EmbedBuilder, Colors, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ModalBuilder, TextInputBuilder, TextInputStyle, PermissionFlagsBits, type TextChannel,
} from "discord.js";
import { getGuildConfig, nextTicketNumber } from "../config.js";

const pending: Record<string, { id: string; tag: string }> = {};

export async function handleReportCommand(i: ChatInputCommandInteraction) {
  const user = i.options.getUser("user", true);
  if (user.id === i.user.id) { await i.reply({ content: "❌ You cannot report yourself.", ephemeral: true }); return; }
  if (user.bot) { await i.reply({ content: "❌ You cannot report bots.", ephemeral: true }); return; }
  pending[i.user.id] = { id: user.id, tag: user.tag };
  await i.showModal(
    new ModalBuilder().setCustomId("modal:report").setTitle(`Report ${user.username}`)
      .addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId("reason").setLabel("Reason").setPlaceholder("Describe the violation...").setStyle(TextInputStyle.Paragraph).setMaxLength(1000).setRequired(true)),
        new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId("evidence").setLabel("Evidence (links, message IDs)").setPlaceholder("Optional").setStyle(TextInputStyle.Paragraph).setMaxLength(500).setRequired(false)),
      ),
  );
}

export async function handleReportPanelButton(i: ButtonInteraction) {
  await i.showModal(
    new ModalBuilder().setCustomId("modal:report_panel").setTitle("Report a User")
      .addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId("user_id").setLabel("User ID to report").setPlaceholder("Right-click user → Copy ID").setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId("reason").setLabel("Reason").setPlaceholder("Describe the violation...").setStyle(TextInputStyle.Paragraph).setMaxLength(1000).setRequired(true)),
        new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId("evidence").setLabel("Evidence").setPlaceholder("Optional").setStyle(TextInputStyle.Paragraph).setMaxLength(500).setRequired(false)),
      ),
  );
}

export async function handleReportModal(interaction: ModalSubmitInteraction, fromPanel = false) {
  if (!interaction.inGuild() || !interaction.guild) return;
  const guild = interaction.guild as Guild;
  const cfg = getGuildConfig(guild.id);
  const reason = interaction.fields.getTextInputValue("reason");
  const evidence = interaction.fields.getTextInputValue("evidence") || "None provided";

  let reportedId = "Unknown", reportedTag = "Unknown";
  if (fromPanel) {
    reportedId = interaction.fields.getTextInputValue("user_id").trim();
    try { const m = await guild.members.fetch(reportedId); reportedTag = m.user.tag; reportedId = m.user.id; } catch { reportedTag = reportedId; }
  } else {
    const p = pending[interaction.user.id];
    if (p) { reportedId = p.id; reportedTag = p.tag; delete pending[interaction.user.id]; }
  }

  const num = nextTicketNumber(guild.id);
  await interaction.deferReply({ ephemeral: true });
  try {
    const channel = await guild.channels.create({
      name: `report-${String(num).padStart(4, "0")}`,
      type: ChannelType.GuildText,
      parent: cfg.reportsCategoryId ?? null,
      permissionOverwrites: [
        { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
        ...(cfg.modRoleId ? [{ id: cfg.modRoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageMessages] }] : []),
      ],
    }) as TextChannel;

    const embed = new EmbedBuilder().setTitle(`🚨 Report #${String(num).padStart(4, "0")}`).setColor(Colors.Orange)
      .addFields(
        { name: "Reporter", value: `<@${interaction.user.id}>`, inline: true },
        { name: "Reported", value: reportedId !== "Unknown" ? `<@${reportedId}>` : reportedTag, inline: true },
        { name: "Reason", value: reason },
        { name: "Evidence", value: evidence },
      ).setTimestamp();

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId("ticket:claim").setLabel("Take Case").setStyle(ButtonStyle.Primary).setEmoji("📋"),
      new ButtonBuilder().setCustomId("ticket:close").setLabel("Close Report").setStyle(ButtonStyle.Danger).setEmoji("🔒"),
    );

    const modPing = cfg.modRoleId ? `<@&${cfg.modRoleId}>` : "New report.";
    await channel.send({ content: `<@${interaction.user.id}> | ${modPing}`, embeds: [embed], components: [row] });
    await interaction.editReply({ content: "✅ Report submitted anonymously. The mod team will review it shortly." });
  } catch {
    await interaction.editReply({ content: "❌ Failed to submit report." });
  }
}
