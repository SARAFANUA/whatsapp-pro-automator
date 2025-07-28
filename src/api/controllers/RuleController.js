// src/api/controllers/RuleController.js
const ForwardingRuleRepository = require('../../database/repositories/ForwardingRuleRepository'); // Імпортуємо репозиторій

const RuleController = {
    // req.app.logger та req.app.accountManager доступні завдяки middleware в api/index.js

    async addRule(req, res) {
        const logger = req.app.logger;
        const databaseManager = req.app.accountManager.databaseManager; // Отримуємо dbManager з accountManager
        const ruleRepository = new ForwardingRuleRepository(databaseManager, logger); // Ініціалізуємо репозиторій тут
        const { accountId, sourceId, destinationId, filterType, filterValue, isActive } = req.body;

        if (!accountId || !sourceId || !destinationId) {
            return res.status(400).json({ success: false, error: 'accountId, sourceId, and destinationId are required.' });
        }

        try {
            logger.info(`[API] Request to add new rule for account ${accountId}: from ${sourceId} to ${destinationId}.`, { module: 'RuleController', accountId: accountId });
            const newRule = await ruleRepository.addRule({ accountId, sourceId, destinationId, filterType, filterValue, isActive });
            res.status(201).json({ success: true, data: newRule });
        } catch (error) {
            logger.error(`[API] Error adding rule: ${error.message}`, { module: 'RuleController', accountId: accountId, error: error });
            res.status(500).json({ success: false, error: error.message });
        }
    },

    async getRulesByAccount(req, res) {
        const logger = req.app.logger;
        const databaseManager = req.app.accountManager.databaseManager;
        const ruleRepository = new ForwardingRuleRepository(databaseManager, logger);
        const { accountId } = req.params;

        try {
            logger.info(`[API] Request to get rules for account: ${accountId}.`, { module: 'RuleController', accountId: accountId });
            const rules = await ruleRepository.findActiveRulesByAccountId(accountId); // Отримуємо активні правила
            res.json({ success: true, data: rules });
        } catch (error) {
            logger.error(`[API] Error getting rules for account ${accountId}: ${error.message}`, { module: 'RuleController', accountId: accountId, error: error });
            res.status(500).json({ success: false, error: error.message });
        }
    },

    async updateRule(req, res) {
        const logger = req.app.logger;
        const databaseManager = req.app.accountManager.databaseManager;
        const ruleRepository = new ForwardingRuleRepository(databaseManager, logger);
        const { ruleId } = req.params;
        const updates = req.body;

        try {
            logger.info(`[API] Request to update rule ${ruleId} with updates:`, { module: 'RuleController', ruleId: ruleId, updates: updates });
            const existingRule = await ruleRepository.findById(ruleId);
            if (!existingRule) {
                return res.status(404).json({ success: false, error: `Rule with ID ${ruleId} not found.` });
            }
            await ruleRepository.updateRule(ruleId, updates);
            const updatedRule = await ruleRepository.findById(ruleId);
            res.json({ success: true, data: updatedRule });
        } catch (error) {
            logger.error(`[API] Error updating rule ${ruleId}: ${error.message}`, { module: 'RuleController', ruleId: ruleId, updates: updates, error: error });
            res.status(500).json({ success: false, error: error.message });
        }
    },

    async deleteRule(req, res) {
        const logger = req.app.logger;
        const databaseManager = req.app.accountManager.databaseManager;
        const ruleRepository = new ForwardingRuleRepository(databaseManager, logger);
        const { ruleId } = req.params;

        try {
            logger.info(`[API] Request to delete rule: ${ruleId}.`, { module: 'RuleController', ruleId: ruleId });
            const existingRule = await ruleRepository.findById(ruleId);
            if (!existingRule) {
                return res.status(404).json({ success: false, error: `Rule with ID ${ruleId} not found.` });
            }
            await ruleRepository.deleteRuleById(ruleId);
            res.json({ success: true, message: `Rule ${ruleId} deleted.` });
        } catch (error) {
            logger.error(`[API] Error deleting rule ${ruleId}: ${error.message}`, { module: 'RuleController', ruleId: ruleId, error: error });
            res.status(500).json({ success: false, error: error.message });
        }
    }
};

module.exports = RuleController;