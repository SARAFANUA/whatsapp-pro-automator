// src/database/repositories/ForwardingRuleRepository.js
const BaseRepository = require('./BaseRepository');

class ForwardingRuleRepository extends BaseRepository {
    constructor(dbManager, logger) {
        super(dbManager, logger);
        this.tableName = 'forwarding_rules';
        this.logger.info(`[ForwardingRuleRepository] Initialized.`, { module: 'ForwardingRuleRepository' });
    }

    /**
     * Додає нове правило пересилання.
     * @param {object} ruleData - Дані правила (accountId, sourceId, destinationId, filterType, filterValue, isActive).
     * @returns {Promise<object>} Додане правило.
     */
    async addRule(ruleData) {
        const { accountId, sourceId, destinationId, filterType = 'none', filterValue = '', isActive = true } = ruleData;
        const sql = `INSERT INTO ${this.tableName} (accountId, sourceId, destinationId, filterType, filterValue, isActive) VALUES (?, ?, ?, ?, ?, ?)`;
        const params = [accountId, sourceId, destinationId, filterType, filterValue, isActive ? 1 : 0];
        try {
            const result = await this.run(sql, params, { module: 'ForwardingRuleRepository', accountId: accountId, sourceId: sourceId, destinationId: destinationId });
            const newRule = await this.findById(result.id);
            this.logger.info(`[ForwardingRuleRepository] Rule added: ID ${newRule.id} from ${sourceId} to ${destinationId}.`, { module: 'ForwardingRuleRepository', accountId: accountId, ruleId: newRule.id });
            return newRule;
        } catch (error) {
            this.logger.error(`[ForwardingRuleRepository] Failed to add rule from ${sourceId} to ${destinationId}: ${error.message}`, { module: 'ForwardingRuleRepository', accountId: accountId, sourceId: sourceId, destinationId: destinationId, error: error });
            throw error;
        }
    }

    /**
     * Знаходить правило за ID.
     * @param {number} id - ID правила.
     * @returns {Promise<object|null>} Знайдене правило або null.
     */
    async findById(id) {
        const sql = `SELECT * FROM ${this.tableName} WHERE id = ?`;
        try {
            return await this.get(sql, [id], { module: 'ForwardingRuleRepository', ruleId: id });
        } catch (error) {
            this.logger.error(`[ForwardingRuleRepository] Failed to find rule by ID ${id}: ${error.message}`, { module: 'ForwardingRuleRepository', ruleId: id, error: error });
            throw error;
        }
    }

    /**
     * Знаходить всі активні правила для певного акаунта.
     * @param {string} accountId - ID акаунта.
     * @returns {Promise<Array<object>>} Масив правил.
     */
    async findActiveRulesByAccountId(accountId) {
        const sql = `SELECT * FROM ${this.tableName} WHERE accountId = ? AND isActive = 1`;
        try {
            return await this.all(sql, [accountId], { module: 'ForwardingRuleRepository', accountId: accountId });
        } catch (error) {
            this.logger.error(`[ForwardingRuleRepository] Failed to find active rules for account ${accountId}: ${error.message}`, { module: 'ForwardingRuleRepository', accountId: accountId, error: error });
            throw error;
        }
    }

    /**
     * Оновлює правило.
     * @param {number} id - ID правила.
     * @param {object} updates - Об'єкт з полями для оновлення.
     * @returns {Promise<void>}
     */
    async updateRule(id, updates) {
        const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        const params = Object.values(updates);
        params.push(id);
        const sql = `UPDATE ${this.tableName} SET ${fields}, updatedAt = DATETIME('now') WHERE id = ?`;
        try {
            await this.run(sql, params, { module: 'ForwardingRuleRepository', ruleId: id, updates: updates });
            this.logger.info(`[ForwardingRuleRepository] Rule ${id} updated.`, { module: 'ForwardingRuleRepository', ruleId: id });
        } catch (error) {
            this.logger.error(`[ForwardingRuleRepository] Failed to update rule ${id}: ${error.message}`, { module: 'ForwardingRuleRepository', ruleId: id, updates: updates, error: error });
            throw error;
        }
    }

    /**
     * Видаляє правило за ID.
     * @param {number} id - ID правила.
     * @returns {Promise<void>}
     */
    async deleteRuleById(id) {
        const sql = `DELETE FROM ${this.tableName} WHERE id = ?`;
        try {
            await this.run(sql, [id], { module: 'ForwardingRuleRepository', ruleId: id });
            this.logger.info(`[ForwardingRuleRepository] Rule ${id} deleted.`, { module: 'ForwardingRuleRepository', ruleId: id });
        } catch (error) {
            this.logger.error(`[ForwardingRuleRepository] Failed to delete rule ${id}: ${error.message}`, { module: 'ForwardingRuleRepository', ruleId: id, error: error });
            throw error;
        }
    }
}

module.exports = ForwardingRuleRepository;