import {
  type ChatInputCommandInteraction, EmbedBuilder, Colors,
  ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType,
} from "discord.js";
import { updateGuildConfig } from "../config.js";

export async function handleSetupCommand(interaction: ChatInputCommandInteraction) {
  if (!interaction.inGuild() || !interaction.guild) return;
  const sub = interaction.options.getSubcommand();

  if (sub === "panel") {
    const embed = new EmbedBuilder().setTitle("📬 Ticket Center").setColor(Colors.Blurple)
      .setDescription("Need help, want to report someone, or is staff taking action? Use the buttons below.")
      .addFields(
        { name: "🎫 Support Ticket", value: "Have a question or need assistance?" },
        { name: "🚨 Report a User", value: "Report a rule-breaking member to the mod team." },
        { name: "⚖️ Moderation Ticket", value: "Staff only — internal moderation action record." },
      )
      .setFooter({ text: "All tickets are private and handled by staff" }).setTimestamp();
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId("panel:support").setLabel("Support Ticket").setStyle(ButtonStyle.Primary).setEmoji("🎫"),
      new ButtonBuilder().setCustomId("panel:report").setLabel("Report a User").setStyle(ButtonStyle.Danger).setEmoji("🚨"),
      new ButtonBuilder().setCustomId("panel:modticket").setLabel("Mod Ticket").setStyle(ButtonStyle.Secondary).setEmoji("⚖️"),
    );
    await interaction.reply({ content: "✅ Panel posted!", ephemeral: true });
    await interaction.channel?.send({ embeds: [embed], components: [row] });
    return;
  }

  if (sub === "modrole") {
    const role = interaction.options.getRole("role", true);
    updateGuildConfig(interaction.guild.id, { modRoleId: role.id });
    await interaction.reply({ content: `✅ Mod role set to <@&${role.id}>.`, ephemeral: true });
    return;
  }

  if (sub === "supportrole") {
    const role = interaction.options.getRole("role", true);
    updateGuildConfig(interaction.guild.id, { supportRoleId: role.id });
    await interaction.reply({ content: `✅ Support role set to <@&${role.id}>.`, ephemeral: true });
    return;
  }

  if (sub === "categories") {
    const support = interaction.options.getChannel("support");
    const reports = interaction.options.getChannel("reports");
    const moderation = interaction.options.getChannel("moderation");
    const updates: Record<string, string> = {};
    for (const [key, ch] of [["supportCategoryId", support], ["reportsCategoryId", reports], ["modCategoryId", moderation]] as [string, typeof support][]) {
      if (ch) {
        if (ch.type !== ChannelType.GuildCategory) { await interaction.reply({ content: `❌ ${ch.name} is not a category.`, ephemeral: true }); return; }
        updates[key] = ch.id;
      }
    }
    updateGuildConfig(interaction.guild.id, updates as never);
    await interaction.reply({ content: `✅ Categories updated.`, ephemeral: true });
    return;
  }

  if (sub === "logchannel") {
    const ch = interaction.options.getChannel("channel", true);
    if (ch.type !== ChannelType.GuildText) { await interaction.reply({ content: "❌ Please select a text channel.", ephemeral: true }); return; }
    updateGuildConfig(interaction.guild.id, { logChannelId: ch.id });
    await interaction.reply({ content: `✅ Transcript log channel set to <#${ch.id}>.`, ephemeral: true });
    return;
  }

  await interaction.reply({ content: "Unknown subcommand.", ephemeral: true });
}
