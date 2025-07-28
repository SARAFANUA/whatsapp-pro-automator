// src/api/routes/system.routes.js
const express = require('express');
const router = express.Router();
const SystemController = require('../controllers/SystemController');
// const authMiddleware = require('../middlewares/auth.middleware'); // !!! ВИДАЛИ ЦЕЙ РЯДОК !!!

// !!! ВИДАЛИ ЦЕЙ РЯДОК !!!
// router.use(authMiddleware.verifyApiKey);

router.get('/status', SystemController.getStatus);
router.get('/logs', SystemController.getLogs);

module.exports = router;