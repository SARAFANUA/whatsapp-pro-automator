// src/features/message-forwarding/filters/FilterProcessor.js
// Можемо імпортувати конкретні типи фільтрів тут, якщо вони будуть складними

class FilterProcessor {
    constructor(logger) {
        this.logger = logger;
        this.logger.info('[FilterProcessor] Initialized.', { module: 'FilterProcessor' });
    }

    /**
     * Застосовує фільтри до повідомлення відповідно до правил.
     * @param {object} message - Об'єкт повідомлення whatsapp-web.js.
     * @param {object} rule - Об'єкт правила пересилання з БД.
     * @returns {boolean} True, якщо повідомлення пройшло всі фільтри, False - якщо відфільтровано.
     */
    applyFilters(message, rule) {
        // Якщо правило неактивне, то, блять, не пересилаємо.
        if (!rule.isActive) {
            this.logger.debug(`[FilterProcessor] Rule ${rule.id} is inactive, message filtered out.`, { module: 'FilterProcessor', ruleId: rule.id });
            return false;
        }

        // Тип фільтра: 'none', 'text_contains', 'regex', 'media_only', etc.
        const filterType = rule.filterType;
        const filterValue = rule.filterValue;

        switch (filterType) {
            case 'none':
                // Фільтр відсутній, повідомлення завжди проходить
                return true;
            case 'text_contains':
                if (message.type !== 'chat' && message.type !== 'image' && message.type !== 'document') {
                    // Тільки текстові повідомлення або медіа з підписом
                    this.logger.debug(`[FilterProcessor] Message type ${message.type} is not applicable for 'text_contains' filter.`, { module: 'FilterProcessor', messageType: message.type });
                    return false;
                }
                // Перевіряємо, чи тіло повідомлення (або підпис медіа) містить ключове слово
                const content = (message.body || message.caption || '').toLowerCase();
                const keyword = filterValue.toLowerCase();
                if (!content.includes(keyword)) {
                    this.logger.debug(`[FilterProcessor] Message does not contain keyword "${keyword}". Filtered out.`, { module: 'FilterProcessor', keyword: keyword });
                    return false;
                }
                return true;
            case 'regex':
                if (message.type !== 'chat' && message.type !== 'image' && message.type !== 'document') {
                    this.logger.debug(`[FilterProcessor] Message type ${message.type} is not applicable for 'regex' filter.`, { module: 'FilterProcessor', messageType: message.type });
                    return false;
                }
                const regexContent = (message.body || message.caption || '');
                try {
                    const regex = new RegExp(filterValue);
                    if (!regex.test(regexContent)) {
                        this.logger.debug(`[FilterProcessor] Message does not match regex "${filterValue}". Filtered out.`, { module: 'FilterProcessor', regex: filterValue });
                        return false;
                    }
                } catch (e) {
                    this.logger.error(`[FilterProcessor] Invalid regex "${filterValue}" in rule ${rule.id}: ${e.message}`, { module: 'FilterProcessor', ruleId: rule.id, regex: filterValue, error: e });
                    return false; // Неправильний регекс, відхиляємо повідомлення
                }
                return true;
            case 'media_only':
                if (!message.hasMedia) {
                    this.logger.debug(`[FilterProcessor] Message is not media. Filtered out.`, { module: 'FilterProcessor' });
                    return false;
                }
                return true;
            case 'text_only':
                if (message.type !== 'chat' || message.hasMedia) { // Якщо це чат і немає медіа
                    this.logger.debug(`[FilterProcessor] Message is not text only. Type: ${message.type}, hasMedia: ${message.hasMedia}. Filtered out.`, { module: 'FilterProcessor' });
                    return false;
                }
                return true;
            // Додай більше типів фільтрів, якщо потрібно
            case 'ignore_plus_sign': // Фільтр з попередньої версії (ігнорувати '+' у чаті)
                if (message.type === 'chat' && message.body.trim() === '+') {
                    this.logger.debug(`[FilterProcessor] Message is '+' only. Filtered out.`, { module: 'FilterProcessor' });
                    return false;
                }
                return true;
            default:
                this.logger.warn(`[FilterProcessor] Unknown filter type "${filterType}" in rule ${rule.id}. Message passed by default.`, { module: 'FilterProcessor', ruleId: rule.id, filterType: filterType });
                return true; // Якщо невідомий тип фільтра, не фільтруємо
        }
    }
}

module.exports = FilterProcessor;