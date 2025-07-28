// src/api/controllers/SystemController.js
// const logger = require('../../core/Logger'); // Цей рядок має бути видалений, бо ми отримуємо логер з req.app
// const config = require('../../../config'); // Цей рядок може залишитися, якщо він потрібен для якихось значень конфігу, але логер вже не потрібен
const fs = require('fs');
const path = require('path'); // <--- ДОДАЙ ЦЕЙ ІМПОРТ

const SystemController = {
    async getStatus(req, res) {
        const logger = req.app.logger; // Отримуємо логер з req.app
        const accountManager = req.app.accountManager; // Отримуємо accountManager з req.app

        logger.info('[HTTP API] Status request received.', { module: 'HttpApi_SystemController' });

        const statuses = accountManager.getAccountsStatus(); // Використовуємо метод AccountManager

        res.json({
            status: 'Running',
            accounts: statuses,
            uptime: process.uptime(),
            memoryUsage: {
                rss: process.memoryUsage().rss,
                heapTotal: process.memoryUsage().heapTotal,
                heapUsed: process.memoryUsage().heapUsed,
                external: process.memoryUsage().external,
                arrayBuffers: process.memoryUsage().arrayBuffers
            }
        });
    },

    async getLogs(req, res) {
        const logger = req.app.logger; // Отримуємо логер з req.app
        const appConfig = require('../../../config'); // Імпортуємо config тут, якщо потрібен для шляхів логів

        logger.info('[HTTP API] Logs request received.', { module: 'HttpApi_SystemController' });

        const logFileName = appConfig.logging.logRotation.filename.replace('%DATE%', new Date().toISOString().slice(0, 10));
        const logFilePath = path.join(process.cwd(), appConfig.logging.logRotation.dirname, logFileName);

        fs.readFile(logFilePath, 'utf8', (err, data) => {
            if (err) {
                logger.error(`[HTTP API] Error reading log file: ${err.message}`, { module: 'HttpApi_SystemController', error: err, filePath: logFilePath });
                return res.status(500).send('Failed to read logs.');
            }
            res.setHeader('Content-Type', 'text/plain');
            res.send(data);
        });
    }
};

module.exports = SystemController;