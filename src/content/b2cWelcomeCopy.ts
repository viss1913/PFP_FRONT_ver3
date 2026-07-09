export type B2cWelcomeFeature = {
    id: string;
    title: string;
    icon: 'target' | 'clock' | 'shield' | 'chart';
};

/** Одно приветственное сообщение Виктории — всё по порядку в одном bubble. */
export function buildB2cWelcomeChatMessage(inviterName?: string): string {
    const inviteLine = inviterName
        ? ` Вас пригласил ${inviterName} — он будет вашим консультантом, когда вы сохраните план.`
        : '';

    return [
        `Здравствуйте! Я — Виктория, ваш AI-консультант и финансовый советник.${inviteLine}`,
        '',
        'Я помогу создать персональный финансовый план за несколько минут: спрошу о целях, ситуации и приоритетах — без сложных терминов.',
        '',
        'На платформе собраны лучшие продукты для вас и вашей семьи. Есть и инвестиционные стратегии, которые показывают феноменальные результаты — до 98% годовых.',
        '',
        'Всё по порядку: сначала цели и план, потом подбор решений. Готовы начать?',
    ].join('\n');
}

/** @deprecated используйте buildB2cWelcomeChatMessage */
export function buildB2cWelcomeChatMessages(inviterName?: string): string[] {
    return [buildB2cWelcomeChatMessage(inviterName)];
}

export const B2C_WELCOME_HERO = {
    brand: 'FAMILY OFFICE',
    headlineBefore: 'Откройте двери в ваш',
    headlineAccent: 'Family Office',
    subtitle: 'Персональный финансовый план, созданный для вас и вашей семьи.',
    cta: 'Открыть свой Family Office',
    trust: 'Ваши данные под защитой',
} as const;

export const B2C_WELCOME_FEATURES: B2cWelcomeFeature[] = [
    { id: 'goals', title: 'Понимание целей и сроков', icon: 'target' },
    { id: 'plan', title: 'Персональный финансовый план', icon: 'clock' },
    { id: 'protect', title: 'Рекомендации по защите и резерву', icon: 'shield' },
    { id: 'invest', title: 'Инвестиционную стратегию', icon: 'chart' },
];
