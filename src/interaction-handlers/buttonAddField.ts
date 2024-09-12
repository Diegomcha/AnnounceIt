import { TextInputBuilder } from '@discordjs/builders'
import { EmbedLimits } from '@sapphire/discord-utilities'
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework'
import { fetchT } from '@sapphire/plugin-i18next'
import { ActionRowBuilder, ButtonInteraction, ModalBuilder, TextInputStyle } from 'discord.js'

export default class ButtonHandler extends InteractionHandler {
  public constructor (context: InteractionHandler.LoaderContext, options: InteractionHandler.Options) {
    super(context, {
      ...options,
      interactionHandlerType: InteractionHandlerTypes.Button
    })
  }

  public override parse (interaction: ButtonInteraction) {
    return interaction.customId.startsWith('addField:') ? this.some(interaction.customId.split(':')[1]) : this.none()
  }

  public override async run (interaction: ButtonInteraction, announcementName: string) {
    const t = await fetchT(interaction)

    const components = [
      // Name
      new TextInputBuilder()
        .setCustomId('name')
        .setLabel(t('commands:addFields.name.label'))
        .setPlaceholder(t('commands:addFields.name.placeholder'))
        .setMaxLength(EmbedLimits.MaximumFieldNameLength)
        .setStyle(TextInputStyle.Short)
        .setRequired(true),
      // Value
      new TextInputBuilder()
        .setCustomId('value')
        .setLabel(t('commands:addFields.value.label'))
        .setPlaceholder(t('commands:addFields.value.placeholder'))
        .setMaxLength(EmbedLimits.MaximumFieldValueLength)
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
    ].map((c) => new ActionRowBuilder<TextInputBuilder>().addComponents(c))

    const modal = new ModalBuilder()
      .setTitle(t('commands:addFields.modalTitle'))
      .setCustomId(`addField:${announcementName}`)
      .setComponents(
        ...components
      )

    return await interaction.showModal(modal)
  }
}
