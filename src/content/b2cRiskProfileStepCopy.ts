/** Копирайт шага «Риск-профиль» в B2C guest CJM. */

export const B2C_RISK_PROFILE_FORM = {
    eyebrow: 'Риск-профилирование',
    title: 'Давайте определим ваш инвестиционный профиль',
    description:
        'Ответьте на несколько вопросов — это поможет подобрать оптимальную стратегию для достижения ваших целей.',
    whyTitle: 'Зачем это нужно?',
    whyText:
        'Риск-профиль помогает понять, какой уровень колебаний рынка вам комфортен, и подобрать стратегию под ваши цели и горизонт.',
    timeEstimate: 'Примерное время: 2–3 минуты',
    progressLabel: (current: number, total: number) => `Прогресс: ${current} из ${total}`,
    questionLabel: (current: number, total: number) => `Вопрос ${current} из ${total}`,
    loadingQuestionnaire: 'Загружаем анкету риск-профиля…',
    emptyQuestionnaire: 'Не удалось получить анкету риск-профиля. Попробуйте ещё раз или обновите страницу.',
    retryQuestionnaire: 'Загрузить анкету снова',
    handoffTitle: 'Готово',
    handoffText: 'Риск-профиль заполнен. Сейчас запустим расчёт персонального плана.',
    calculatingTitle: 'Считаем персональный план',
    calculatingText: 'Учитываем ответы по риск-профилю, цели и капитал. Обычно это несколько секунд.',
} as const;

export const B2C_RISK_PROFILE_WHY_BULLETS = [
    { id: 'personal', label: 'Персонализированный инвестиционный подход', icon: 'target' as const },
    { id: 'calm', label: 'Снижение эмоционального стресса от колебаний рынка', icon: 'shield' as const },
    { id: 'confidence', label: 'Больше уверенности в принятии решений', icon: 'chart' as const },
] as const;
