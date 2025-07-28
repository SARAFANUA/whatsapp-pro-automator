// src/api/controllers/SystemController.js
const logger = require('../../core/Logger');
const config = require('../../../config');
const fs = require('fs');

const SystemController = {
    async getStatus(req, res) {
        logger.info('[HTTP API] Status request received.');
        // Тут потрібно буде отримати реальний статус від AccountManager
        res.json({
            status: 'Running', // Заглушка
            // whatsappClientsStatus: accountManager.getStatus(), // Пізніше
            lastActivity: new Date().toLocaleString('uk-UA'),
            reconnectAttempts: 0, // Заглушка
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage()
        });
    },

    async getLogs(req, res) {
        logger.info('[HTTP API] Logs request received.');
        const logFilePath = config.logging.logRotation.dirname + '/' + config.logging.logRotation.filename.replace('%DATE%', new Date().toISOString().slice(0, 10));
        fs.readFile(logFilePath, 'utf8', (err, data) => {
            if (err) {
                logger.error(`[HTTP API] Error reading log file: ${err.message}`, err);
                return res.status(500).send('Failed to read logs.');
            }
            res.setHeader('Content-Type', 'text/plain');
            res.send(data);
        });
    }
};

module.exports = SystemController;