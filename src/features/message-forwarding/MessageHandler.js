// src/features/message-forwarding/MessageHandler.js
const { MessageMedia } = require('whatsapp-web.js'); // Може знадобитися для пересилання медіа
const { normalizeMessageId } = require('../../utils/idNormalizer'); // Для нормалізації ID
const MessageFormatter = require('./MessageFormatter'); // Імпортуємо форматер
const FilterProcessor = require('./filters/FilterProcessor'); // Імпортуємо процесор фільтрів
const ReplyHandler = require('../reply-handling/ReplyHandler'); // Імпортуємо обробник відповідей (скоро реалізуємо)


class MessageHandler {
    constructor(logger, databaseManager, forwardingRuleRepository, messageMappingRepository, accountId) {
        this.logger = logger;
        this.databaseManager = databaseManager;
        this.forwardingRuleRepository = forwardingRuleRepository;
        this.messageMappingRepository = messageMappingRepository;
        this.accountId = accountId;

        this.messageFormatter = new MessageFormatter(); // Ініціалізуємо форматер
        this.filterProcessor = new FilterProcessor(logger); // Ініціалізуємо процесор фільтрів
        // Ініціалізуємо ReplyHandler
        this.replyHandler = new ReplyHandler(logger, databaseManager, messageMappingRepository, accountId);

        this.logger.info(`[MessageHandler] Initialized for account ${this.accountId}.`, { module: 'MessageHandler', accountId: this.accountId });
    }

    async processMessage(client, message) {
        this.logger.debug(`[MessageHandler] Processing message: ${message.id._serialized}`, { module: 'MessageHandler', accountId: this.accountId, messageId: message.id._serialized });

        // Ігноруємо системні, власні та відкликані повідомлення
        if (message.type === 'revoked' || message.fromMe) {
            this.logger.debug(`[MessageHandler] Ignoring system/self-sent/revoked message. Type: ${message.type}`, { module: 'MessageHandler', accountId: this.accountId, messageId: message.id._serialized });
            return;
        }

        const chat = await message.getChat();
        const sender = await message.getContact();
        const senderName = sender.pushname || sender.name || message.from;
        const messageTime = new Date(message.timestamp * 1000).toLocaleString('uk-UA', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
        const chatName = chat.isGroup ? chat.name : senderName;
        const sourceChatId = message.from;

        this.logger.info(`[MessageHandler] Received message in "${chatName}" (ID: ${sourceChatId}). Type: ${message.type}. Body: "${(message.body || '').substring(0, 50)}..."`, {
            module: 'MessageHandler',
            accountId: this.accountId,
            messageId: message.id._serialized,
            sourceChatId: sourceChatId
        });

        // --- ЛОГІКА ЗВОРОТНОГО ПЕРЕСИЛАННЯ ВІДПОВІДЕЙ ---
        if (message.hasQuotedMsg) {
            this.logger.debug(`[MessageHandler] Message has quoted message. Attempting reply forwarding.`, { module: 'MessageHandler', accountId: this.accountId, messageId: message.id._serialized });
            // Викликаємо обробник відповідей
            await this.replyHandler.handleReply(client, message, senderName, messageTime);
            // Якщо це була відповідь, яка успішно переслана, ми можемо не робити прямого пересилання,
            // залежно від бізнес-логіки. Для простоти, поки що дозволяємо і пряме пересилання.
        }
        // --- КІНЕЦЬ ЛОГІКИ ЗВОРОТНОГО ПЕРЕСИЛАННЯ ---


        // --- ПОЧАТОК ЛОГІКИ ПРЯМОГО ПЕРЕСИЛАННЯ ---
        const rules = await this.forwardingRuleRepository.findActiveRulesByAccountId(this.accountId);
        const applicableRule = rules.find(rule => rule.sourceId === sourceChatId);

        if (!applicableRule) {
            this.logger.info(`[MessageHandler] No active forwarding rule found for source chat ${sourceChatId}. Ignoring direct forward.`, { module: 'MessageHandler', accountId: this.accountId, sourceChatId: sourceChatId });
            return;
        }

        const destinationChatId = applicableRule.destinationId;
        let destinationChatName = destinationChatId;
        try {
            const destChatObj = await client.getChatById(destinationChatId);
            destinationChatName = destChatObj.isGroup ? destChatObj.name : destChatObj.id;
        } catch (err) {
            this.logger.error(`[MessageHandler] Failed to get name for destination chat ${destinationChatId}: ${err.message}`, { module: 'MessageHandler', accountId: this.accountId, destinationChatId: destinationChatId, error: err });
        }

        // 2. Застосувати фільтри
        if (!this.filterProcessor.applyFilters(message, applicableRule)) {
            this.logger.info(`[MessageHandler] Message from ${sourceChatId} filtered out by rule ${applicableRule.id}.`, { module: 'MessageHandler', accountId: this.accountId, messageId: message.id._serialized, sourceChatId: sourceChatId, ruleId: applicableRule.id });
            return;
        }

        this.logger.info(`[MessageHandler] Forwarding message from "${chatName}" (ID: ${sourceChatId}) -> to "${destinationChatName}" (ID: ${destinationChatId}). Type: ${message.type}.`, {
            module: 'MessageHandler',
            accountId: this.accountId,
            messageId: message.id._serialized,
            sourceChatId: sourceChatId,
            destinationChatId: destinationChatId
        });

        let forwardedMessage;
        try {
            let sendOptions = {};

            // 3. Форматування повідомлення (додаємо суфікс)
            const formattedContent = this.messageFormatter.formatContent(message, senderName, messageTime);

            if (message.hasMedia) {
                const media = await message.downloadMedia();
                if (media) {
                    let caption = formattedContent; // Використовуємо вже відформатований контент як підпис
                    if (message.type === 'document' || message.type === 'audio' || message.type === 'video') { // Додаткові типи медіа
                        // Для цих типів caption може бути порожнім або коротким,
                        // але суфікс додається. WWebJS додає медіа як окремий файл.
                        // Краще перевірити, чи WWebJS підтримує caption для всіх типів.
                        // В іншому випадку, суфікс буде частиною основного body, якщо це текст+медіа.
                        sendOptions.caption = caption;
                    } else if (message.type === 'image' || message.type === 'video') {
                        sendOptions.caption = caption;
                    }
                    forwardedMessage = await client.sendMessage(destinationChatId, media, sendOptions);
                }
            } else {
                forwardedMessage = await client.sendMessage(destinationChatId, formattedContent, sendOptions);
            }

            if (forwardedMessage) {
                this.logger.info(`[MessageHandler] Successfully forwarded message from "${chatName}" to "${destinationChatName}"!`, { module: 'MessageHandler', accountId: this.accountId, originalMsgId: message.id._serialized, forwardedMsgId: forwardedMessage.id._serialized });
                await this.messageMappingRepository.saveMapping(message.id._serialized, forwardedMessage.id._serialized, sourceChatId, destinationChatId, this.accountId);
            } else {
                this.logger.warn(`[MessageHandler] Failed to get forwarded message object after sending from ${sourceChatId} to ${destinationId}.`, { module: 'MessageHandler', accountId: this.accountId, originalMsgId: message.id._serialized });
            }

        } catch (error) {
            this.logger.error(`[MessageHandler] Error forwarding message from "${chatName}" to "${destinationChatName}": ${error.message}`, { module: 'MessageHandler', accountId: this.accountId, originalMsgId: message.id._serialized, error: error });
        }
        // --- КІНЕЦЬ ЛОГІКИ ПРЯМОГО ПЕРЕСИЛАННЯ ---
    }
}

module.exports = MessageHandler;