import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";

export const commands = [
  new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Open a support ticket")
    .toJSON(),

  new SlashCommandBuilder()
    .setName("report")
    .setDescription("Report a user to the moderation team")
    .addUserOption((o) =>
      o.setName("user").setDescription("The user to report").setRequired(true),
    )
    .toJSON(),

  new SlashCommandBuilder()
    .setName("modticket")
    .setDescription("Create a moderation action ticket (staff only)")
    .addUserOption((o) =>
      o.setName("user").setDescription("The user this ticket concerns").setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .toJSON(),

  new SlashCommandBuilder()
    .setName("close")
    .setDescription("Close this ticket")
    .addStringOption((o) =>
      o.setName("reason").setDescription("Reason for closing").setRequired(false),
    )
    .toJSON(),

  new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Configure the ticket bot (admin only)")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((s) => s.setName("panel").setDescription("Post the ticket panel in this channel"))
    .addSubcommand((s) =>
      s.setName("modrole").setDescription("Set the moderator/staff role")
        .addRoleOption((o) => o.setName("role").setDescription("The mod/staff role").setRequired(true)),
    )
    .addSubcommand((s) =>
      s.setName("supportrole").setDescription("Set a separate support team role")
        .addRoleOption((o) => o.setName("role").setDescription("The support team role").setRequired(true)),
    )
    .addSubcommand((s) =>
      s.setName("categories").setDescription("Set the ticket categories")
        .addChannelOption((o) => o.setName("support").setDescription("Category for support tickets"))
        .addChannelOption((o) => o.setName("reports").setDescription("Category for report tickets"))
        .addChannelOption((o) => o.setName("moderation").setDescription("Category for moderation tickets")),
    )
    .addSubcommand((s) =>
      s.setName("logchannel").setDescription("Set the channel where transcripts are posted")
        .addChannelOption((o) => o.setName("channel").setDescription("The text channel for transcripts").setRequired(true)),
    )
    .toJSON(),
];
