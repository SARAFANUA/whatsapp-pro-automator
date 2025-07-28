// src/api/controllers/SystemController.js
// const logger = require('../../core/Logger'); // НЕ ПОТРІБЕН БІЛЬШЕ
// const config = require('../../../config'); // МОЖЕ ЗНАДОБИТИСЯ, АЛЕ ПОКИ ТИМЧАСОВО БЕРЕМО З req.app.logger.debug(config)

const fs = require('fs');
const path = require('path'); // Додай path для коректного шляху до логів

const SystemController = {
    async getStatus(req, res) {
        const logger = req.app.logger; // Отримуємо логер з req.app
        const accountManager = req.app.accountManager; // Отримуємо accountManager з req.app

        logger.info('[HTTP API] Status request received.', { module: 'HttpApi_SystemController' });

        const statuses = accountManager.getAccountsStatus(); // Використовуємо метод AccountManager

        res.json({
            status: 'Running',
            accounts: statuses, // Повертаємо статуси акаунтів
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage()
        });
    },

    async getLogs(req, res) {
        const logger = req.app.logger; // Отримуємо логер з req.app
        const appConfig = require('../../../config'); // Імпортуємо config тут, якщо потрібен
        
        logger.info('[HTTP API] Logs request received.', { module: 'HttpApi_SystemController' });
        
        // Змінимо шлях до логів, щоб він був динамічним і коректним
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