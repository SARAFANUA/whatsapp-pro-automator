// src/database/repositories/BaseRepository.js
class BaseRepository {
    constructor(dbManager, logger) {
        if (!dbManager) throw new Error("DatabaseManager is required for BaseRepository.");
        if (!logger) throw new Error("Logger is required for BaseRepository.");

        this.db = dbManager.getDb();
        this.logger = logger;
        this.dbManager = dbManager; // Зберігаємо для доступу до інших функцій, якщо потрібно
    }

    /**
     * Виконує SQL-запит (INSERT, UPDATE, DELETE).
     * @param {string} sql - SQL-запит.
     * @param {Array<any>} params - Параметри запиту.
     * @param {object} logMeta - Додаткові метадані для логування.
     * @returns {Promise<object>} Результат виконання запиту.
     */
    run(sql, params = [], logMeta = {}) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    this.logger.error(`[DB] Error executing run query: ${sql}`, { ...logMeta, error: err });
                    return reject(err);
                }
                resolve({ id: this.lastID, changes: this.changes });
            });
        });
    }

    /**
     * Виконує SQL-запит і повертає один рядок.
     * @param {string} sql - SQL-запит.
     * @param {Array<any>} params - Параметри запиту.
     * @param {object} logMeta - Додаткові метадані для логування.
     * @returns {Promise<object|null>} Один рядок або null, якщо не знайдено.
     */
    get(sql, params = [], logMeta = {}) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    this.logger.error(`[DB] Error executing get query: ${sql}`, { ...logMeta, error: err });
                    return reject(err);
                }
                resolve(row);
            });
        });
    }

    /**
     * Виконує SQL-запит і повертає всі рядки.
     * @param {string} sql - SQL-запит.
     * @param {Array<any>} params - Параметри запиту.
     * @param {object} logMeta - Додаткові метадані для логування.
     * @returns {Promise<Array<object>>} Масив рядків.
     */
    all(sql, params = [], logMeta = {}) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    this.logger.error(`[DB] Error executing all query: ${sql}`, { ...logMeta, error: err });
                    return reject(err);
                }
                resolve(rows);
            });
        });
    }
}

module.exports = BaseRepository;