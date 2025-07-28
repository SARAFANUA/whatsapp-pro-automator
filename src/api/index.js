// src/api/index.js
const express = require('express');
const config = require('../../config'); // Потрібен для доступу до config.api.apiKey
const systemRoutes = require('./routes/system.routes');
const createAuthMiddleware = require('./middlewares/auth.middleware'); // Імпортуємо функцію-фабрику middleware

module.exports = (loggerInstance, accountManagerInstance) => {
    if (!loggerInstance) {
        console.error("CRITICAL ERROR: API Server initialization failed, logger is missing!");
        process.exit(1);
    }

    const app = express();
    app.use(express.json());

    // Ініціалізуємо authMiddleware, передаючи йому логер
    const authMiddleware = createAuthMiddleware(loggerInstance); // Створюємо інстанс middleware

    // Передаємо логер та accountManagerInstance в req для контролерів
    app.use((req, res, next) => {
        req.app.logger = loggerInstance;
        req.app.accountManager = accountManagerInstance;
        next();
    });

    // Застосовуємо authMiddleware до всіх маршрутів, що потребують його
    // Наприклад, для systemRoutes
    app.use('/api/system', authMiddleware.verifyApiKey, systemRoutes); // Застосовуємо тут

    // Middleware для обробки помилок (завжди в кінці)
    app.use((err, req, res, next) => {
        loggerInstance.error(`[HTTP API] Unhandled error: ${err.message}`, { module: 'HttpApi', error: err, url: req.originalUrl, method: req.method });
        res.status(500).json({ error: 'Internal Server Error' });
    });

    return app;
};