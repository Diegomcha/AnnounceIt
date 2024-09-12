import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework'
import { fetchT } from '@sapphire/plugin-i18next'
import { ModalSubmitInteraction } from 'discord.js'
import { Announcement } from '../schemas/Announcement.js'
import { buildAnnouncementEmbed } from '../utils/buildAnnouncement.js'
import { getReplyContent } from '../utils/reply.js'

export default class ModalHandler extends InteractionHandler {
  public constructor (context: InteractionHandler.LoaderContext, options: InteractionHandler.Options) {
    super(context, {
      ...options,
      interactionHandlerType: InteractionHandlerTypes.ModalSubmit
    })
  }

  public override parse (interaction: ModalSubmitInteraction) {
    return interaction.customId.startsWith('addField:') ? this.some(interaction.customId.split(':')[1]) : this.none()
  }

  public override async run (interaction: ModalSubmitInteraction, announcementName: string) {
    const t = await fetchT(interaction)

    const name = interaction.fields.getTextInputValue('name')
    const value = interaction.fields.getTextInputValue('value')

    // TODO: Implement validation if necessary

    // Add field
    const announcement = await Announcement.findOne({
      name: announcementName
    }).exec()
    announcement?.fields?.push({ name, value })
    await announcement?.save()

    // Respond to the interaction without message
    await interaction.deferReply()
    await interaction.deleteReply()

    // Edit original message
    await interaction.message?.edit(getReplyContent({
      content: t('commands:addFields.success'),
      embeds: [buildAnnouncementEmbed(announcement!)],
      type: 'positive'
    }, true))
  }
}
