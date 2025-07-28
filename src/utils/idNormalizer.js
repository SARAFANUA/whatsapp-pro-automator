// src/utils/idNormalizer.js
/**
 * Функція для нормалізації ID повідомлень (видаляє суфікс _числа@lid)
 * @param {string} id - ID повідомлення.
 * @returns {string} Нормалізований ID.
 */
function normalizeMessageId(id) {
    const match = id.match(/^(.*)(_\d+@lid)$/);
    if (match && match[1]) {
        return match[1];
    }
    return id;
}

module.exports = { normalizeMessageId };