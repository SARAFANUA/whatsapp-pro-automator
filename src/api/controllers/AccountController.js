// src/api/controllers/AccountController.js
// const AccountRepository = require('../../database/repositories/AccountRepository'); // Не потрібно напряму, AccountManager його використовує

const AccountController = {
    // req.app.logger та req.app.accountManager доступні завдяки middleware в api/index.js

    async getAllAccounts(req, res) {
        const logger = req.app.logger;
        const accountManager = req.app.accountManager;
        try {
            logger.info('[API] Request to get all accounts.', { module: 'AccountController' });
            const accounts = accountManager.getAccountsStatus(); // Метод AccountManager для отримання статусу всіх акаунтів
            res.json({ success: true, data: accounts });
        } catch (error) {
            logger.error(`[API] Error getting all accounts: ${error.message}`, { module: 'AccountController', error: error });
            res.status(500).json({ success: false, error: 'Failed to retrieve accounts.' });
        }
    },

    async registerAccount(req, res) {
        const logger = req.app.logger;
        const accountManager = req.app.accountManager;
        const { accountId } = req.body; // Очікуємо accountId в тілі запиту

        if (!accountId) {
            return res.status(400).json({ success: false, error: 'accountId is required.' });
        }

        try {
            logger.info(`[API] Request to register new account: ${accountId}.`, { module: 'AccountController', accountId: accountId });
            const client = await accountManager.addAccount(accountId); // Додаємо новий акаунт через AccountManager

            // Для відправки QR-коду назад клієнту, потрібно буде встановити слухача QR на цьому екземплярі клієнта.
            // WhatsApp-web.js не надає QR-код прямо з функції addAccount синхронно.
            // Найкращий спосіб - це фронтенд робить запит, а потім чекає на "qr_required" статус
            // або на WebSocket-з'єднання для отримання QR-кокоду в реальному часі.
            // Для простоти, поки що, просто повідомляємо, що аккаунт додано і очікує QR.

            // Можна додати тимчасовий слухач QR для цього конкретного запиту,
            // але це не дуже масштабоване рішення для API.
            // Краще: Клієнт API періодично запитує статус, поки не побачить "qr_required"
            // або ми налаштуємо WebSocket для передачі QR.

            // Поки що просто повідомляємо, що аккаунт додано.
            res.status(202).json({
                success: true,
                message: `Account ${accountId} initiated. Please check logs for QR code (or use WebSocket for real-time QR).`,
                accountId: accountId,
                status: 'qr_required_pending' // Це тимчасовий статус, поки WWebJS не поверне реальний
            });

        } catch (error) {
            logger.error(`[API] Error registering account ${accountId}: ${error.message}`, { module: 'AccountController', accountId: accountId, error: error });
            res.status(500).json({ success: false, error: error.message });
        }
    },

    async startAccount(req, res) {
        const logger = req.app.logger;
        const accountManager = req.app.accountManager;
        const { accountId } = req.params;

        try {
            logger.info(`[API] Request to start account: ${accountId}.`, { module: 'AccountController', accountId: accountId });
            // Тут потрібно знайти інстанс клієнта і викликати client.initialize()
            // AccountManager.startAccount(accountId)
            const client = accountManager.activeClients.get(accountId); // Отримуємо клієнт
            if (!client) {
                return res.status(404).json({ success: false, error: `Account ${accountId} not found or not loaded.` });
            }
            await client.initialize(); // Запускаємо ініціалізацію клієнта
            res.json({ success: true, message: `Account ${accountId} initialization started.` });
        } catch (error) {
            logger.error(`[API] Error starting account ${accountId}: ${error.message}`, { module: 'AccountController', accountId: accountId, error: error });
            res.status(500).json({ success: false, error: error.message });
        }
    },

    async stopAccount(req, res) {
        const logger = req.app.logger;
        const accountManager = req.app.accountManager;
        const { accountId } = req.params;

        try {
            logger.info(`[API] Request to stop account: ${accountId}.`, { module: 'AccountController', accountId: accountId });
            await accountManager.stopAccount(accountId); // Викликаємо метод AccountManager для зупинки
            res.json({ success: true, message: `Account ${accountId} stopped.` });
        } catch (error) {
            logger.error(`[API] Error stopping account ${accountId}: ${error.message}`, { module: 'AccountController', accountId: accountId, error: error });
            res.status(500).json({ success: false, error: error.message });
        }
    },

    async deleteAccount(req, res) {
        const logger = req.app.logger;
        const accountManager = req.app.accountManager;
        const { accountId } = req.params;

        try {
            logger.info(`[API] Request to delete account: ${accountId}.`, { module: 'AccountController', accountId: accountId });
            await accountManager.accountRepository.deleteById(accountId); // Видаляємо з БД
            await accountManager.stopAccount(accountId); // Зупиняємо та видаляємо з пам'яті
            // !!! ВАЖЛИВО: Потрібно видалити і файли сесії з диска (.wwebjs_auth/whatsapp-pro-session-ACCOUNT_ID)
            // Це можна зробити через AccountManager.deleteAccount
            res.json({ success: true, message: `Account ${accountId} deleted.` });
        } catch (error) {
            logger.error(`[API] Error deleting account ${accountId}: ${error.message}`, { module: 'AccountController', accountId: accountId, error: error });
            res.status(500).json({ success: false, error: error.message });
        }
    }
};

module.exports = AccountController;