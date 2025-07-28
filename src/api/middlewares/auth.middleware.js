// src/api/middlewares/auth.middleware.js
// const logger = require('../../core/Logger'); // !!! ВИДАЛИ ЦЕЙ РЯДОК !!!
const config = require('../../../config');

// Експортуємо ФУНКЦІЮ, яка повертає middleware, і ця функція приймає логер
module.exports = (loggerInstance) => {
    if (!loggerInstance) {
        console.error("CRITICAL ERROR: Auth Middleware initialization failed, logger is missing!");
        process.exit(1);
    }

    return {
        verifyApiKey: (req, res, next) => {
            const apiKey = req.headers['x-api-key'] || req.query.apiKey;

            if (!apiKey || apiKey !== config.api.apiKey) {
                // Тепер використовуємо loggerInstance, який був переданий
                loggerInstance.warn('[HTTP API] Unauthorized API access attempt.', { module: 'AuthMiddleware', ip: req.ip });
                return res.status(401).json({ error: 'Unauthorized: Invalid API Key' });
            }
            next();
        }
    };
};