// src/features/reply-handling/ReplyHandler.js
const { normalizeMessageId } = require('../../utils/idNormalizer'); // Для нормалізації ID

class ReplyHandler {
    constructor(logger, databaseManager, messageMappingRepository, accountId) {
        this.logger = logger;
        this.databaseManager = databaseManager;
        this.messageMappingRepository = messageMappingRepository;
        this.accountId = accountId;
        this.logger.info(`[ReplyHandler] Initialized for account ${this.accountId}.`, { module: 'ReplyHandler', accountId: this.accountId });
    }

    /**
     * Обробляє відповідь на переслане повідомлення.
     * @param {object} client - Інстанс WhatsApp-web.js клієнта.
     * @param {object} message - Об'єкт відповіді (повідомлення, що цитує інше).
     * @param {string} senderName - Ім'я відправника відповіді.
     * @param {string} messageTime - Час відповіді.
     * @returns {Promise<void>}
     */
    async handleReply(client, message, senderName, messageTime) {
        if (!message.hasQuotedMsg) {
            this.logger.warn(`[ReplyHandler] handleReply called for message without quoted message. Ignoring.`, { module: 'ReplyHandler', accountId: this.accountId, messageId: message.id._serialized });
            return;
        }

        try {
            const quotedMessage = await message.getQuotedMessage();
            const normalizedQuotedMsgId = normalizeMessageId(quotedMessage.id._serialized);

            this.logger.info(`[ReplyHandler] Received reply. Quoted ID: "${normalizedQuotedMsgId}". Original Chat: ${message.from}. Body: "${(message.body || '').substring(0, 50)}..."`, {
                module: 'ReplyHandler',
                accountId: this.accountId,
                messageId: message.id._serialized,
                quotedMsgId: normalizedQuotedMsgId
            });

            // Знаходимо оригінальне повідомлення за маппінгом
            const mapping = await this.messageMappingRepository.getOriginalMapping(normalizedQuotedMsgId, message.from, this.accountId);

            if (mapping) {
                const originalSourceChatId = mapping.source_chat_id;
                const originalMsgIdForReply = mapping.original_msg_id;

                // Перевіряємо, чи ця відповідь призначена для SPECIFIC_REPLY_SOURCE_GROUP_ID (якщо використовується)
                // Ця логіка може бути узагальнена або перенесена в правила пересилання
                // За замовчуванням, пересилаємо назад, якщо знайшли маппінг
                this.logger.info(`[ReplyHandler] Found mapping. Original message ID: "${originalMsgIdForReply}" in group "${originalSourceChatId}". Forwarding reply.`, { module: 'ReplyHandler', accountId: this.accountId, originalMsgId: originalMsgIdForReply, sourceChatId: originalSourceChatId });

                let replyContent = message.body;
                let replySendOptions = { quotedMessageId: originalMsgIdForReply }; // Відповідаємо цитуванням

                if (message.hasMedia) {
                    const media = await message.downloadMedia();
                    if (media) {
                        if (message.body && message.body.trim()) {
                            replySendOptions.caption = message.body;
                        }
                        await client.sendMessage(originalSourceChatId, media, replySendOptions);
                        this.logger.info(`[ReplyHandler] Media reply successfully forwarded back to "${originalSourceChatId}" with citation.`, { module: 'ReplyHandler', accountId: this.accountId, originalMsgId: originalMsgIdForReply, sourceChatId: originalSourceChatId });
                    }
                } else {
                    await client.sendMessage(originalSourceChatId, replyContent, replySendOptions);
                    this.logger.info(`[ReplyHandler] Text reply successfully forwarded back to "${originalSourceChatId}" with citation.`, { module: 'ReplyHandler', accountId: this.accountId, originalMsgId: originalMsgIdForReply, sourceChatId: originalSourceChatId });
                }
            } else {
                this.logger.warn(`[ReplyHandler] No mapping found for quoted message "${normalizedQuotedMsgId}" in chat "${message.from}". Reply not forwarded.`, { module: 'ReplyHandler', accountId: this.accountId, quotedMsgId: normalizedQuotedMsgId, currentChatId: message.from });
            }
        } catch (error) {
            this.logger.error(`[ReplyHandler] Error processing reply in chat "${message.from}": ${error.message}`, { module: 'ReplyHandler', accountId: this.accountId, messageId: message.id._serialized, error: error });
        }
    }
}

module.exports = ReplyHandler;