import { InteractionHandler, InteractionHandlerTypes, PieceContext } from '@sapphire/framework'
import { fetchT } from '@sapphire/plugin-i18next'
import { ButtonInteraction, HexColorString, MessageEmbed } from 'discord.js'
import { Announcement } from '../schemas/Announcement'

export class ButtonHandler extends InteractionHandler {
  public constructor (context: PieceContext, options: InteractionHandler.Options) {
    super(context, {
      ...options,
      interactionHandlerType: InteractionHandlerTypes.Button
    })
  }

  public override async run (interaction: ButtonInteraction, result: InteractionHandler.ParseResult<this>) {
    return await interaction.reply(result)
  }

  public override async parse (interaction: ButtonInteraction) {
    const t = await fetchT(interaction)
    const translationId = interaction.customId

    const announcement = await Announcement.findOne({ 'translations._id': translationId }).exec()
    if (!announcement) return this.some({ content: t('common:announcementNotFound'), ephemeral: true })

    const translation = announcement
      .translations.find(translation => translation._id?.toString() === translationId)
    if (!translation) return this.some({ content: t('common:translationNotFound'), ephemeral: true })

    const embed = new MessageEmbed()
      .setColor(announcement.color as HexColorString ?? 'BLURPLE')
    if (translation.title) embed.setTitle(translation.title)
    if (translation.description) embed.setDescription(translation.description)
    if (translation.footer) embed.setFooter({ text: translation.footer })
    if (translation.url && translation.title) embed.setURL(translation.url)

    return this.some({
      embeds: [embed],
      ephemeral: true
    })
  }
}
