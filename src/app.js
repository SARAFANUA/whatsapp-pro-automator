// src/app.js
const config = require('../config');
const { validateConfig } = require('../config/validation');
const { initializeLogger } = require('./core/Logger');
const DatabaseManager = require('./core/DatabaseManager');
const AccountManager = require('./core/AccountManager');
const createApiServer = require('./api'); // Змінили ім'я на createApiServer, бо api/index.js експортує функцію, а не сам app
const { cleanupOldRecords } = require('./features/cleanup/DatabaseCleaner');

let logger;
let databaseManager;
let apiServer; // Змінна для інстансу API сервера

// 0. Ініціалізація логера якомога раніше, але ПІСЛЯ ЗАВАНТАЖЕННЯ КОНФІГУРАЦІЇ.
logger = initializeLogger(config);

// 1. Валідація конфігурації
try {
    validateConfig(config);
    logger.info('[Config] Configuration validation successful.', { module: 'AppStartup' });
} catch (err) {
    logger.error(`[Config] Configuration validation error: ${err.message}`, { module: 'AppStartup', error: err });
    process.exit(1);
}

logger.info(`[Startup] Application starting. PID: ${process.pid}`, { module: 'AppStartup', pid: process.pid });

async function startApplication() {
    try {
        // 2. Ініціалізація бази даних
        databaseManager = new DatabaseManager(logger, config.database.path);
        await databaseManager.initialize();
        logger.info('[Startup] Database initialized successfully.', { module: 'AppStartup' });

        // 4. Ініціалізація та запуск менеджера акаунтів
        const accountManager = new AccountManager(logger, databaseManager);
        await accountManager.loadAccountsFromDb(); // Завантажуємо акаунти з БД
        accountManager.startAllAccounts(); // Запускаємо їх

        // 3. Запуск HTTP API сервера (тепер після AccountManager, щоб передати його)
        // Передаємо логер та інстанс AccountManager в createApiServer
        apiServer = createApiServer(logger, accountManager); // !!! ТУТ СТВОРЮЄМО ІНСТАНС APP !!!
        apiServer.listen(config.app.port, () => {
            logger.info(`[HTTP API] API Server started on http://localhost:${config.app.port}`, { module: 'HttpApi' });
        });

        // 5. Запуск періодичного очищення БД
        if (config.database.cleanup.enabled) {
            const cleanupIntervalMs = config.database.cleanup.intervalHours * 60 * 60 * 1000;
            logger.info(`[DB Cleanup] Scheduled periodic DB cleanup every ${config.database.cleanup.intervalHours} hours.`, { module: 'DBCleanup' });
            await cleanupOldRecords(
                logger,
                databaseManager,
                config.database.cleanup.messageMapRetentionDays,
                config.database.cleanup.groupsRetentionDays
            );
            setInterval(async () => {
                await cleanupOldRecords(
                    logger,
                    databaseManager,
                    config.database.cleanup.messageMapRetentionDays,
                    config.database.cleanup.groupsRetentionDays
                );
            }, cleanupIntervalMs);
        } else {
            logger.info('[DB Cleanup] Periodic DB cleanup is disabled in configuration.', { module: 'DBCleanup' });
        }

        logger.info('[Startup] Application fully started and awaiting events.', { module: 'AppStartup' });

    } catch (error) {
        logger.error(`[Startup] Critical error during application startup: ${error.message}`, { module: 'AppStartup', error: error });
        process.exit(1);
    }
}

// Обробники сигналів завершення процесу
process.on('SIGINT', async () => {
    logger.info('[Shutdown] SIGINT signal received. Starting graceful shutdown...', { module: 'AppShutdown' });
    if (databaseManager && databaseManager.db) {
        await databaseManager.close();
    }
    process.exit(0);
});
process.on('SIGTERM', async () => {
    logger.info('[Shutdown] SIGTERM signal received. Starting graceful shutdown...', { module: 'AppShutdown' });
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
    if (logger) {
        logger.error('[CRITICAL ERROR] Uncaught exception! Application will exit.', { module: 'UnhandledError', error: err });
    } else {
        console.error('[CRITICAL ERROR] Uncaught exception! Application will exit (logger not initialized).', err);
    }
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    if (logger) {
        logger.error('[CRITICAL ERROR] Unhandled promise rejection! Application will exit.', { module: 'UnhandledError', error: reason });
    } else {
        console.error('[CRITICAL ERROR] Unhandled promise rejection! Application will exit (logger not initialized).', reason);
    }
    process.exit(1);
});

startApplication();