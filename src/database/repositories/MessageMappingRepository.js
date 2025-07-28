// src/database/repositories/MessageMappingRepository.js
const BaseRepository = require('./BaseRepository');

class MessageMappingRepository extends BaseRepository {
    constructor(dbManager, logger) {
        super(dbManager, logger);
        this.tableName = 'message_map';
        this.logger.info(`[MessageMappingRepository] Initialized.`, { module: 'MessageMappingRepository' });
    }

    /**
     * Зберігає відповідність між оригінальним та пересланим повідомленням.
     * @param {string} originalMsgId - ID оригінального повідомлення.
     * @param {string} forwardedMsgId - ID пересланого повідомлення.
     * @param {string} sourceChatId - ID чату, з якого надійшло оригінальне повідомлення.
     * @param {string} destinationChatId - ID чату, куди було переслано повідомлення.
     * @param {string} accountId - ID акаунта WhatsApp.
     * @returns {Promise<void>}
     */
    async saveMapping(originalMsgId, forwardedMsgId, sourceChatId, destinationChatId, accountId) {
        const sql = `INSERT INTO ${this.tableName} (original_msg_id, forwarded_msg_id, source_chat_id, destination_chat_id, accountId) VALUES (?, ?, ?, ?, ?)`;
        const params = [originalMsgId, forwardedMsgId, sourceChatId, destinationChatId, accountId];
        try {
            await this.run(sql, params, { module: 'MessageMappingRepository', accountId: accountId, originalMsgId: originalMsgId, forwardedMsgId: forwardedMsgId });
            this.logger.info(`[MessageMappingRepository] Mapping saved: Original ID: ${originalMsgId}, Forwarded ID: ${forwardedMsgId}`, { module: 'MessageMappingRepository', accountId: accountId });
        } catch (error) {
            this.logger.error(`[MessageMappingRepository] Failed to save mapping: Original ID: ${originalMsgId}, Forwarded ID: ${forwardedMsgId}: ${error.message}`, { module: 'MessageMappingRepository', accountId: accountId, originalMsgId: originalMsgId, forwardedMsgId: forwardedMsgId, error: error });
            throw error;
        }
    }

    /**
     * Знаходить відповідне оригінальне повідомлення за ID пересланого повідомлення.
     * @param {string} forwardedMsgId - ID пересланого повідомлення.
     * @param {string} destinationChatId - ID чату, де знаходиться переслане повідомлення.
     * @param {string} accountId - ID акаунта WhatsApp.
     * @returns {Promise<{original_msg_id: string, source_chat_id: string} | null>} - Об'єкт з ID оригінального повідомлення та ID вихідного чату, або null.
     */
    async getOriginalMapping(forwardedMsgId, destinationChatId, accountId) {
        const sql = `SELECT original_msg_id, source_chat_id FROM ${this.tableName} WHERE forwarded_msg_id = ? AND destination_chat_id = ? AND accountId = ?`;
        try {
            return await this.get(sql, [forwardedMsgId, destinationChatId, accountId], { module: 'MessageMappingRepository', accountId: accountId, forwardedMsgId: forwardedMsgId });
        } catch (error) {
            this.logger.error(`[MessageMappingRepository] Failed to get original mapping for forwarded ID ${forwardedMsgId}: ${error.message}`, { module: 'MessageMappingRepository', accountId: accountId, forwardedMsgId: forwardedMsgId, error: error });
            throw error;
        }
    }

    /**
     * Видаляє старі записи.
     * @param {number} retentionDays - Кількість днів для зберігання записів.
     * @returns {Promise<number>} Кількість видалених записів.
     */
    async cleanupOldRecords(retentionDays) {
        const sql = `DELETE FROM ${this.tableName} WHERE timestamp < DATETIME('now', ? || ' days')`;
        try {
            const result = await this.run(sql, [`-${retentionDays}`], { module: 'MessageMappingRepository' });
            this.logger.info(`[MessageMappingRepository] Deleted ${result.changes} old records (older than ${retentionDays} days).`, { module: 'MessageMappingRepository', deletedCount: result.changes });
            return result.changes;
        } catch (error) {
            this.logger.error(`[MessageMappingRepository] Failed to cleanup old records: ${error.message}`, { module: 'MessageMappingRepository', error: error });
            throw error;
        }
    }
}

module.exports = MessageMappingRepository;