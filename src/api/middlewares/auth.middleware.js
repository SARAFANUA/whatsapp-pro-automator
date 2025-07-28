// src/api/middlewares/auth.middleware.js
const config = require('../../../config');
const logger = require('../../core/Logger');

const authMiddleware = {
    verifyApiKey(req, res, next) {
        const apiKey = req.headers['x-api-key'] || req.query.apiKey; // Можна передавати в хедері або як query-параметр

        if (!apiKey || apiKey !== config.api.apiKey) {
            logger.warn('[HTTP API] Unauthorized API access attempt.');
            return res.status(401).json({ error: 'Unauthorized: Invalid API Key' });
        }
        next();
    }
};

module.exports = authMiddleware;