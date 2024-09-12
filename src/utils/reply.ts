import { CommandInteraction, InteractionReplyOptions, MessageEditOptions, ModalSubmitInteraction } from 'discord.js'
import config from '../../config.json' assert { type: 'json' }
import convertHexStringToInt from './convertHexStringToInt.js'

type AdditionalOptions = (MessageEditOptions | InteractionReplyOptions) & {
  type: keyof typeof config.colors
  content: string
}

/**
 * Creates the content of the reply without replying
 * @param options Options for the reply
 * @param isEdit Optional paramater to request the content of an edit
 * @returns Content of the reply
 */
export function getReplyContent (options: MessageEditOptions & AdditionalOptions, isEdit: true): MessageEditOptions
export function getReplyContent (options: InteractionReplyOptions & AdditionalOptions): InteractionReplyOptions
export function getReplyContent (options: AdditionalOptions, isEdit = false) {
  const { content, embeds, type, ...otherOptions } = options

  if (!isEdit) {
    (otherOptions as InteractionReplyOptions).ephemeral = type === 'negative' ? true : !!(otherOptions as InteractionReplyOptions).ephemeral
  }

  return {
    ...otherOptions as object,
    embeds: [
      {
        color: convertHexStringToInt(config.colors[type]),
        description: content
      },
      ...(embeds ?? [])
    ]
  }
}

export async function reply (interaction: ModalSubmitInteraction | CommandInteraction, options: InteractionReplyOptions & AdditionalOptions) {
  return await interaction.reply(getReplyContent(options))
}
