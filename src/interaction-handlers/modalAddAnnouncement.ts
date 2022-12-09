import { EmbedLimits, TextInputLimits } from '@sapphire/discord-utilities'
import { InteractionHandler, InteractionHandlerTypes, PieceContext } from '@sapphire/framework'
import { colord, extend, getFormat } from 'colord'
import namesPlugin from 'colord/plugins/names'
import type { ModalSubmitInteraction } from 'discord.js'
import ow from 'ow'
import { Announcement } from '../schemas/Announcement'
import { validaModalInput } from '../utils/validateOptions'

extend([namesPlugin])
const validColorTypes = new Set(['name', 'hex', 'rbg', 'hsl', 'hsv'])
const isValidColorFormat = (color: string) => !!getFormat(color) && validColorTypes.has(getFormat(color) ?? '')

const Schema = ow.object.exactShape({
  // name: ow.string.minLength(3).maxLength(15),
  // eslint-disable-next-line sort/object-properties
  description: ow.string.nonEmpty.maxLength(TextInputLimits.MaximumValueCharacters).message(() => 'commands:add-translation.descriptionNotSended'),
  title: ow.optional.string.nonEmpty.maxLength(EmbedLimits.MaximumTitleLength).message(() => 'commands:add-translation.titleMaxLength'),
  footer: ow.optional.string.nonEmpty.maxLength(EmbedLimits.MaximumFooterLength).message(() => 'commands:add-translation.footerMaxLength'),
  url: ow.optional.string.nonEmpty.url.message(() => 'commands:add-translation.urlNotValid'),
  color: ow.optional.string.nonEmpty.validate((string) => ({
    message: () => 'commands:add.notValidColor',
    validator: isValidColorFormat(string)
  }))
})

export class ModalHandler extends InteractionHandler {
  public constructor (context: PieceContext, options: InteractionHandler.Options) {
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
    const options = await validaModalInput(interaction, Schema)
    if (!options) return
    let { color, description, footer, t, title, url } = options
    const name = interaction.customId.split(':').at(-1)
    color &&= colord(color).toHex()

    const announcement = new Announcement({
      color,
      description,
      footer,
      guildId: interaction.guildId,
      name,
      title,
      url
    })
    await announcement.save()
    return await interaction.reply({ content: t('commands:add.done') })
  }
}