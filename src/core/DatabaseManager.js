// src/core/DatabaseManager.js
const sqlite3 = require('sqlite3').verbose();
// const logger = require('./Logger'); // !!! ЦЕЙ РЯДОК НЕ ПОТРІБЕН, БО ЛОГЕР БУДЕ ПЕРЕДАВАТИСЯ !!!
const config = require('../../config'); // Цей потрібен для конфігурації БД

// ВИДАЛИ ВСІ ЦІ РЯДКИ, ВОНИ НЕ МАЮТЬ БУТИ ТУТ!!!
// logger.info(`[DB] Connected to database at ${this.dbPath}`, { module: 'DatabaseManager', dbPath: this.dbPath });
// logger.error(`[DB] Error creating accounts table:`, { module: 'DatabaseManager', error: err });
// ... і всі подібні виклики logger поза класом

class DatabaseManager {
    // Тепер конструктор приймає інстанс логера!
    constructor(loggerInstance, dbPath) {
        this.logger = loggerInstance; // Зберігаємо інстанс логера
        this.dbPath = dbPath;
        this.db = null;
        this.logger.info('[DB] DatabaseManager instance created.', { module: 'DatabaseManager' }); // Використовуємо this.logger
    }

    /**
     * Ініціалізує з'єднання з базою даних.
     * @returns {Promise<sqlite3.Database>}
     */
    async initialize() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    this.logger.error(`[DB] Failed to connect to database at ${this.dbPath}: ${err.message}`, { module: 'DatabaseManager', error: err });
                    return reject(err);
                }
                this.logger.info(`[DB] Connected to database at ${this.dbPath}`, { module: 'DatabaseManager', dbPath: this.dbPath });
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
                        this.logger.error('[DB] Error creating accounts table:', { module: 'DatabaseManager', error: err });
                        return reject(err);
                    }
                    this.logger.info('[DB] Table "accounts" checked/created successfully.', { module: 'DatabaseManager' });
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
                        this.logger.error('[DB] Error creating message_map table:', { module: 'DatabaseManager', error: err });
                        return reject(err);
                    }
                    this.logger.info('[DB] Table "message_map" checked/created successfully.', { module: 'DatabaseManager' });
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
                        this.logger.error('[DB] Error creating whatsapp_groups table:', { module: 'DatabaseManager', error: err });
                        return reject(err);
                    }
                    this.logger.info('[DB] Table "whatsapp_groups" checked/created successfully.', { module: 'DatabaseManager' });
                });

                // Таблиця для правил пересилання
                this.db.run(`CREATE TABLE IF NOT EXISTS forwarding_rules (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    accountId TEXT NOT NULL,
                    sourceId TEXT NOT NULL,
                    destinationId TEXT NOT NULL,
                    filterType TEXT DEFAULT 'none',
                    filterValue TEXT DEFAULT '',
                    isActive BOOLEAN NOT NULL DEFAULT 1,
                    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (accountId) REFERENCES accounts(id) ON DELETE CASCADE
                )`, (err) => {
                    if (err) {
                        this.logger.error('[DB] Error creating forwarding_rules table:', { module: 'DatabaseManager', error: err });
                        return reject(err);
                    }
                    this.logger.info('[DB] Table "forwarding_rules" checked/created successfully.', { module: 'DatabaseManager' });
                    resolve();
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
            this.logger.error('[DB] Database not initialized. Call initialize() first.', { module: 'DatabaseManager' });
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
                        this.logger.error('[DB] Error closing database:', { module: 'DatabaseManager', error: err });
                        return reject(err);
                    }
                    this.logger.info('[DB] Database connection closed.', { module: 'DatabaseManager' });
                    this.db = null;
                    resolve();
                });
            } else {
                this.logger.warn('[DB] Attempted to close database, but it was not open.', { module: 'DatabaseManager' });
                resolve();
            }
        });
    }
}

module.exports = DatabaseManager;