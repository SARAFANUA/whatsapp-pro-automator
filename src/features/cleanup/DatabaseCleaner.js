// src/features/cleanup/DatabaseCleaner.js
const logger = require('../../core/Logger');

/**
 * Видаляє старі записи з таблиць бази даних.
 * @param {object} databaseManager - Екземпляр DatabaseManager.
 * @param {number} messageMapRetentionDays - Кількість днів для зберігання записів message_map.
 * @param {number} groupsRetentionDays - Кількість днів для зберігання записів whatsapp_groups.
 * @returns {Promise<void>}
 */
async function cleanupOldRecords(databaseManager, messageMapRetentionDays, groupsRetentionDays) {
    const db = databaseManager.getDb();
    logger.info('[DB Cleanup] Starting old records cleanup...');

    // Очищення message_map
    const messageMapDeleteQuery = `DELETE FROM message_map WHERE timestamp < DATETIME('now', ? || ' days')`;
    await new Promise((resolve, reject) => {
        db.run(messageMapDeleteQuery, [`-${messageMapRetentionDays}`], function(err) {
            if (err) {
                logger.error(`[DB Cleanup] Error deleting old records from message_map: ${err.message}`, err);
                return reject(err);
            }
            logger.info(`[DB Cleanup] Deleted ${this.changes} old records from message_map (older than ${messageMapRetentionDays} days).`);
            resolve();
        });
    });

    // Очищення whatsapp_groups
    const groupsDeleteQuery = `DELETE FROM whatsapp_groups WHERE lastUpdated < DATETIME('now', ? || ' days')`;
    await new Promise((resolve, reject) => {
        db.run(groupsDeleteQuery, [`-${groupsRetentionDays}`], function(err) {
            if (err) {
                logger.error(`[DB Cleanup] Error deleting old records from whatsapp_groups: ${err.message}`, err);
                return reject(err);
            }
            logger.info(`[DB Cleanup] Deleted ${this.changes} old records from whatsapp_groups (older than ${groupsRetentionDays} days).`);
            resolve();
        });
    });
    logger.info('[DB Cleanup] Cleanup finished.');
}

module.exports = { cleanupOldRecords };