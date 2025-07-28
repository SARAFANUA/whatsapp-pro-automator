// src/core/Logger.js
const winston = require('winston');
require('winston-daily-rotate-file');

let loggerInstance = null;

function initializeLogger(config) {
    if (!config) {
        console.error("CRITICAL ERROR: Logger initialization failed, config is missing!");
        process.exit(1);
    }

    if (loggerInstance) return loggerInstance;

    const transports = [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                winston.format.colorize(),
                winston.format.printf(info => {
                    let prefix = `${info.timestamp} [${info.level.toUpperCase()}]`;
                    if (info.module) prefix += ` [${info.module}]`;
                    if (info.accountId) prefix += ` [Acc:${info.accountId}]`;
                    if (info.messageId) prefix += ` [Msg:${info.messageId}]`;
                    if (info.pid) prefix += ` [PID:${info.pid}]`;

                    if (info.stack) {
                        return `${prefix}: ${info.message}\n${info.stack}`;
                    }
                    return `${prefix}: ${info.message}`;
                })
            ),
            level: config.logging.level
        })
    ];

    if (config.logging.logToFile) {
        const fileRotateTransport = new winston.transports.DailyRotateFile({
            dirname: config.logging.logRotation.dirname,
            filename: config.logging.logRotation.filename,
            datePattern: config.logging.logRotation.datePattern,
            zippedArchive: config.logging.logRotation.zippedArchive,
            maxSize: config.logging.logRotation.maxSize,
            maxFiles: config.logging.logRotation.maxFiles,
            format: winston.format.combine(
                winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                winston.format.printf(info => {
                    let prefix = `${info.timestamp} [${info.level.toUpperCase()}]`;
                    if (info.module) prefix += ` [${info.module}]`;
                    if (info.accountId) prefix += ` [Acc:${info.accountId}]`;
                    if (info.messageId) prefix += ` [Msg:${info.messageId}]`;
                    if (info.pid) prefix += ` [PID:${info.pid}]`;

                    if (info.stack) {
                        return `${prefix}: ${info.message}\n${info.stack}`;
                    }
                    return `${prefix}: ${info.message}`;
                })
            ),
            level: config.logging.level
        });
        transports.push(fileRotateTransport);
    }

    loggerInstance = winston.createLogger({
        level: config.logging.level,
        transports: transports,
        exitOnError: false,
    });

    return loggerInstance;
}

module.exports = { initializeLogger };