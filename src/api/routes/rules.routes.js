// src/api/routes/rules.routes.js
const express = require('express');
const router = express.Router();
const RuleController = require('../controllers/RuleController'); // Створимо цей контролер

// Маршрути для правил пересилання
router.post('/', RuleController.addRule); // Додати нове правило
router.get('/:accountId', RuleController.getRulesByAccount); // Отримати всі правила для акаунта
router.put('/:ruleId', RuleController.updateRule); // Оновити правило
router.delete('/:ruleId', RuleController.deleteRule); // Видалити правило

module.exports = router;