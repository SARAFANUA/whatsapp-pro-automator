// src/api/routes/accounts.routes.js
const express = require('express');
const router = express.Router();
const AccountController = require('../controllers/AccountController'); // Створимо цей контролер

// Маршрути для акаунтів
router.get('/', AccountController.getAllAccounts); // Отримати список всіх акаунтів
router.post('/register', AccountController.registerAccount); // Зареєструвати новий акаунт (повернути QR)
router.post('/:accountId/start', AccountController.startAccount); // Запустити акаунт
router.post('/:accountId/stop', AccountController.stopAccount); // Зупинити акаунт
router.delete('/:accountId', AccountController.deleteAccount); // Видалити акаунт

module.exports = router;