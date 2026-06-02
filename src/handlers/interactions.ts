import { type Interaction } from "discord.js";
import { handleTicketCommand, handleTicketPanelButton, handleSupportTicketModal, handleClaimButton } from "./support.js";
import { handleReportCommand, handleReportPanelButton, handleReportModal } from "./report.js";
import { handleModTicketCommand, handleModTicketPanelButton, handleModTicketModal } from "./modticket.js";
import { handleCloseCommand, handleCloseButton } from "./close.js";
import { handleSetupCommand } from "./setup.js";

export async function handleInteraction(interaction: Interaction) {
  try {
    if (interaction.isChatInputCommand()) {
      const { commandName } = interaction;
      if (commandName === "ticket") return await handleTicketCommand(interaction);
      if (commandName === "report") return await handleReportCommand(interaction);
      if (commandName === "modticket") return await handleModTicketCommand(interaction);
      if (commandName === "close") return await handleCloseCommand(interaction);
      if (commandName === "setup") return await handleSetupCommand(interaction);
      return;
    }
    if (interaction.isButton()) {
      const { customId } = interaction;
      if (customId === "panel:support") return await handleTicketPanelButton(interaction);
      if (customId === "panel:report") return await handleReportPanelButton(interaction);
      if (customId === "panel:modticket") return await handleModTicketPanelButton(interaction);
      if (customId === "ticket:close") return await handleCloseButton(interaction);
      if (customId === "ticket:claim") return await handleClaimButton(interaction);
      return;
    }
    if (interaction.isModalSubmit()) {
      const { customId } = interaction;
      if (customId === "modal:support_ticket") return await handleSupportTicketModal(interaction);
      if (customId === "modal:report") return await handleReportModal(interaction, false);
      if (customId === "modal:report_panel") return await handleReportModal(interaction, true);
      if (customId === "modal:modticket") return await handleModTicketModal(interaction, false);
      if (customId === "modal:modticket_panel") return await handleModTicketModal(interaction, true);
      return;
    }
  } catch (err) {
    console.error("Interaction error:", err);
    try {
      const i = interaction as unknown as { replied?: boolean; deferred?: boolean; editReply: (r: object) => Promise<unknown>; reply: (r: object) => Promise<unknown> };
      const msg = { content: "❌ Something went wrong.", ephemeral: true };
      if (i.replied) return;
      if (i.deferred) await i.editReply(msg); else await i.reply(msg);
    } catch {}
  }
}
