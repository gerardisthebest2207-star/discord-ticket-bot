import {
  type ChatInputCommandInteraction, type ButtonInteraction, type ModalSubmitInteraction, type Guild,
  ChannelType, EmbedBuilder, Colors, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ModalBuilder, TextInputBuilder, TextInputStyle, PermissionFlagsBits, type TextChannel,
} from "discord.js";
import { getGuildConfig, nextTicketNumber } from "../config.js";

const pending: Record<string, { id: string; tag: string }> = {};

export async function handleModTicketCommand(i: ChatInputCommandInteraction) {
  if (!i.inGuild()) return;
  const user = i.options.getUser("user", true);
  pending[i.user.id] = { id: user.id, tag: user.tag };
  await i.showModal(
    new ModalBuilder().setCustomId("modal:modticket").setTitle(`Mod Ticket — ${user.username}`)
      .addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId("action").setLabel("Moderation Action").setPlaceholder("e.g. Warning, Mute, Kick, Ban...").setStyle(TextInputStyle.Short).setMaxLength(80).setRequired(true)),
        new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId("reason").setLabel("Reason / Details").setPlaceholder("Describe the situation...").setStyle(TextInputStyle.Paragraph).setMaxLength(1000).setRequired(true)),
        new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId("evidence").setLabel("Evidence").setPlaceholder("Optional").setStyle(TextInputStyle.Paragraph).setMaxLength(500).setRequired(false)),
      ),
  );
}

export async function handleModTicketPanelButton(i: ButtonInteraction) {
  await i.showModal(
    new ModalBuilder().setCustomId("modal:modticket_panel").setTitle("Create Moderation Ticket")
      .addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId("user_id").setLabel("Target User ID").setPlaceholder("Right-click user → Copy ID").setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId("action").setLabel("Moderation Action").setPlaceholder("e.g. Warning, Mute, Kick, Ban...").setStyle(TextInputStyle.Short).setMaxLength(80).setRequired(true)),
        new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId("reason").setLabel("Reason / Details").setStyle(TextInputStyle.Paragraph).setMaxLength(1000).setRequired(true)),
        new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId("evidence").setLabel("Evidence").setPlaceholder("Optional").setStyle(TextInputStyle.Paragraph).setMaxLength(500).setRequired(false)),
      ),
  );
}

export async function handleModTicketModal(interaction: ModalSubmitInteraction, fromPanel = false) {
  if (!interaction.inGuild() || !interaction.guild) return;
  const guild = interaction.guild as Guild;
  const cfg = getGuildConfig(guild.id);
  const action = interaction.fields.getTextInputValue("action");
  const reason = interaction.fields.getTextInputValue("reason");
  const evidence = interaction.fields.getTextInputValue("evidence") || "None provided";

  let targetId = "Unknown", targetTag = "Unknown";
  if (fromPanel) {
    targetId = interaction.fields.getTextInputValue("user_id").trim();
    try { const m = await guild.members.fetch(targetId); targetTag = m.user.tag; targetId = m.user.id; } catch { targetTag = targetId; }
  } else {
    const p = pending[interaction.user.id];
    if (p) { targetId = p.id; targetTag = p.tag; delete pending[interaction.user.id]; }
  }

  const num = nextTicketNumber(guild.id);
  await interaction.deferReply({ ephemeral: true });
  try {
    const channel = await guild.channels.create({
      name: `modticket-${String(num).padStart(4, "0")}`,
      type: ChannelType.GuildText,
      parent: cfg.modCategoryId ?? null,
      permissionOverwrites: [
        { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
        ...(cfg.modRoleId ? [{ id: cfg.modRoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageMessages] }] : []),
      ],
    }) as TextChannel;

    const embed = new EmbedBuilder().setTitle(`⚖️ Moderation Ticket #${String(num).padStart(4, "0")}`).setColor(Colors.DarkRed)
      .addFields(
        { name: "Opened by", value: `<@${interaction.user.id}>`, inline: true },
        { name: "Target", value: targetId !== "Unknown" ? `<@${targetId}>` : targetTag, inline: true },
        { name: "Action", value: `\`${action}\``, inline: true },
        { name: "Reason", value: reason },
        { name: "Evidence", value: evidence },
      ).setTimestamp();

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId("ticket:claim").setLabel("Take Case").setStyle(ButtonStyle.Primary).setEmoji("⚖️"),
      new ButtonBuilder().setCustomId("ticket:close").setLabel("Resolve & Close").setStyle(ButtonStyle.Danger).setEmoji("✅"),
    );

    const modPing = cfg.modRoleId ? `<@&${cfg.modRoleId}>` : "New mod ticket.";
    await channel.send({ content: `<@${interaction.user.id}> | ${modPing}`, embeds: [embed], components: [row] });
    await interaction.editReply({ content: `✅ Moderation ticket created: ${channel}` });
  } catch {
    await interaction.editReply({ content: "❌ Failed to create mod ticket. Make sure the bot has **Manage Channels** permission." });
  }
}
