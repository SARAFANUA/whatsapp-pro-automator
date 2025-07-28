// src/core/WhatsAppClient.js
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const logger = require('./Logger');
const config = require('../../config');
// const MessageHandler = require('../features/message-forwarding/MessageHandler'); // Заглушка
// const ReplyHandler = require('../features/reply-handling/ReplyHandler'); // Заглушка

class WhatsAppClient {
    constructor(accountId, databaseManager) {
        this.id = accountId;
        this.databaseManager = databaseManager;
        this.client = new Client({
            authStrategy: new LocalAuth({ clientId: `${config.whatsapp.sessionPrefix}${this.id}` }),
            puppeteer: {
                args: config.whatsapp.puppeteerArgs,
            }
        });
        this.reconnectAttempts = 0;
        this.lastActivity = new Date();
        this.setupListeners();
        logger.info(`[WhatsAppClient-${this.id}] Instance created.`);
    }

    setupListeners() {
        this.client.on('qr', qr => {
            logger.info(`[WhatsAppClient-${this.id}] QR Code for authorization:`);
            qrcode.generate(qr, { small: true });
        });

        this.client.on('ready', () => {
            logger.info(`[WhatsAppClient-${this.id}] Client is ready and connected!`);
            this.reconnectAttempts = 0;
            this.lastActivity = new Date();
            // Тут можна оновити статус акаунта в БД
            // this.databaseManager.getDb().run(...)
        });

        this.client.on('message', async message => {
            this.lastActivity = new Date();
            logger.info(`[WhatsAppClient-${this.id}] New message received from ${message.from}. Type: ${message.type}.`);
            // Тут будемо викликати MessageHandler
            // await MessageHandler.process(message, this.id, this.databaseManager);
        });

        this.client.on('disconnected', async (reason) => {
            logger.error(`[WhatsAppClient-${this.id}] Client disconnected. Reason: ${reason}`);
            this.lastActivity = new Date();
            // Оновити статус акаунта в БД
            // this.databaseManager.getDb().run(...)

            if (reason === 'LOGOUT') {
                logger.info(`[WhatsAppClient-${this.id}] LOGOUT detected. Session terminated, manual re-auth required.`);
                // Помітити акаунт як "видалений" або "потребує авторизації"
            } else {
                if (this.reconnectAttempts < config.whatsapp.reconnect.maxAttempts) {
                    this.reconnectAttempts++;
                    logger.warn(`[WhatsAppClient-${this.id}] Reconnect attempt #${this.reconnectAttempts} in ${config.whatsapp.reconnect.delayMs / 1000} seconds...`);
                    await new Promise(resolve => setTimeout(resolve, config.whatsapp.reconnect.delayMs));
                    try {
                        await this.client.initialize();
                    } catch (err) {
                        logger.error(`[WhatsAppClient-${this.id}] Error during re-initialization: ${err.message}`, err);
                    }
                } else {
                    logger.error(`[WhatsAppClient-${this.id}] Max reconnect attempts (${config.whatsapp.reconnect.maxAttempts}) reached. Shutting down this client.`);
                    // Помітити акаунт як "відключений, потрібна увага"
                }
            }
        });

        this.client.on('auth_failure', (msg) => {
            logger.error(`[WhatsAppClient-${this.id}] Critical WhatsApp authentication error: ${msg}`);
            // Помітити акаунт як "потребує авторизації" або видалити сесію
        });

        // Додай інші події, які тобі потрібні
    }

    async initialize() {
        logger.info(`[WhatsAppClient-${this.id}] Initializing client...`);
        await this.client.initialize();
    }

    async destroy() {
        logger.info(`[WhatsAppClient-${this.id}] Destroying client...`);
        await this.client.destroy();
        // Додаткова логіка очищення
    }

    getClient() {
        return this.client;
    }

    getId() {
        return this.id;
    }
}

module.exports = WhatsAppClient;