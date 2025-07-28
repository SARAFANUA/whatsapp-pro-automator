// src/core/Logger.js
const winston = require('winston');
require('winston-daily-rotate-file');

// !!! ЦЕЙ РЯДОК МАЄ БУТИ ВИДАЛЕНИЙ АБО ЗАКОМЕНТОВАНИЙ !!!
// const config = require('../../config');

let loggerInstance = null;

// Функція initializeLogger тепер приймає config як аргумент.
// Вона повертає інстанс логера Winston.
function initializeLogger(config) {
    if (!config) {
        // Якщо config не передано, це КРИТИЧНА помилка.
        console.error("CRITICAL ERROR: Logger initialization failed, config is missing!");
        // console.error("Passed config:", config); // Додатковий дебаг
        process.exit(1);
    }

    // Перевірка, чи вже є інстанс логера (singleton-подібна поведінка)
    if (loggerInstance) {
        return loggerInstance;
    }

    const transports = [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                winston.format.colorize(),
                winston.format.printf(info => `${info.timestamp} [${info.level.toUpperCase()}]: ${info.message}`)
            ),
            level: config.logging.level // ВИКОРИСТОВУЄМО АРГУМЕНТ config
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
                winston.format.printf(info => `${info.timestamp} [${info.level.toUpperCase()}]: ${info.message}`)
            ),
            level: config.logging.level // ВИКОРИСТОВУЄМО АРГУМЕНТ config
        });
        transports.push(fileRotateTransport);
    }

    loggerInstance = winston.createLogger({
        level: config.logging.level, // ВИКОРИСТОВУЄМО АРГУМЕНТ config
        transports: transports,
        exitOnError: false,
    });

    return loggerInstance; // !!! ПОВЕРТАЄМО САМ ІНСТАНС ЛОГЕРА !!!
}

// Експортуємо функцію initializeLogger.
// НЕ сам інстанс, а функцію, яка його ініціалізує та повертає.
module.exports = { initializeLogger };