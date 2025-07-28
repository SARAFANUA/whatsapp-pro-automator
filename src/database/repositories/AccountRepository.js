// src/database/repositories/AccountRepository.js
const BaseRepository = require('./BaseRepository');

class AccountRepository extends BaseRepository {
    constructor(dbManager, logger) {
        super(dbManager, logger);
        this.tableName = 'accounts';
        this.logger.info(`[AccountRepository] Initialized.`, { module: 'AccountRepository' });
    }

    /**
     * Зберігає новий акаунт або оновлює існуючий.
     * @param {object} accountData - Дані акаунта (id, sessionPath, status, etc.).
     * @returns {Promise<object>} Збережений/оновлений акаунт.
     */
    async saveOrUpdate(accountData) {
        const { id, sessionPath, status, lastActivity } = accountData;
        const sql = `INSERT OR REPLACE INTO ${this.tableName} (id, sessionPath, status, lastActivity, createdAt, updatedAt)
                     VALUES (?, ?, ?, ?, COALESCE((SELECT createdAt FROM ${this.tableName} WHERE id = ?), DATETIME('now')), DATETIME('now'))`;
        const params = [id, sessionPath, status, lastActivity || new Date().toISOString(), id];
        try {
            await this.run(sql, params, { module: 'AccountRepository', accountId: id });
            this.logger.info(`[AccountRepository] Account ${id} saved/updated successfully.`, { module: 'AccountRepository', accountId: id });
            return await this.findById(id);
        } catch (error) {
            this.logger.error(`[AccountRepository] Failed to save/update account ${id}: ${error.message}`, { module: 'AccountRepository', accountId: id, error: error });
            throw error;
        }
    }

    /**
     * Знаходить акаунт за ID.
     * @param {string} id - ID акаунта.
     * @returns {Promise<object|null>} Знайдений акаунт або null.
     */
    async findById(id) {
        const sql = `SELECT * FROM ${this.tableName} WHERE id = ?`;
        try {
            return await this.get(sql, [id], { module: 'AccountRepository', accountId: id });
        } catch (error) {
            this.logger.error(`[AccountRepository] Failed to find account ${id}: ${error.message}`, { module: 'AccountRepository', accountId: id, error: error });
            throw error;
        }
    }

    /**
     * Знаходить всі акаунти.
     * @returns {Promise<Array<object>>} Масив акаунтів.
     */
    async findAll() {
        const sql = `SELECT * FROM ${this.tableName}`;
        try {
            return await this.all(sql, [], { module: 'AccountRepository' });
        } catch (error) {
            this.logger.error(`[AccountRepository] Failed to find all accounts: ${error.message}`, { module: 'AccountRepository', error: error });
            throw error;
        }
    }

    /**
     * Оновлює статус акаунта.
     * @param {string} id - ID акаунта.
     * @param {string} status - Новий статус.
     * @returns {Promise<void>}
     */
    async updateStatus(id, status) {
        const sql = `UPDATE ${this.tableName} SET status = ?, updatedAt = DATETIME('now') WHERE id = ?`;
        try {
            await this.run(sql, [status, id], { module: 'AccountRepository', accountId: id, status: status });
            this.logger.info(`[AccountRepository] Account ${id} status updated to ${status}.`, { module: 'AccountRepository', accountId: id, status: status });
        } catch (error) {
            this.logger.error(`[AccountRepository] Failed to update status for account ${id}: ${error.message}`, { module: 'AccountRepository', accountId: id, status: status, error: error });
            throw error;
        }
    }

    /**
     * Видаляє акаунт за ID.
     * @param {string} id - ID акаунта.
     * @returns {Promise<void>}
     */
    async deleteById(id) {
        const sql = `DELETE FROM ${this.tableName} WHERE id = ?`;
        try {
            await this.run(sql, [id], { module: 'AccountRepository', accountId: id });
            this.logger.info(`[AccountRepository] Account ${id} deleted successfully.`, { module: 'AccountRepository', accountId: id });
        } catch (error) {
            this.logger.error(`[AccountRepository] Failed to delete account ${id}: ${error.message}`, { module: 'AccountRepository', accountId: id, error: error });
            throw error;
        }
    }
}

module.exports = AccountRepository;