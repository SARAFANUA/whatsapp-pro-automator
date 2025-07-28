// src/core/AccountManager.js
// const logger = require('./Logger'); // ЦЕЙ РЯДОК МАЄ БУТИ ВИДАЛЕНИЙ, МИ ПЕРЕДАЄМО ЛОГЕР ЧЕРЕЗ КОНСТРУКТОР
const WhatsAppClient = require('./WhatsAppClient');
const AccountRepository = require('../database/repositories/AccountRepository'); // Імпортуємо репозиторій для акаунтів

class AccountManager {
    constructor(loggerInstance, databaseManager) { // Приймаємо інстанс логера та менеджер БД
        this.logger = loggerInstance; // Зберігаємо інстанс логера
        this.activeClients = new Map(); // Карта для зберігання активних екземплярів WhatsAppClient
        this.databaseManager = databaseManager;
        this.accountRepository = new AccountRepository(databaseManager, loggerInstance); // Ініціалізуємо репозиторій, передаючи йому БД та логер
        this.logger.info('[AccountManager] Initialized.', { module: 'AccountManager' });
    }

    /**
     * Завантажує всі акаунти з бази даних.
     */
    async loadAccountsFromDb() {
        this.logger.info('[AccountManager] Loading accounts from database...', { module: 'AccountManager' });
        try {
            const accounts = await this.accountRepository.findAll();
            if (accounts.length > 0) {
                for (const acc of accounts) {
                    if (!this.activeClients.has(acc.id)) {
                        // Створюємо WhatsAppClient для кожного завантаженого акаунта
                        // Передаємо логер, ID акаунта, і менеджер БД
                        const client = new WhatsAppClient(this.logger, acc.id, this.databaseManager);
                        this.activeClients.set(acc.id, client);
                        this.logger.info(`[AccountManager] Loaded account from DB: ${acc.id} with status ${acc.status}.`, { module: 'AccountManager', accountId: acc.id, status: acc.status });
                    }
                }
                this.logger.info(`[AccountManager] Successfully loaded ${accounts.length} accounts from DB.`, { module: 'AccountManager' });
            } else {
                this.logger.info('[AccountManager] No accounts found in the database. Initializing a default test account for demonstration.', { module: 'AccountManager' });
                // Якщо немає акаунтів, додаємо тестовий для першого запуску
                const testAccountId = 'default_test_account';
                const existingTestAccount = await this.accountRepository.findById(testAccountId);

                if (!existingTestAccount) {
                    const newAccountData = {
                        id: testAccountId,
                        sessionPath: `${testAccountId}-session`, // Унікальний шлях для сесії
                        status: 'disconnected'
                    };
                    await this.accountRepository.saveOrUpdate(newAccountData);
                    this.logger.info(`[AccountManager] Saved default test account '${testAccountId}' to DB.`, { module: 'AccountManager', accountId: testAccountId });
                }

                // Завантажуємо його (або якщо він вже був)
                const client = new WhatsAppClient(this.logger, testAccountId, this.databaseManager);
                this.activeClients.set(testAccountId, client);
                this.logger.info(`[AccountManager] Added default test account: ${testAccountId}`, { module: 'AccountManager', accountId: testAccountId });

            }
        } catch (error) {
            this.logger.error(`[AccountManager] Error loading accounts from database: ${error.message}`, { module: 'AccountManager', error: error });
            throw error;
        }
    }

    /**
     * Запускає всі завантажені акаунти.
     */
    async startAllAccounts() {
        this.logger.info('[AccountManager] Starting all accounts...', { module: 'AccountManager' });
        for (const [id, client] of this.activeClients) {
            // Оновлюємо статус акаунта в БД перед ініціалізацією
            await this.accountRepository.updateStatus(id, 'connecting');
            this.logger.info(`[AccountManager] Starting account ${id}...`, { module: 'AccountManager', accountId: id });
            await client.initialize();
        }
    }

    /**
     * Додає новий акаунт (наприклад, через API).
     * @param {string} accountId - Унікальний ID для нового акаунта.
     * @returns {Promise<WhatsAppClient>} Новий екземпляр WhatsAppClient.
     */
    async addAccount(accountId) {
        if (this.activeClients.has(accountId)) {
            throw new Error(`Account with ID ${accountId} already exists.`);
        }
        const newAccountData = {
            id: accountId,
            sessionPath: `${accountId}-session`,
            status: 'disconnected'
        };
        await this.accountRepository.saveOrUpdate(newAccountData);
        const client = new WhatsAppClient(this.logger, accountId, this.databaseManager);
        this.activeClients.set(accountId, client);
        this.logger.info(`[AccountManager] New account ${accountId} added and ready for initialization.`, { module: 'AccountManager', accountId: accountId });
        return client;
    }

    /**
     * Зупиняє конкретний акаунт.
     * @param {string} accountId - ID акаунта для зупинки.
     * @returns {Promise<void>}
     */
    async stopAccount(accountId) {
        const client = this.activeClients.get(accountId);
        if (client) {
            await client.destroy();
            await this.accountRepository.updateStatus(accountId, 'stopped');
            this.activeClients.delete(accountId);
            this.logger.info(`[AccountManager] Account ${accountId} stopped and removed.`, { module: 'AccountManager', accountId: accountId });
        } else {
            this.logger.warn(`[AccountManager] Attempted to stop non-existent account ${accountId}.`, { module: 'AccountManager', accountId: accountId });
        }
    }

    /**
     * Отримує статус всіх активних акаунтів.
     * @returns {Array<object>} Масив об'єктів статусу акаунтів.
     */
    getAccountsStatus() {
        const statuses = [];
        for (const [id, client] of this.activeClients) {
            statuses.push({
                id: client.getId(),
                status: client.client.state || 'UNKNOWN', // WhatsAppClient.client.state - фактичний стан puppeteer
                lastActivity: client.lastActivity.toISOString(),
                reconnectAttempts: client.reconnectAttempts
            });
        }
        return statuses;
    }
}

module.exports = AccountManager;