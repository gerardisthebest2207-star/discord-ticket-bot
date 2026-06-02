import {
  type ChatInputCommandInteraction, type ButtonInteraction, type ModalSubmitInteraction, type Guild,
  ChannelType, EmbedBuilder, Colors, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ModalBuilder, TextInputBuilder, TextInputStyle, PermissionFlagsBits, type TextChannel,
} from "discord.js";
import { getGuildConfig, nextTicketNumber } from "../config.js";

const modal = () => new ModalBuilder().setCustomId("modal:support_ticket").setTitle("Open a Support Ticket")
  .addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder().setCustomId("subject").setLabel("Subject").setPlaceholder("Brief description of your issue").setStyle(TextInputStyle.Short).setMaxLength(100).setRequired(true),
    ),
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder().setCustomId("description").setLabel("Description").setPlaceholder("Describe your issue in detail...").setStyle(TextInputStyle.Paragraph).setMaxLength(1000).setRequired(true),
    ),
  );

export async function handleTicketCommand(i: ChatInputCommandInteraction) { await i.showModal(modal()); }
export async function handleTicketPanelButton(i: ButtonInteraction) { await i.showModal(modal()); }

export async function handleSupportTicketModal(interaction: ModalSubmitInteraction) {
  if (!interaction.inGuild() || !interaction.guild) return;
  const guild = interaction.guild as Guild;
  const subject = interaction.fields.getTextInputValue("subject");
  const description = interaction.fields.getTextInputValue("description");
  const cfg = getGuildConfig(guild.id);
  const num = nextTicketNumber(guild.id);

  await interaction.deferReply({ ephemeral: true });
  try {
    const overwrites = [
      { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
      { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles] },
      ...(cfg.modRoleId ? [{ id: cfg.modRoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageMessages] }] : []),
      ...(cfg.supportRoleId && cfg.supportRoleId !== cfg.modRoleId ? [{ id: cfg.supportRoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageMessages] }] : []),
    ];

    const channel = await guild.channels.create({
      name: `ticket-${String(num).padStart(4, "0")}`,
      type: ChannelType.GuildText,
      parent: cfg.supportCategoryId ?? null,
      permissionOverwrites: overwrites,
      topic: `Support ticket by ${interaction.user.tag} | ${subject}`,
    }) as TextChannel;

    const embed = new EmbedBuilder()
      .setTitle(`🎫 Support Ticket #${String(num).padStart(4, "0")}`)
      .setColor(Colors.Blue)
      .setDescription(`Welcome <@${interaction.user.id}>! Support will be with you shortly.`)
      .addFields({ name: "Opened by", value: `<@${interaction.user.id}>`, inline: true }, { name: "Subject", value: subject, inline: true }, { name: "Description", value: description })
      .setTimestamp();

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId("ticket:claim").setLabel("Claim Ticket").setStyle(ButtonStyle.Success).setEmoji("✋"),
      new ButtonBuilder().setCustomId("ticket:close").setLabel("Close Ticket").setStyle(ButtonStyle.Danger).setEmoji("🔒"),
    );

    const staffPing = cfg.supportRoleId ? `<@&${cfg.supportRoleId}>` : cfg.modRoleId ? `<@&${cfg.modRoleId}>` : "";
    await channel.send({ content: `<@${interaction.user.id}>${staffPing ? ` | ${staffPing}` : ""}`, embeds: [embed], components: [row] });
    await interaction.editReply({ content: `✅ Ticket opened: ${channel}` });
  } catch {
    await interaction.editReply({ content: "❌ Failed to create ticket. Make sure the bot has **Manage Channels** permission." });
  }
}

export async function handleClaimButton(interaction: ButtonInteraction) {
  await interaction.reply({ embeds: [new EmbedBuilder().setColor(Colors.Green).setDescription(`✋ Claimed by <@${interaction.user.id}>`).setTimestamp()] });
}
