/** Копирайт шага «Активы / текущий капитал» в B2C guest CJM. */

export const B2C_ASSETS_COACH_MESSAGE =
    'Отлично. С целями понятно. А какой у вас сейчас текущий капитал уже есть?';

export const B2C_ASSETS_VISUAL = {
    title: 'Ваш капитал — основа вашего будущего',
    description:
        'Понимание текущего капитала помогает построить эффективный финансовый план и достичь ваших целей быстрее.',
} as const;

export const B2C_ASSETS_FORM = {
    title: 'Какой у вас сейчас текущий капитал уже есть?',
    subtitle: 'Укажите общую сумму всех ваших активов.',
    fieldLabel: 'Текущий капитал',
    tip: 'Учитывайте все активы: недвижимость, инвестиции, накопления, бизнес и другие ценности.',
    trust: 'Ваши данные надёжно защищены и конфиденциальны',
} as const;

export const B2C_ASSETS_BADGES = [
    { id: 'growth', label: 'РОСТ КАПИТАЛА', icon: 'trending-up' as const },
    { id: 'protection', label: 'ФИНАНСОВАЯ ЗАЩИТА', icon: 'shield' as const },
    { id: 'diversification', label: 'ДИВЕРСИФИКАЦИЯ', icon: 'pie-chart' as const },
    { id: 'freedom', label: 'ФИНАНСОВАЯ СВОБОДА', icon: 'target' as const },
] as const;
