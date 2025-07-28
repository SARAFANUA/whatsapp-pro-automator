// src/database/repositories/WhatsappGroupRepository.js
const BaseRepository = require('./BaseRepository');

class WhatsappGroupRepository extends BaseRepository {
    constructor(dbManager, logger) {
        super(dbManager, logger);
        this.tableName = 'whatsapp_groups';
        this.logger.info(`[WhatsappGroupRepository] Initialized.`, { module: 'WhatsappGroupRepository' });
    }

    /**
     * Зберігає або оновлює інформацію про групу.
     * @param {string} id - ID групи.
     * @param {string} name - Назва групи.
     * @param {string} accountId - ID акаунта WhatsApp.
     * @returns {Promise<void>}
     */
    async saveOrUpdate(id, name, accountId) {
        const sql = `INSERT OR REPLACE INTO ${this.tableName} (id, name, accountId, lastUpdated) VALUES (?, ?, ?, DATETIME('now'))`;
        const params = [id, name, accountId];
        try {
            await this.run(sql, params, { module: 'WhatsappGroupRepository', groupId: id, accountId: accountId });
            this.logger.info(`[WhatsappGroupRepository] Group ${name} (${id}) saved/updated.`, { module: 'WhatsappGroupRepository', groupId: id, accountId: accountId });
        } catch (error) {
            this.logger.error(`[WhatsappGroupRepository] Failed to save/update group ${name} (${id}): ${error.message}`, { module: 'WhatsappGroupRepository', groupId: id, accountId: accountId, error: error });
            throw error;
        }
    }

    /**
     * Знаходить групу за ID.
     * @param {string} id - ID групи.
     * @param {string} accountId - ID акаунта WhatsApp.
     * @returns {Promise<object|null>} Знайдена група або null.
     */
    async findById(id, accountId) {
        const sql = `SELECT * FROM ${this.tableName} WHERE id = ? AND accountId = ?`;
        try {
            return await this.get(sql, [id, accountId], { module: 'WhatsappGroupRepository', groupId: id, accountId: accountId });
        } catch (error) {
            this.logger.error(`[WhatsappGroupRepository] Failed to find group ${id} for account ${accountId}: ${error.message}`, { module: 'WhatsappGroupRepository', groupId: id, accountId: accountId, error: error });
            throw error;
        }
    }

    /**
     * Знаходить всі групи для певного акаунта.
     * @param {string} accountId - ID акаунта WhatsApp.
     * @returns {Promise<Array<object>>} Масив груп.
     */
    async findAllByAccountId(accountId) {
        const sql = `SELECT * FROM ${this.tableName} WHERE accountId = ?`;
        try {
            return await this.all(sql, [accountId], { module: 'WhatsappGroupRepository', accountId: accountId });
        } catch (error) {
            this.logger.error(`[WhatsappGroupRepository] Failed to find all groups for account ${accountId}: ${error.message}`, { module: 'WhatsappGroupRepository', accountId: accountId, error: error });
            throw error;
        }
    }

    /**
     * Видаляє старі записи.
     * @param {number} retentionDays - Кількість днів для зберігання записів.
     * @returns {Promise<number>} Кількість видалених записів.
     */
    async cleanupOldRecords(retentionDays) {
        const sql = `DELETE FROM ${this.tableName} WHERE lastUpdated < DATETIME('now', ? || ' days')`;
        try {
            const result = await this.run(sql, [`-${retentionDays}`], { module: 'WhatsappGroupRepository' });
            this.logger.info(`[WhatsappGroupRepository] Deleted ${result.changes} old records (older than ${retentionDays} days).`, { module: 'WhatsappGroupRepository', deletedCount: result.changes });
            return result.changes;
        } catch (error) {
            this.logger.error(`[WhatsappGroupRepository] Failed to cleanup old records: ${error.message}`, { module: 'WhatsappGroupRepository', error: error });
            throw error;
        }
    }
}

module.exports = WhatsappGroupRepository;