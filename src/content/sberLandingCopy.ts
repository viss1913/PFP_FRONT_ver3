export interface SberLandingCopy {
    header: {
        productName: string;
        groupLabel: string;
        groupItems: { label: string; href: string }[];
        login: string;
        themeLight: string;
        themeDark: string;
    };
    hero: {
        pill: string;
        title: string;
        titleAccent: string;
        subtitle: string;
        ctaPrimary: string;
    };
    familyAdvantages: {
        title: string;
        intro: string;
        items: { title: string; text: string }[];
        statsTitle: string;
        stats: { value: string; label: string }[];
    };
    benefits: {
        title: string;
        items: { title: string; text: string; iconKey: 'goals' | 'growth' | 'control' }[];
    };
    ecosystem: {
        title: string;
        items: {
            id: string;
            name: string;
            text: string;
            partnerKey: 'bank' | 'npf' | 'life' | 'pervaya' | 'invest';
        }[];
    };
    steps: {
        id: string;
        title: string;
        items: { step: string; title: string; text: string }[];
        cta: string;
    };
    footer: {
        links: { label: string; href: string }[];
        phone: string;
        phoneHref: string;
    };
}

export const sberLandingCopy: SberLandingCopy = {
    header: {
        productName: 'Family Office',
        groupLabel: 'Группа Сбера',
        groupItems: [
            { label: 'Сбер', href: '#ecosystem' },
            { label: 'Сбер НПФ', href: '#ecosystem' },
            { label: 'Сбер Страхование жизни', href: '#ecosystem' },
            { label: 'Первая', href: '#ecosystem' },
            { label: 'Сбер Инвестиции', href: '#ecosystem' },
        ],
        login: 'Войти в кабинет',
        themeLight: 'Светлая тема',
        themeDark: 'Тёмная тема',
    },
    hero: {
        pill: 'Партнёрский канал',
        title: 'Ваш личный',
        titleAccent: 'Family Office в Сбере',
        subtitle:
            'Единый центр управления семейным капиталом: цели, защита, накопления и отчётность в одном месте — для семьи и для профессионала.',
        ctaPrimary: 'Открыть Family Office',
    },
    familyAdvantages: {
        title: 'Почему семье нужен Family Office',
        intro:
            'Family office — это единый центр управления финансами семьи: цели, капитал, защита, накопления и отчётность в одном месте, а не разрозненные счета и разовые «планы в PDF». Вы видите полную картину и можете действовать согласованно — для себя и для близких.',
        items: [
            {
                title: 'Единая стратегия',
                text: 'Все цели, счета и решения связаны в одном плане — без противоречий между банком, инвестициями и страхованием.',
            },
            {
                title: 'Контроль рисков',
                text: 'Понимаете, где семья уязвима: ликвидность, валюта, рынок, здоровье — и закрываете риски осознанно.',
            },
            {
                title: 'Защита семьи',
                text: 'Страхование, резервы и долгий горизонт встроены в общую картину, а не покупаются «на всякий случай».',
            },
            {
                title: 'Преемственность',
                text: 'План и отчётность понятны наследникам и консультанту — капитал не теряется при смене поколения.',
            },
        ],
        statsTitle: 'Почему единый центр важен',
        stats: [
            { value: '67%', label: 'людей не имеют финансового плана' },
            { value: '78%', label: 'живут от зарплаты до зарплаты' },
            { value: '10×', label: 'больше капитала у тех, кто планирует заранее' },
        ],
    },
    benefits: {
        title: 'Что вы получаете в своём Family Office',
        items: [
            {
                iconKey: 'goals',
                title: 'Управляйте целями',
                text: 'Финансовый план семьи, статусы целей и прогресс в одном кабинете.',
            },
            {
                iconKey: 'growth',
                title: 'Сохраняйте и приумножайте',
                text: 'Инвестиции, страхование и накопления — связанные с вашей стратегией.',
            },
            {
                iconKey: 'control',
                title: 'Контролируйте всё в одном месте',
                text: 'Сводная отчётность и сопровождение без разрозненных таблиц.',
            },
        ],
    },
    ecosystem: {
        title: 'Сильная команда Сбера для вашего благосостояния',
        items: [
            {
                id: 'bank',
                name: 'Сбер',
                text: 'Премиальное банковское обслуживание и сервисы для семьи.',
                partnerKey: 'bank',
            },
            {
                id: 'npf',
                name: 'Сбер НПФ',
                text: 'Негосударственное пенсионное обеспечение и долгий горизонт.',
                partnerKey: 'npf',
            },
            {
                id: 'life',
                name: 'Сбер Страхование жизни',
                text: 'Защита семьи и накопительные программы.',
                partnerKey: 'life',
            },
            {
                id: 'pervaya',
                name: 'Первая',
                text: 'Профессиональное управление активами.',
                partnerKey: 'pervaya',
            },
            {
                id: 'invest',
                name: 'Сбер Инвестиции',
                text: 'Брокерский доступ и рынки капитала.',
                partnerKey: 'invest',
            },
        ],
    },
    steps: {
        id: 'how-it-works',
        title: 'Откройте свой Family Office онлайн',
        items: [
            {
                step: '1',
                title: 'Регистрация',
                text: 'Заполните короткую форму — это займёт около 2 минут.',
            },
            {
                step: '2',
                title: 'Настройка профиля',
                text: 'Определите цели семьи и подключите нужные продукты.',
            },
            {
                step: '3',
                title: 'Управление капиталом',
                text: 'Работайте с инструментами и отчётами в личном кабинете.',
            },
        ],
        cta: 'Открыть Family Office',
    },
    footer: {
        links: [
            { label: 'О сервисе', href: '#family-advantages' },
            { label: 'Вопросы и ответы', href: '#how-it-works' },
            { label: 'Документы', href: '#' },
            { label: 'Контакты', href: '#footer-contacts' },
        ],
        phone: '8 800 555-55-50',
        phoneHref: 'tel:88005555550',
    },
};
