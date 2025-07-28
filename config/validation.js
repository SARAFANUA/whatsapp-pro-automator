// config/validation.js
const Joi = require('joi');

const configSchema = Joi.object({
    app: Joi.object({
        port: Joi.number().integer().min(1024).max(65535).required(),
        env: Joi.string().valid('development', 'production', 'test').required()
    }).required(),
    whatsapp: Joi.object({
        sessionPrefix: Joi.string().required(),
        puppeteerArgs: Joi.array().items(Joi.string()).required(),
        reconnect: Joi.object({
            maxAttempts: Joi.number().integer().min(1).required(),
            delayMs: Joi.number().integer().min(1000).required(),
        }).required(),
    }).required(),
    logging: Joi.object({
        level: Joi.string().valid('error', 'warn', 'info', 'debug').required(),
        logToFile: Joi.boolean().required(),
        logRotation: Joi.object({
            dirname: Joi.string().required(),
            filename: Joi.string().required(),
            datePattern: Joi.string().required(),
            zippedArchive: Joi.boolean().required(),
            maxFiles: Joi.string().required(),
            maxSize: Joi.string().required(),
        }).required(),
    }).required(),
    database: Joi.object({
        path: Joi.string().required(),
        cleanup: Joi.object({
            enabled: Joi.boolean().required(),
            intervalHours: Joi.number().integer().min(1).required(),
            messageMapRetentionDays: Joi.number().integer().min(1).required(),
            groupsRetentionDays: Joi.number().integer().min(1).required(),
        }).required(),
    }).required(),
    specialGroupIds: Joi.object({
        SPECIFIC_REPLY_SOURCE_GROUP_ID: Joi.string().optional().allow(''),
        SPECIFIC_ORIGINAL_SOURCE_GROUP_ID: Joi.string().optional().allow(''),
    }).required(),
    api: Joi.object({
        apiKey: Joi.string().min(16).required()
    }).required(),
    notifications: Joi.object({
        telegram: Joi.object({
            enabled: Joi.boolean().required(),
            botToken: Joi.string().allow(''),
            chatId: Joi.string().allow('')
        }).required()
    }).required()
}).unknown(true); // Дозволяємо невідомі поля, якщо вони додадуться пізніше

function validateConfig(config) {
    const { error } = configSchema.validate(config);
    if (error) {
        throw new Error(`Configuration validation error: ${error.details.map(x => x.message).join(', ')}`);
    }
}

module.exports = { validateConfig };