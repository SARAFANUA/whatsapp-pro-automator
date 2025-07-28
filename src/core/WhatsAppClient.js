// src/core/WhatsAppClient.js
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
// const logger = require('./Logger'); // ЦЕЙ РЯДОК МАЄ БУТИ ВИДАЛЕНИЙ
const config = require('../../config');
const AccountRepository = require('../database/repositories/AccountRepository'); // Імпортуємо репозиторій для оновлення статусу

class WhatsAppClient {
    constructor(loggerInstance, accountId, databaseManager) { // loggerInstance тепер перший аргумент
        this.logger = loggerInstance; // Зберігаємо інстанс логера
        this.id = accountId;
        this.databaseManager = databaseManager;
        this.accountRepository = new AccountRepository(databaseManager, loggerInstance); // Ініціалізуємо репозиторій

        this.client = new Client({
            authStrategy: new LocalAuth({ clientId: `${config.whatsapp.sessionPrefix}${this.id}` }),
            puppeteer: {
                args: config.whatsapp.puppeteerArgs,
            }
        });
        this.reconnectAttempts = 0;
        this.lastActivity = new Date();
        this.setupListeners();
        this.logger.info(`[WhatsAppClient-${this.id}] Instance created.`, { module: 'WhatsAppClient', accountId: this.id });
    }

    setupListeners() {
        this.client.on('qr', qr => {
            this.logger.info(`[WhatsAppClient-${this.id}] QR Code for authorization:`, { module: 'WhatsAppClient', accountId: this.id });
            qrcode.generate(qr, { small: true });
            this.accountRepository.updateStatus(this.id, 'qr_required'); // Оновлюємо статус в БД
        });

        this.client.on('ready', async () => { // Додаємо async
            this.logger.info(`[WhatsAppClient-${this.id}] Client is ready and connected!`, { module: 'WhatsAppClient', accountId: this.id });
            this.reconnectAttempts = 0;
            this.lastActivity = new Date();
            await this.accountRepository.updateStatus(this.id, 'connected'); // Оновлюємо статус в БД
            // !!! ТУТ ПОТРІБНО БУДЕ ЗАПУСКАТИ СИНХРОНІЗАЦІЮ ГРУП ТА ПРАВИЛ ПЕРЕСИЛАННЯ !!!
            // (Це буде наступним кроком)
        });

        this.client.on('message', async message => {
            this.lastActivity = new Date();
            this.logger.info(`[WhatsAppClient-${this.id}] New message received from ${message.from}. Type: ${message.type}.`, { module: 'WhatsAppClient', accountId: this.id, messageId: message.id._serialized });
            // Тут будемо викликати MessageHandler, передаючи йому логер, менеджер БД, та ID акаунта
            // const messageHandler = new MessageHandler(this.logger, this.databaseManager);
            // await messageHandler.process(message, this.id);
        });

        this.client.on('disconnected', async (reason) => {
            this.logger.error(`[WhatsAppClient-${this.id}] Client disconnected. Reason: ${reason}`, { module: 'WhatsAppClient', accountId: this.id, reason: reason });
            this.lastActivity = new Date();

            if (reason === 'LOGOUT') {
                this.logger.info(`[WhatsAppClient-${this.id}] LOGOUT detected. Session terminated, manual re-auth required.`, { module: 'WhatsAppClient', accountId: this.id });
                await this.accountRepository.updateStatus(this.id, 'logged_out'); // Оновлюємо статус
            } else {
                await this.accountRepository.updateStatus(this.id, 'reconnecting'); // Оновлюємо статус
                if (this.reconnectAttempts < config.whatsapp.reconnect.maxAttempts) {
                    this.reconnectAttempts++;
                    this.logger.warn(`[WhatsAppClient-${this.id}] Reconnect attempt #${this.reconnectAttempts} in ${config.whatsapp.reconnect.delayMs / 1000} seconds...`, { module: 'WhatsAppClient', accountId: this.id });
                    await new Promise(resolve => setTimeout(resolve, config.whatsapp.reconnect.delayMs));
                    try {
                        await this.client.initialize();
                    } catch (err) {
                        this.logger.error(`[WhatsAppClient-${this.id}] Error during re-initialization: ${err.message}`, { module: 'WhatsAppClient', accountId: this.id, error: err });
                        await this.accountRepository.updateStatus(this.id, 'reconnect_failed'); // Оновлюємо статус
                    }
                } else {
                    this.logger.error(`[WhatsAppClient-${this.id}] Max reconnect attempts (${config.whatsapp.reconnect.maxAttempts}) reached. Shutting down this client.`, { module: 'WhatsAppClient', accountId: this.id });
                    await this.accountRepository.updateStatus(this.id, 'failed_to_connect'); // Оновлюємо статус
                }
            }
        });

        this.client.on('auth_failure', async (msg) => { // Додаємо async
            this.logger.error(`[WhatsAppClient-${this.id}] Critical WhatsApp authentication error: ${msg}`, { module: 'WhatsAppClient', accountId: this.id });
            await this.accountRepository.updateStatus(this.id, 'auth_failed'); // Оновлюємо статус
        });

        // Додай інші події, які тобі потрібні
    }

    async initialize() {
        this.logger.info(`[WhatsAppClient-${this.id}] Initializing client...`, { module: 'WhatsAppClient', accountId: this.id });
        // Якщо хочеш, щоб не було повторного запиту QR-коду, якщо він вже є,
        // можна додати перевірку статусу в БД:
        // const account = await this.accountRepository.findById(this.id);
        // if (account && account.status === 'connected') {
        //     this.logger.info(`[WhatsAppClient-${this.id}] Account already connected, skipping QR.`, { module: 'WhatsAppClient', accountId: this.id });
        //     // Можливо, просто емітувати подію 'ready' або почекати її
        //     // client.emit('ready'); // Це може бути небезпечно, краще покладатися на WWebJS
        // } else {
            await this.client.initialize();
        // }
    }

    async destroy() {
        this.logger.info(`[WhatsAppClient-${this.id}] Destroying client...`, { module: 'WhatsAppClient', accountId: this.id });
        await this.client.destroy();
        await this.accountRepository.updateStatus(this.id, 'stopped'); // Оновлюємо статус
    }

    getClient() {
        return this.client;
    }

    getId() {
        return this.id;
    }
}

module.exports = WhatsAppClient;