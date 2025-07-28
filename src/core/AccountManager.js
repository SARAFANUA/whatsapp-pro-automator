// src/core/AccountManager.js
const logger = require('./Logger');
const WhatsAppClient = require('./WhatsAppClient'); // Скоро створимо
// const AccountRepository = require('../database/repositories/AccountRepository'); // Підключимо пізніше

class AccountManager {
    constructor(databaseManager) {
        this.activeClients = new Map(); // Карта для зберігання активних екземплярів WhatsAppClient
        this.databaseManager = databaseManager;
        // this.accountRepository = new AccountRepository(databaseManager); // Підключимо пізніше
        logger.info('[AccountManager] Initialized.');
    }

    async loadAccountsFromDb() {
        logger.info('[AccountManager] Loading accounts from database... (Not implemented yet)');
        // Тут буде логіка завантаження акаунтів з БД
        // Наприклад: const accounts = await this.accountRepository.findAll();
        // Поки що можемо додати тестовий акаунт, або нічого не додавати
        // Для тестування можна додати один акаунт вручну, щоб він запустився
        // const testAccountId = 'default';
        // if (!this.activeClients.has(testAccountId)) {
        //     const client = new WhatsAppClient(testAccountId, this.databaseManager);
        //     this.activeClients.set(testAccountId, client);
        //     logger.info(`[AccountManager] Added test account: ${testAccountId}`);
        // }
    }

    async startAllAccounts() {
        logger.info('[AccountManager] Starting all accounts...');
        for (const [id, client] of this.activeClients) {
            logger.info(`[AccountManager] Starting account ${id}...`);
            await client.initialize();
        }
    }

    // Тут будуть методи для додавання, видалення, запуску, зупинки акаунтів
}

module.exports = AccountManager;