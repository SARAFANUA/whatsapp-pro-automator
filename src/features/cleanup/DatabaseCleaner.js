// src/features/cleanup/DatabaseCleaner.js
// const logger = require('../../core/Logger'); // !!! ЦЕЙ РЯДОК НЕ ПОТРІБЕН, ЛОГЕР БУДЕ ПЕРЕДАВАТИСЯ !!!

/**
 * Видаляє старі записи з таблиць бази даних.
 * @param {object} loggerInstance - Екземпляр логера.
 * @param {object} databaseManager - Екземпляр DatabaseManager.
 * @param {number} messageMapRetentionDays - Кількість днів для зберігання записів message_map.
 * @param {number} groupsRetentionDays - Кількість днів для зберігання записів whatsapp_groups.
 * @returns {Promise<void>}
 */
async function cleanupOldRecords(loggerInstance, databaseManager, messageMapRetentionDays, groupsRetentionDays) {
    const db = databaseManager.getDb();
    loggerInstance.info('[DB Cleanup] Starting old records cleanup...', { module: 'DBCleanup' }); // Використовуємо loggerInstance

    const messageMapDeleteQuery = `DELETE FROM message_map WHERE timestamp < DATETIME('now', ? || ' days')`;
    await new Promise((resolve, reject) => {
        db.run(messageMapDeleteQuery, [`-${messageMapRetentionDays}`], function(err) {
            if (err) {
                loggerInstance.error(`[DB Cleanup] Error deleting old records from message_map: ${err.message}`, { module: 'DBCleanup', error: err });
                return reject(err);
            }
            loggerInstance.info(`[DB Cleanup] Deleted ${this.changes} old records from message_map (older than ${messageMapRetentionDays} days).`, { module: 'DBCleanup' });
            resolve();
        });
    });

    const groupsDeleteQuery = `DELETE FROM whatsapp_groups WHERE lastUpdated < DATETIME('now', ? || ' days')`;
    await new Promise((resolve, reject) => {
        db.run(groupsDeleteQuery, [`-${groupsRetentionDays}`], function(err) {
            if (err) {
                loggerInstance.error(`[DB Cleanup] Error deleting old records from whatsapp_groups: ${err.message}`, { module: 'DBCleanup', error: err });
                return reject(err);
            }
            loggerInstance.info(`[DB Cleanup] Deleted ${this.changes} old records from whatsapp_groups (older than ${groupsRetentionDays} days).`, { module: 'DBCleanup' });
            resolve();
        });
    });
    loggerInstance.info('[DB Cleanup] Cleanup finished.', { module: 'DBCleanup' });
}

module.exports = { cleanupOldRecords };