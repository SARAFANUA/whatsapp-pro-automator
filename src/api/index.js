// src/api/index.js
const express = require('express');
const config = require('../../config');
const systemRoutes = require('./routes/system.routes');
const accountsRoutes = require('./routes/accounts.routes'); // <-- ДОДАЙ ЦЕЙ ІМПОРТ
const rulesRoutes = require('./routes/rules.routes');     // <-- ДОДАЙ ЦЕЙ ІМПОРТ
const createAuthMiddleware = require('./middlewares/auth.middleware');

module.exports = (loggerInstance, accountManagerInstance) => {
    if (!loggerInstance) {
        console.error("CRITICAL ERROR: API Server initialization failed, logger is missing!");
        process.exit(1);
    }

    const app = express();
    app.use(express.json());

    const authMiddleware = createAuthMiddleware(loggerInstance);

    app.use((req, res, next) => {
        req.app.logger = loggerInstance;
        req.app.accountManager = accountManagerInstance;
        next();
    });

    // Застосовуємо authMiddleware.verifyApiKey до всіх маршрутів, що потребують його
    app.use('/api/system', authMiddleware.verifyApiKey, systemRoutes);
    app.use('/api/accounts', authMiddleware.verifyApiKey, accountsRoutes); // <-- ДОДАЙ ЦЕЙ РЯДОК
    app.use('/api/rules', authMiddleware.verifyApiKey, rulesRoutes);     // <-- ДОДАЙ ЦЕЙ РЯДОК

    // Middleware для обробки помилок (завжди в кінці)
    app.use((err, req, res, next) => {
        loggerInstance.error(`[HTTP API] Unhandled error: ${err.message}`, { module: 'HttpApi', error: err, url: req.originalUrl, method: req.method });
        res.status(500).json({ error: 'Internal Server Error' });
    });

    return app;
};