// src/api/index.js
const express = require('express');
const config = require('../../config');
const systemRoutes = require('./routes/system.routes');
const createAuthMiddleware = require('./middlewares/auth.middleware'); // Імпортуємо функцію-фабрику middleware

module.exports = (loggerInstance, accountManagerInstance) => { // Приймаємо логер та менеджер акаунтів
    if (!loggerInstance) {
        console.error("CRITICAL ERROR: API Server initialization failed, logger is missing!");
        process.exit(1);
    }

    const app = express();
    app.use(express.json());

    // Ініціалізуємо authMiddleware, передаючи йому логерInstance
    const authMiddleware = createAuthMiddleware(loggerInstance); // <--- Ось тут передаємо логер!

    // Передаємо логер та accountManagerInstance в req.app для контролерів
    app.use((req, res, next) => {
        req.app.logger = loggerInstance;
        req.app.accountManager = accountManagerInstance;
        next();
    });

    // Застосовуємо authMiddleware.verifyApiKey до всіх маршрутів /api/system
    app.use('/api/system', authMiddleware.verifyApiKey, systemRoutes); // <--- Тепер authMiddleware коректно ініціалізований

    // Middleware для обробки помилок (завжди в кінці)
    app.use((err, req, res, next) => {
        loggerInstance.error(`[HTTP API] Unhandled error: ${err.message}`, { module: 'HttpApi', error: err, url: req.originalUrl, method: req.method });
        res.status(500).json({ error: 'Internal Server Error' });
    });

    return app;
};