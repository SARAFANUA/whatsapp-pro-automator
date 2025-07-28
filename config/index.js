// config/index.js
module.exports = {
    app: {
        port: process.env.PORT || 3000,
        env: process.env.NODE_ENV || 'development'
    },
    whatsapp: {
        sessionPrefix: 'whatsapp-pro-session-',
        puppeteerArgs: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
        reconnect: {
            maxAttempts: 30,
            delayMs: 5000,
        },
    },
    // !!! ПЕРЕКОНАЙСЯ, ЩО ЦЕЙ БЛОК ІСНУЄ І ПРАВИЛЬНИЙ !!!
    logging: {
        level: process.env.LOG_LEVEL || 'info', // ЦЕЙ РЯДОК МУСИТЬ ІСНУВАТИ!
        logToFile: true,
        logRotation: {
            dirname: 'logs',
            filename: 'app-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxFiles: '7d',
            maxSize: '20m',
        }
    },
    database: {
        path: './data/whatsapp_automator.db',
        cleanup: {
            enabled: true,
            intervalHours: 168,
            messageMapRetentionDays: 30,
            groupsRetentionDays: 90,
        }
    },
    specialGroupIds: {
        SPECIFIC_REPLY_SOURCE_GROUP_ID: '120363418724317936@g.us',
        SPECIFIC_ORIGINAL_SOURCE_GROUP_ID: '120363023698433155@g.us',
    },
    api: {
        apiKey: process.env.API_KEY || 'your_super_secret_api_key_here'
    },
    notifications: {
        telegram: {
            enabled: false,
            botToken: process.env.TELEGRAM_BOT_TOKEN || '',
            chatId: process.env.TELEGRAM_CHAT_ID || ''
        }
    }
};