/** Текст AI-консультанта на шаге выбора целей (B2C guest). */
export const B2C_GOAL_SELECTION_YOUNG_PENSION_ADVICE =
    'Выберите вашу первую цель. До пенсии ещё есть время — но именно сейчас удобнее всего заложить «Достойную пенсию» как опору плана: решим, какой доход вам нужен, и посчитаем путь к нему. Остальные цели добавим следующим шагом.';

export const B2C_GOAL_SELECTION_PENSION_ADVICE = {
    lead:
        'Если смотреть на ваш капитал стратегически, я бы начала с цели «Достойная пенсия».',
    body:
        'Это якорь всего плана: вы фиксируете комфортный уровень жизни после выхода на пенсию и переводите его из абстракции в конкретную цифру. Квартира, пассивный доход и резерв логичнее добавлять вторым эшелоном — уже поверх этого фундамента.',
    closing:
        'Так план остаётся цельной системой, а не набором разрозненных желаний.',
} as const;

export const B2C_GOAL_SELECTION_PENSION_ADVICE_SHORT =
    'Выберите вашу первую цель. Я бы начала с «Достойной пенсии» — это якорь плана. Остальные цели добавим следующим шагом.';

export const B2C_GOAL_HERO_PASSIVE = {
    badge: 'Рекомендуем начать с этого',
    title: 'Пассивный доход на пенсии',
    description:
        'Создайте стабильный источник дохода в будущем, чтобы жить свободно и уверенно.',
    cta: 'Выбрать цель',
} as const;

export const B2C_GOAL_HERO_PENSION = {
    badge: 'Рекомендуем начать с этого',
    title: 'Достойная пенсия',
    description:
        'Зафиксируйте комфортный уровень жизни после выхода на пенсию — это фундамент всего плана.',
    cta: 'Выбрать цель',
} as const;

export const B2C_GOAL_HERO_INHERITANCE = {
    badge: 'Рекомендуем начать с этого',
    title: 'Наследство',
    description: 'Сформируйте капитал для передачи близким — надёжный семейный фундамент.',
    cta: 'Выбрать цель',
} as const;

/** Длинные подписи карточек сетки B2C guest (не трогаем GOAL_GALLERY_ITEMS). */
export const B2C_GUEST_GOAL_CARD_COPY: Record<string, { description: string }> = {
    passive: {
        description: 'Создать источник дохода, который работает без ежедневного участия.',
    },
    apartment: {
        description: 'Накопить на покупку квартиры или улучшение жилья для семьи.',
    },
    house: {
        description: 'Купить или построить загородный дом для отдыха и жизни.',
    },
    travel: {
        description: 'Откладывать на путешествия мечты — без удара по бюджету.',
    },
    capital: {
        description: 'Сформировать целевой капитал под крупную покупку или проект.',
    },
    business: {
        description: 'Накопить стартовый капитал на свой бизнес или долю в проекте.',
    },
    inheritance: {
        description: 'Передать близким финансовую опору — капитал и спокойствие.',
    },
    invest_save: {
        description: 'Сохранить сбережения и приумножить их с учётом вашего профиля.',
    },
    rent: {
        description: 'Получать стабильный ежемесячный доход от капитала или недвижимости.',
    },
    auto: {
        description: 'Накопить на автомобиль — новый или с пробегом, без кредитной нагрузки.',
    },
    mortgage: {
        description: 'Собрать первый взнос на ипотеку и снизить ежемесячный платёж.',
    },
    move: {
        description: 'Подготовить бюджет на переезд — жильё, ремонт и обустройство.',
    },
    other: {
        description: 'Любая личная цель: назовите её и заложим в план.',
    },
};

export function getB2cGuestGoalCardDescription(item: {
    id: string;
    description?: string;
    childFirstName?: string;
}): string {
    if (item.childFirstName?.trim()) {
        const name = item.childFirstName.trim();
        return `Накопить на обучение ${name} к 17 годам — вуз, съём и старт во взрослую жизнь.`;
    }
    return B2C_GUEST_GOAL_CARD_COPY[item.id]?.description ?? item.description ?? '';
}

/** Порядок карточек в сетке B2C (кроме hero и образования детей). */
export const B2C_GUEST_GOAL_GRID_IDS = [
    'passive',
    'apartment',
    'house',
    'travel',
    'capital',
    'business',
    'inheritance',
    'invest_save',
    'rent',
    'auto',
    'mortgage',
    'move',
    'other',
] as const;

export function getB2cGoalCoachMessage(clientAge: number): string {
    if (clientAge > 60) {
        return 'Выберите вашу первую цель. Логично начать с «Наследства» — передать капитал семье. Остальное добавим дальше.';
    }
    if (clientAge >= 55) {
        return B2C_GOAL_SELECTION_PENSION_ADVICE_SHORT;
    }
    return B2C_GOAL_SELECTION_YOUNG_PENSION_ADVICE;
}

export function getB2cFeaturedGoalGalleryId(clientAge: number): 'passive' | 'pension' | 'inheritance' {
    if (clientAge > 60) return 'inheritance';
    return 'pension';
}

export const AGENT_GOAL_SELECTION_DEFAULT_ADVICE =
    'Выберите вашу первую цель. Я бы порекомендовала начать с создания пассивного дохода в будущем. Потом сможете добавить любую другую.';
