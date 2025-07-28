// src/app.js
const config = require('../config');
const { validateConfig } = require('../config/validation');
// !!! ТУТ МАЄ БУТИ ДЕСТРУКТУРИЗАЦІЯ, БО Logger.js ЕКСПОРТУЄ ОБ'ЄКТ З ЦІЄЮ ФУНКЦІЄЮ !!!
const { initializeLogger } = require('./core/Logger');
const DatabaseManager = require('./core/DatabaseManager');
const AccountManager = require('./core/AccountManager');
const apiServer = require('./api');
const { cleanupOldRecords } = require('./features/cleanup/DatabaseCleaner');

let logger; // Оголошуємо logger тут
let databaseManager; // Оголошуємо databaseManager тут

// 0. Ініціалізація логера якомога раніше, але ПІСЛЯ ЗАВАНТАЖЕННЯ КОНФІГУРАЦІЇ.
// ТЕПЕР МИ ВИКЛИКАЄМО ФУНКЦІЮ initializeLogger І ПЕРЕДАЄМО ЇЙ config.
// Вона поверне готовий інстанс логера.
logger = initializeLogger(config); // <--- Ось тут ініціалізація логера!

// 1. Валідація конфігурації
try {
    validateConfig(config);
    // Якщо валідація успішна, логуємо це
    logger.info('[Config] Configuration validation successful.');
} catch (err) {
    // Якщо валідація НЕ успішна, логуємо помилку і виходимо.
    // logger тут вже має бути доступним.
    logger.error(`[Config] Configuration validation error: ${err.message}`);
    process.exit(1);
}

// Починаємо логувати старт програми.
logger.info(`[Startup] Application starting. PID: ${process.pid}`);

async function startApplication() {
    try {
        // ... весь інший код залишається таким, як ти його змінив востаннє
        // Тобто, ініціалізація DatabaseManager та інші речі йдуть далі
        // ...
        // 2. Ініціалізація бази даних
        databaseManager = new DatabaseManager(config.database.path);
        await databaseManager.initialize();
        logger.info('[Startup] Database initialized successfully.');

        // 3. Запуск HTTP API сервера
        apiServer.listen(config.app.port, () => {
            logger.info(`[HTTP API] API Server started on http://localhost:${config.app.port}`);
        });

        // 4. Ініціалізація та запуск менеджера акаунтів
        const accountManager = new AccountManager(databaseManager);
        await accountManager.loadAccountsFromDb();
        accountManager.startAllAccounts();

        // 5. Запуск періодичного очищення БД
        if (config.database.cleanup.enabled) {
            const cleanupIntervalMs = config.database.cleanup.intervalHours * 60 * 60 * 1000;
            logger.info(`[DB Cleanup] Scheduled periodic DB cleanup every ${config.database.cleanup.intervalHours} hours.`);
            await cleanupOldRecords(
                databaseManager,
                config.database.cleanup.messageMapRetentionDays,
                config.database.cleanup.groupsRetentionDays
            );
            setInterval(async () => {
                await cleanupOldRecords(
                    databaseManager,
                    config.database.cleanup.messageMapRetentionDays,
                    config.database.cleanup.groupsRetentionDays
                );
            }, cleanupIntervalMs);
        } else {
            logger.info('[DB Cleanup] Periodic DB cleanup is disabled in configuration.');
        }

        logger.info('[Startup] Application fully started and awaiting events.');

    } catch (error) {
        // Якщо помилка виникає тут, logger вже має бути визначений і працювати
        logger.error(`[Startup] Critical error during application startup: ${error.message}`, error);
        process.exit(1);
    }
}

// Обробники сигналів завершення процесу
process.on('SIGINT', async () => {
    // logger тут гарантовано існує завдяки "let logger" і його ініціалізації на початку файлу
    logger.info('[Shutdown] SIGINT signal received. Starting graceful shutdown...');
    if (databaseManager && databaseManager.db) {
        await databaseManager.close();
    }
    process.exit(0);
});
process.on('SIGTERM', async () => {
    logger.info('[Shutdown] SIGTERM signal received. Starting graceful shutdown...');
    if (databaseManager && databaseManager.db) {
        await databaseManager.close();
    }
    process.exit(0);
});

// Обробники неперехоплених помилок та відхилень Promise
process.on('exit', (code) => {
    // На цьому етапі логер може вже бути неактивним або закритим, тому console.log більш надійний
    console.log(`[Process] Exited with code: ${code}`);
});
process.on('uncaughtException', (err) => {
    // Тут логер повинен бути доступним
    logger.error('[CRITICAL ERROR] Uncaught exception! Application will exit.', err);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    // Тут логер повинен бути доступним
    logger.error('[CRITICAL ERROR] Unhandled promise rejection! Application will exit.', reason);
    process.exit(1);
});

startApplication();