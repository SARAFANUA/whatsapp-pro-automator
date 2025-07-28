// src/api/middlewares/auth.middleware.js
const config = require('../../../config');

// Цей модуль тепер експортує ФУНКЦІЮ, яка приймає логерInstance
// і повертає об'єкт з middleware функціями.
module.exports = (loggerInstance) => {
    if (!loggerInstance) {
        // Якщо логер не передано, це критична помилка
        console.error("CRITICAL ERROR: Auth Middleware requires a logger instance for initialization!");
        process.exit(1);
    }

    return {
        verifyApiKey: (req, res, next) => {
            const apiKey = req.headers['x-api-key'] || req.query.apiKey;

            if (!apiKey || apiKey !== config.api.apiKey) {
                // Використовуємо переданий loggerInstance
                loggerInstance.warn('[HTTP API] Unauthorized API access attempt.', { module: 'AuthMiddleware', ip: req.ip });
                return res.status(401).json({ error: 'Unauthorized: Invalid API Key' });
            }
            next();
        }
    };
};