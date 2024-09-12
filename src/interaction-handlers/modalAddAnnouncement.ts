import { ActionRowBuilder } from '@discordjs/builders'
import { EmbedLimits, TextInputLimits } from '@sapphire/discord-utilities'
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework'
import { colord, extend } from 'colord'
import namesPlugin from 'colord/plugins/names'
import { ButtonBuilder, ButtonStyle, type ModalSubmitInteraction } from 'discord.js'
import ow from 'ow'
import { Announcement } from '../schemas/Announcement.js'
import { buildAnnouncementEmbed } from '../utils/buildAnnouncement.js'
import hasValidColorFormat from '../utils/colorValidation.js'
import { temporaryImgStorage } from '../utils/Globals.js'
import { reply } from '../utils/reply.js'
import { validateModalInput } from '../utils/validateOptions.js'

// @ts-expect-error needs research
extend([namesPlugin])

const Schema = ow.object.exactShape({
  // name: ow.string.minLength(3).maxLength(16),
  // eslint-disable-next-line sort/object-properties
  description: ow.string.nonEmpty.maxLength(TextInputLimits.MaximumValueCharacters).message(() => 'commands:add-translation.descriptionMaxLength'),
  title: ow.optional.string.nonEmpty.maxLength(EmbedLimits.MaximumTitleLength).message(() => 'commands:add-translation.titleMaxLength'),
  footer: ow.optional.string.nonEmpty.maxLength(EmbedLimits.MaximumFooterLength).message(() => 'commands:add-translation.footerMaxLength'),
  url: ow.optional.string.nonEmpty.url.message(() => 'commands:add-translation.urlNotValid'),
  color: ow.optional.string.nonEmpty.validate((string) => ({
    message: () => 'commands:add.notValidColor',
    validator: hasValidColorFormat(string)
  }))
})

export class ModalHandler extends InteractionHandler {
  public constructor (context: InteractionHandler.LoaderContext, options: InteractionHandler.Options) {
    super(context, {
      ...options,
      interactionHandlerType: InteractionHandlerTypes.ModalSubmit
    })
  }

  public override parse (interaction: ModalSubmitInteraction) {
    if (!interaction.customId.startsWith('addAnnouncement:')) return this.none()
    return this.some()
  }

  public async run (interaction: ModalSubmitInteraction) {
    const options = await validateModalInput(interaction, Schema)
    if (!options) return
    const { description, footer, t, title, url } = options
    let { color } = options
    const name = interaction.customId.split(':').at(-1)
    const pastInteractionId = interaction.customId.split(':')[1]
    color &&= colord(color).toHex()

    const images = temporaryImgStorage.get(pastInteractionId)
    const newImages = images?.map((image) => ({ [image.type.toLowerCase()]: image.url }))
      .reduce((previous, current) => ({ ...previous, ...current }))

    const announcement = new Announcement({
      color,
      description,
      footer,
      guildId: interaction.guildId,
      name,
      title,
      url,
      ...newImages
    })
    await announcement.save()
    temporaryImgStorage.delete(pastInteractionId)

    await reply(interaction, {
      components: [new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`addField:${name}`) // TODO: change custom id to include more info
          .setEmoji('➕') // TODO: Change emoji to a custom one
          .setLabel(t('commands:addField.button'))
          .setStyle(ButtonStyle.Success)
      )],
      // TODO: Change text to reflect that the next embed is the announcement preview
      content: t('commands:add.done'),
      embeds: [buildAnnouncementEmbed(announcement)],
      type: 'positive'
    })
  }
}
