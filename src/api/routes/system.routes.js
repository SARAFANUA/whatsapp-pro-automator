// src/api/routes/system.routes.js
const express = require('express');
const router = express.Router();
const SystemController = require('../controllers/SystemController'); // Скоро створимо
const authMiddleware = require('../middlewares/auth.middleware'); // Скоро створимо

// Застосовуємо authMiddleware до всіх маршрутів, що потребують авторизації
router.use(authMiddleware.verifyApiKey);

router.get('/status', SystemController.getStatus);
router.get('/logs', SystemController.getLogs);
// Додай інші системні маршрути, наприклад, перезавантаження, метрики

module.exports = router;