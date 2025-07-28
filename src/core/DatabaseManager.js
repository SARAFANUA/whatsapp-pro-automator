// src/core/DatabaseManager.js
const sqlite3 = require('sqlite3').verbose();
const logger = require('./Logger'); // Правильний шлях до логера
const config = require('../../config'); // Правильний шлях до конфігурації

let dbInstance = null;

class DatabaseManager {
    constructor(dbPath) { // Тепер шлях до БД передається як аргумент
        this.dbPath = dbPath;
        this.db = null;
        logger.info('[DB] DatabaseManager instance created.'); // Тепер це лог створення, а не ініціалізації
    }

    /**
     * Ініціалізує з'єднання з базою даних.
     * @returns {Promise<sqlite3.Database>}
     */
    async initialize() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    logger.error(`[DB] Failed to connect to database at ${this.dbPath}:`, err.message);
                    return reject(err);
                }
                logger.info(`[DB] Connected to database at ${this.dbPath}`);
                this.setupSchema().then(resolve).catch(reject);
            });
        });
    }

    /**
     * Ініціалізує схему бази даних (створює таблиці, якщо їх немає).
     * @returns {Promise<void>}
     */
    async setupSchema() {
        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                // Таблиця для акаунтів WhatsApp
                this.db.run(`CREATE TABLE IF NOT EXISTS accounts (
                    id TEXT PRIMARY KEY,
                    sessionPath TEXT NOT NULL UNIQUE,
                    status TEXT NOT NULL DEFAULT 'disconnected',
                    lastActivity DATETIME DEFAULT CURRENT_TIMESTAMP,
                    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
                )`, (err) => {
                    if (err) {
                        logger.error('[DB] Error creating accounts table:', err);
                        return reject(err);
                    }
                    logger.info('[DB] Table "accounts" checked/created successfully.');
                });

                // Таблиця для відповідності пересланих повідомлень
                this.db.run(`CREATE TABLE IF NOT EXISTS message_map (
                    original_msg_id TEXT PRIMARY KEY,
                    forwarded_msg_id TEXT NOT NULL,
                    source_chat_id TEXT NOT NULL,
                    destination_chat_id TEXT NOT NULL,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    accountId TEXT,
                    FOREIGN KEY (accountId) REFERENCES accounts(id) ON DELETE CASCADE
                )`, (err) => {
                    if (err) {
                        logger.error('[DB] Error creating message_map table:', err);
                        return reject(err);
                    }
                    logger.info('[DB] Table "message_map" checked/created successfully.');
                });

                // Таблиця для списку груп
                this.db.run(`CREATE TABLE IF NOT EXISTS whatsapp_groups (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    accountId TEXT,
                    lastUpdated DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (accountId) REFERENCES accounts(id) ON DELETE CASCADE
                )`, (err) => {
                    if (err) {
                        logger.error('[DB] Error creating whatsapp_groups table:', err);
                        return reject(err);
                    }
                    logger.info('[DB] Table "whatsapp_groups" checked/created successfully.');
                });

                // Таблиця для правил пересилання
                this.db.run(`CREATE TABLE IF NOT EXISTS forwarding_rules (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    accountId TEXT NOT NULL,
                    sourceId TEXT NOT NULL,
                    destinationId TEXT NOT NULL,
                    filterType TEXT DEFAULT 'none', -- e.g., 'text', 'media', 'regex'
                    filterValue TEXT DEFAULT '',
                    isActive BOOLEAN NOT NULL DEFAULT 1,
                    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (accountId) REFERENCES accounts(id) ON DELETE CASCADE
                )`, (err) => {
                    if (err) {
                        logger.error('[DB] Error creating forwarding_rules table:', err);
                        return reject(err);
                    }
                    logger.info('[DB] Table "forwarding_rules" checked/created successfully.');
                    resolve(); // Resolve after all tables are created
                });
            });
        });
    }

    /**
     * Отримує екземпляр бази даних.
     * @returns {sqlite3.Database}
     */
    getDb() {
        if (!this.db) {
            logger.error('[DB] Database not initialized. Call initialize() first.');
            throw new Error('Database not initialized.');
        }
        return this.db;
    }

    /**
     * Закриває з'єднання з базою даних.
     * @returns {Promise<void>}
     */
    async close() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        logger.error('[DB] Error closing database:', err.message);
                        return reject(err);
                    }
                    logger.info('[DB] Database connection closed.');
                    this.db = null; // Clear instance
                    resolve();
                });
            } else {
                logger.warn('[DB] Attempted to close database, but it was not open.');
                resolve();
            }
        });
    }
}

module.exports = DatabaseManager; // Експортуємо сам клас