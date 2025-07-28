// src/core/Logger.js
const winston = require('winston');
require('winston-daily-rotate-file');


let loggerInstance = null;

// Функція тепер приймає конфігурацію як аргумент
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
                winston.format.printf(info => `${info.timestamp} [${info.level.toUpperCase()}]: ${info.message}`)
            ),
            level: config.logging.level
        })
    ];

    if (config.logging.logToFile) {
        const fileRotateTransport = new winston.transports.DailyRotateFile({
            dirname: config.logging.logRotation.dirname,
            filename: config.logging.logRotation.filename,
            datePattern: config.logging.logRotation.datePattern,
            zippedArchive: config.logging.logRotation.zippedArchive, // <= ПРАВИЛЬНО ТЕПЕР!
            maxSize: config.logging.logRotation.maxSize,
            maxFiles: config.logging.logRotation.maxFiles,
            format: winston.format.combine(
                winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                winston.format.printf(info => `${info.timestamp} [${info.level.toUpperCase()}]: ${info.message}`)
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