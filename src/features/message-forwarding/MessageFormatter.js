// src/features/message-forwarding/MessageFormatter.js

class MessageFormatter {
    constructor() {
        // Конструктор поки що порожній, але можна додати налаштування форматування з config
    }

    /**
     * Формує суфікс для пересланого повідомлення.
     * @param {object} options - Об'єкт з опціями: senderName, messageTime, isReply.
     * @returns {string} Сформований суфікс.
     */
    buildSuffix({ senderName, messageTime, isReply }) {
        const separatorLine = '______________________________';
        // Для відповідей суфікс не додаємо, як ти раніше вказував.
        return isReply ? '' : `\n${separatorLine}\n*Від:* ${senderName}\n*Час:* ${messageTime}`;
    }

    /**
     * Форматує контент повідомлення, додаючи суфікс, якщо потрібно.
     * @param {object} message - Об'єкт повідомлення whatsapp-web.js.
     * @param {string} senderName - Ім'я відправника.
     * @param {string} messageTime - Час повідомлення у відформатованому вигляді.
     * @returns {string} Відформатований контент повідомлення.
     */
    formatContent(message, senderName, messageTime) {
        const suffix = this.buildSuffix({ senderName, messageTime, isReply: message.hasQuotedMsg });
        return `${message.body || ''}${suffix}`;
    }
}

module.exports = MessageFormatter;