// src/api/index.js
const express = require('express');
const logger = require('../core/Logger');
const config = require('../../config');
const systemRoutes = require('./routes/system.routes'); // Скоро створимо
// const authRoutes = require('./routes/auth.routes'); // Пізніше
// const accountsRoutes = require('./routes/accounts.routes'); // Пізніше

const app = express();
app.use(express.json());

// Загальні маршрути (статус, логи)
app.use('/api/system', systemRoutes);
// app.use('/api/auth', authRoutes); // Маршрути аутентифікації
// app.use('/api/accounts', accountsRoutes); // Маршрути управління акаунтами

// Middleware для обробки помилок (завжди в кінці)
app.use((err, req, res, next) => {
    logger.error(`[HTTP API] Unhandled error: ${err.message}`, err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

module.exports = app; // Експортуємо сам додаток Express