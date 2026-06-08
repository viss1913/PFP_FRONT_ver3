export type LandingLang = 'ru' | 'en';

export interface LandingCopy {
    header: {
        login: string;
        themeLight: string;
        themeDark: string;
        nav: {
            familyOffice: string;
            services: string;
            consultant: string;
            tools: string;
            education: string;
            partners: string;
        };
    };
    familyOffice: {
        title: string;
        definition: string;
        forClient: { label: string; title: string; description: string };
        forAgent: { label: string; title: string; description: string };
        pillars: string[];
    };
    hero: {
        pill: string;
        title: string;
        titleAccent: string;
        subtitle: string;
        cta: string;
    };
    stats: {
        title: string;
        items: { value: string; label: string }[];
        benefitsTitle: string;
        benefits: string[];
    };
    services: {
        title: string;
        subtitle: string;
        items: { title: string; description: string }[];
    };
    consultant: {
        title: string;
        subtitle: string;
        /** SEO-абзац под блоком для агентов (B2B-ключи). */
        seoIntro: string;
        benefits: string[];
        dashboardTitle: string;
        totalClients: string;
        monthlyIncome: string;
        applyCta: string;
    };
    howItWorks: {
        title: string;
        subtitle: string;
        steps: { title: string; description: string }[];
    };
    faq: {
        title: string;
        items: { q: string; a: string }[];
    };
    leadForm: {
        general: { title: string; subtitle: string; submit: string };
        client: { title: string; subtitle: string; submit: string };
        consultant: { title: string; subtitle: string; submit: string };
        nameLabel: string;
        phoneLabel: string;
        emailLabel: string;
        consentLabel: string;
        consentRequired: string;
        submitting: string;
        successTitle: string;
        successMessage: string;
        error: string;
        hasAccount: string;
        loginLink: string;
    };
    journey: {
        title: string;
        subtitle: string;
        steps: { title: string; description: string }[];
    };
    tools: {
        title: string;
        subtitle: string;
        items: { title: string; description: string }[];
    };
    education: {
        title: string;
        subtitle: string;
        videoTitle: string;
        videoAria: string;
        features: string[];
        disclaimer: string;
    };
    successPath: {
        title: string;
        steps: { title: string; description: string }[];
    };
    testimonials: {
        title: string;
        items: { name: string; role: string; quote: string }[];
    };
    partners: {
        title: string;
    };
    finalCta: {
        title: string;
        subtitle: string;
        cta: string;
    };
    footer: {
        tagline: string;
        copyright: string;
        privacy: string;
        legalEntity: string;
        disclaimer: string;
    };
    cookies: {
        message: string;
        accept: string;
        learnMore: string;
        pdnLabel: string;
        pdnRequired: string;
    };
    privacy: {
        title: string;
        stub: string;
        backHome: string;
        sections: { heading: string; body: string }[];
    };
}

export const landingCopy: Record<LandingLang, LandingCopy> = {
    ru: {
        header: {
            login: 'Войти',
            themeLight: 'Светлая',
            themeDark: 'Тёмная',
            nav: {
                familyOffice: 'Family office',
                services: 'Возможности',
                consultant: 'Для агентов',
                tools: 'Инструменты',
                education: 'Обучение',
                partners: 'Партнёры',
            },
        },
        familyOffice: {
            title: 'Что такое family office?',
            definition:
                'Family office (семейный офис) — это единый центр управления финансами семьи: цели, капитал, защита, накопления и отчётность в одном месте, а не разрозненные счета и «планы в PDF». BankFuture даёт технологию и методологию — вы получаете формат family office с поддержкой профессионала.',
            forClient: {
                label: 'Для клиента',
                title: 'Личный family office',
                description:
                    'Ваш кабинет: цели семьи, финансовый план, риски, страхование и пенсия — всё связано и обновляется. Как «штаб» для вашего капитала, без хаоса в таблицах.',
            },
            forAgent: {
                label: 'Для агента',
                title: 'Свой family office под брендом',
                description:
                    'Вы открываете практику формата family office: свои клиенты, CRM, расчёты, обучение и продукты партнёров — не «консультант с Excel», а полноценный семейный офис на платформе.',
            },
            pillars: [
                'Единая картина капитала и целей',
                'Защита семьи и долгий горизонт',
                'Инвестиции и накопления',
                'Отчётность и сопровождение',
            ],
        },
        hero: {
            pill: 'Ваш капитал. Ваша семья. Один офис.',
            title: 'Family office',
            titleAccent: 'для вашей семьи.',
            subtitle:
                'BankFuture объединяет планирование, инструменты и партнёров в одном family office — для семьи и для профессионалов.',
            cta: 'Открыть Family Office',
        },
        stats: {
            title: 'Почему семьям нужен единый центр управления',
            items: [
                { value: '67%', label: 'людей не имеют финансового плана' },
                { value: '78%', label: 'живут от зарплаты до зарплаты' },
                { value: '10×', label: 'больше капитала у тех, кто планирует заранее' },
            ],
            benefitsTitle: 'Что даёт family office',
            benefits: ['Единая стратегия', 'Контроль рисков', 'Защита семьи', 'Преемственность'],
        },
        services: {
            title: 'Возможности вашего family office',
            subtitle: 'Столпы управления семейным капиталом на платформе BankFuture',
            items: [
                { title: 'Стратегия и цели семьи', description: 'Финансовый план как основа family office' },
                { title: 'Капитал и инвестиции', description: 'Портфель и сценарии с учётом риск-профиля' },
                { title: 'Защита и страхование', description: 'Риски, которые нельзя переложить на рынок' },
                { title: 'Накопления и пенсия', description: 'Долгий горизонт и финансовая независимость' },
                { title: 'Бюджет и ликвидность', description: 'Понятный денежный поток семьи' },
                { title: 'Отчётность и сопровождение', description: 'Одна картина — для вас и вашего консультанта' },
            ],
        },
        consultant: {
            title: 'Запустите свой family office',
            subtitle: 'Для агентов и консультантов: своя практика семейного офиса на базе BankFuture',
            seoIntro:
                'BankFuture — платформа для финансовых консультантов и агентов, которые хотят запустить family office (семейный офис) без Excel и разовых PDF. В одном личном кабинете — CRM, расчёт финансового плана клиенту онлайн, отчёты для семьи и доступ к продуктам партнёров. Это софт для финансового планирования и сопровождения: вы ведёте практику как семейный офис, а не как «консультант с таблицами».',
            benefits: [
                'Свой бренд и клиентская база',
                'CRM и калькуляторы family office',
                'Обучение и сертификация',
                'Продукты партнёров (инвестиции, страхование, НПФ)',
                'Сообщество практиков',
            ],
            dashboardTitle: 'Обзор панели',
            totalClients: 'Всего клиентов',
            monthlyIncome: 'Доход за месяц',
            applyCta: 'Оставить заявку',
        },
        howItWorks: {
            title: 'Как открыть личный family office',
            subtitle: 'Три шага для клиента',
            steps: [
                { title: 'Заявка', description: 'Оставьте контакты — подберём формат' },
                { title: 'Сессия с консультантом', description: 'Цели семьи, риски, горизонт капитала' },
                { title: 'Ваш кабинет', description: 'Личный family office в BankFuture — план и сопровождение' },
            ],
        },
        faq: {
            title: 'Частые вопросы',
            items: [
                {
                    q: 'Что такое family office простыми словами?',
                    a: 'Это «штаб» для финансов семьи: не один разовый план, а постоянный центр — цели, капитал, защита, отчёты. У состоятельных семей так устроено десятилетиями; BankFuture делает этот формат доступнее.',
                },
                {
                    q: 'Чем family office отличается от финансового плана?',
                    a: 'План — часть office. Family office — это кабинет, процессы, сопровождение и единая картина, а не PDF один раз в год.',
                },
                {
                    q: 'Это инвестиционная рекомендация?',
                    a: 'Нет. Материалы носят информационный характер. Решения принимаются с учётом вашей ситуации и с участием консультанта.',
                },
                {
                    q: 'Как консультанту запустить family office на BankFuture?',
                    a: 'Оставьте заявку в блоке для агентов. После онбординга вы получаете CRM, обучение, методологию family office и доступ к партнёрским продуктам — инвестиции, страхование, НПФ.',
                },
                {
                    q: 'Чем BankFuture отличается от Excel и разовых PDF-планов?',
                    a: 'План живёт в платформе: цели, сценарии, продукты и отчёты обновляются, клиент видит единую картину. Это формат семейного офиса с сопровождением, а не файл раз в год.',
                },
                {
                    q: 'Есть ли CRM и отчёты для клиентов?',
                    a: 'Да. В кабинете консультанта — CRM, расчёт финансового плана, карточка клиента и PDF-отчёты для семьи. Всё в одной программе для финансового планирования.',
                },
                {
                    q: 'Подходит ли платформа независимым финансовым консультантам?',
                    a: 'Да. BankFuture рассчитан на агентов и консультантов с собственной клиентской базой: свой бренд, практика family office и продукты партнёров на одной платформе.',
                },
                {
                    q: 'На каком языке интерфейс?',
                    a: 'Рабочий интерфейс сервиса — на русском. Лендинг — на русском и английском.',
                },
            ],
        },
        leadForm: {
            general: {
                title: 'Заявка в BankFuture',
                subtitle: 'Оставьте контакты — подберём формат family office и свяжемся с вами',
                submit: 'Отправить заявку',
            },
            client: {
                title: 'Открыть личный family office',
                subtitle: 'Оставьте контакты — расскажем, как устроен ваш кабинет',
                submit: 'Отправить заявку',
            },
            consultant: {
                title: 'Открыть свой family office',
                subtitle: 'Для агентов: заявка на запуск практики на BankFuture',
                submit: 'Отправить заявку',
            },
            nameLabel: 'Имя',
            phoneLabel: 'Телефон',
            emailLabel: 'Email (необязательно)',
            consentLabel:
                'Согласен(на) на обработку персональных данных в соответствии с политикой конфиденциальности ООО «ЦУПРФ»',
            consentRequired: 'Необходимо согласие на обработку персональных данных',
            submitting: 'Отправка…',
            successTitle: 'Заявка отправлена',
            successMessage: 'Мы свяжемся с вами в ближайшее время.',
            error: 'Не удалось отправить. Попробуйте позже или войдите в систему.',
            hasAccount: 'Уже есть аккаунт?',
            loginLink: 'Войти',
        },
        journey: {
            title: 'Путь агента: свой family office',
            subtitle: 'Три шага к запуску практики',
            steps: [
                { title: 'Заявка', description: 'Расскажите о себе и опыте' },
                { title: 'Онбординг', description: 'Методология family office и платформа' },
                { title: 'Старт', description: 'Первые клиенты и свой семейный офис' },
            ],
        },
        tools: {
            title: 'Инструменты family office',
            subtitle: 'Всё для ведения практики агента в одной платформе',
            items: [
                { title: 'Умная CRM', description: 'Клиенты, задачи и история в одном месте' },
                { title: 'Финансовые калькуляторы', description: 'Быстрые расчёты и сценарии' },
                { title: 'Цифровые предложения', description: 'Презентации и отчёты для клиентов' },
                { title: 'Аналитика эффективности', description: 'Метрики и рост практики' },
            ],
        },
        education: {
            title: 'Обучение, которое делает экспертов',
            subtitle: 'Видеоуроки, тесты и сертификация',
            videoTitle: 'Что такое family office',
            videoAria: 'Видео: что такое family office',
            features: ['Видеоуроки', 'Интерактивные тесты', 'Сертификация', 'База знаний', 'Менторство'],
            disclaimer: 'Интерфейс сервиса и рабочие инструменты — на русском языке.',
        },
        successPath: {
            title: 'Путь к успеху',
            steps: [
                { title: 'Присоединение', description: 'Регистрация и доступ к платформе' },
                { title: 'Обучение', description: 'Курсы и сертификация' },
                { title: 'Первые клиенты', description: 'Практика с наставником' },
                { title: 'Рост практики', description: 'Масштабирование дохода' },
                { title: 'Команда', description: 'Построение своей команды' },
            ],
        },
        testimonials: {
            title: 'Голоса практики',
            items: [
                { name: 'Елена Р.', role: 'Основатель family office', quote: 'Клиенты наконец видят всю картину — не куски в разных банках.' },
                { name: 'Дмитрий Т.', role: 'Агент BankFuture', quote: 'Запустил свой office за месяц — CRM и планирование из коробки.' },
                { name: 'София Л.', role: 'Семейный консультант', quote: 'Формат family office отсекает «хочу просто портфель» — работаем с семьёй целиком.' },
            ],
        },
        partners: {
            title: 'Наши партнёры',
        },
        finalCta: {
            title: 'Семейный капитал заслуживает своего офиса',
            subtitle: 'Один формат family office на платформе BankFuture — для семьи и для практики',
            cta: 'Открыть Family Office',
        },
        footer: {
            tagline: 'Платформа для family office',
            copyright: '© 2026 BankFuture. Все права защищены.',
            privacy: 'Политика конфиденциальности (ООО «ЦУПРФ»)',
            legalEntity: 'Оператор персональных данных: ООО «ЦУПРФ»',
            disclaimer:
                'Информация на сайте не является индивидуальной инвестиционной рекомендацией и не является офертой.',
        },
        cookies: {
            message: 'Мы используем cookie и обрабатываем персональные данные для улучшения работы сайта.',
            accept: 'Принять',
            learnMore: 'Подробнее',
            pdnLabel:
                'Согласен(на) на обработку персональных данных (ООО «ЦУПРФ») и использование cookie',
            pdnRequired: 'Отметьте согласие для продолжения',
        },
        privacy: {
            title: 'Политика конфиденциальности',
            stub: 'Оператор персональных данных: ООО «ЦУПРФ». Ниже — основные положения. Полный текст уточняется юристами.',
            backHome: 'На главную',
            sections: [
                {
                    heading: '1. Общие положения',
                    body: 'Настоящая политика определяет порядок обработки персональных данных пользователей сайта BankFuture оператором — ООО «ЦУПРФ».',
                },
                {
                    heading: '2. Какие данные обрабатываем',
                    body: 'Имя, контактный телефон, email, данные cookie и UTM-метки рекламных кампаний — при отправке заявок и использовании сайта.',
                },
                {
                    heading: '3. Цели обработки',
                    body: 'Обратная связь по заявкам, предоставление доступа к сервису, аналитика посещаемости (при вашем согласии на cookie).',
                },
                {
                    heading: '4. Права субъекта ПДн',
                    body: 'Вы вправе запросить уточнение, блокирование или удаление данных, направив обращение оператору.',
                },
                {
                    heading: '5. Контакты оператора',
                    body: 'ООО «ЦУПРФ». По вопросам обработки персональных данных — через официальные каналы компании.',
                },
            ],
        },
    },
    en: {
        header: {
            login: 'Sign in',
            themeLight: 'Light',
            themeDark: 'Dark',
            nav: {
                familyOffice: 'Family office',
                services: 'Capabilities',
                consultant: 'For agents',
                tools: 'Tools',
                education: 'Education',
                partners: 'Partners',
            },
        },
        familyOffice: {
            title: 'What is a family office?',
            definition:
                'A family office is a single command center for a family\'s finances: goals, capital, protection, savings, and reporting in one place — not scattered accounts and one-off PDF plans. BankFuture provides the technology and methodology so you can run a family-office format with professional support.',
            forClient: {
                label: 'For clients',
                title: 'Personal family office',
                description:
                    'Your dashboard: family goals, financial plan, risks, insurance, and retirement — connected and updated. A headquarters for your capital, without spreadsheet chaos.',
            },
            forAgent: {
                label: 'For agents',
                title: 'Your own family office brand',
                description:
                    'Launch a family-office practice: your clients, CRM, calculators, training, and partner products — not "consultant with Excel," but a full office on the platform.',
            },
            pillars: [
                'Unified view of capital and goals',
                'Family protection and long horizon',
                'Investments and savings',
                'Reporting and ongoing support',
            ],
        },
        hero: {
            pill: 'Your capital. Your family. One office.',
            title: 'A family office',
            titleAccent: 'built for you.',
            subtitle:
                'BankFuture unites planning, tools, and partners in one family office — for families and for professionals.',
            cta: 'Open Family Office',
        },
        stats: {
            title: 'Why families need one command center',
            items: [
                { value: '67%', label: 'of people have no financial plan' },
                { value: '78%', label: 'live paycheck to paycheck' },
                { value: '10×', label: 'more wealth for those who plan early' },
            ],
            benefitsTitle: 'What a family office gives you',
            benefits: ['One strategy', 'Risk control', 'Family protection', 'Legacy mindset'],
        },
        services: {
            title: 'Your family office capabilities',
            subtitle: 'Pillars of family capital management on BankFuture',
            items: [
                { title: 'Family strategy & goals', description: 'Financial plan as the core of your office' },
                { title: 'Capital & investments', description: 'Portfolio and scenarios by risk profile' },
                { title: 'Protection & insurance', description: 'Risks markets cannot absorb alone' },
                { title: 'Savings & retirement', description: 'Long horizon and independence' },
                { title: 'Budget & liquidity', description: 'Clear family cash flow' },
                { title: 'Reporting & support', description: 'One picture for you and your advisor' },
            ],
        },
        consultant: {
            title: 'Launch your family office',
            subtitle: 'For agents and advisors: your family-office practice on BankFuture',
            seoIntro:
                'BankFuture is a platform for financial advisors and agents who want to run a family office practice without Excel and one-off PDFs. One dashboard combines CRM, online financial planning for clients, family reports, and partner products — software for ongoing planning, not spreadsheet chaos.',
            benefits: [
                'Your brand and client base',
                'Family-office CRM and calculators',
                'Training and certification',
                'Partner products (investments, insurance, pension)',
                'Practitioner community',
            ],
            dashboardTitle: 'Dashboard Overview',
            totalClients: 'Total Clients',
            monthlyIncome: 'Monthly Income',
            applyCta: 'Apply now',
        },
        howItWorks: {
            title: 'How to open a personal family office',
            subtitle: 'Three steps for clients',
            steps: [
                { title: 'Apply', description: 'Leave contacts — we will suggest the right format' },
                { title: 'Advisor session', description: 'Family goals, risks, capital horizon' },
                { title: 'Your dashboard', description: 'Personal family office in BankFuture — plan and support' },
            ],
        },
        faq: {
            title: 'FAQ',
            items: [
                {
                    q: 'What is a family office in simple terms?',
                    a: 'A headquarters for family finances: not a one-off plan, but an ongoing center for goals, capital, protection, and reports. Wealthy families have done this for decades; BankFuture makes the format more accessible.',
                },
                {
                    q: 'How is it different from a financial plan?',
                    a: 'The plan is part of the office. A family office is the dashboard, processes, support, and unified view — not a PDF once a year.',
                },
                {
                    q: 'Is this investment advice?',
                    a: 'No. Materials are informational. Decisions depend on your situation and involve your advisor.',
                },
                {
                    q: 'How do advisors launch a family office on BankFuture?',
                    a: 'Apply in the agent section. After onboarding you get CRM, training, family-office methodology, and partner products.',
                },
                {
                    q: 'How is BankFuture different from Excel and one-off PDF plans?',
                    a: 'The plan lives on the platform: goals, scenarios, products, and reports stay updated. It is an ongoing family-office format, not a file once a year.',
                },
                {
                    q: 'Is there CRM and reporting for clients?',
                    a: 'Yes. Advisor dashboard includes CRM, financial plan calculation, client cards, and PDF reports for families.',
                },
                {
                    q: 'Is it for independent financial advisors?',
                    a: 'Yes. Built for agents and advisors with their own client base, brand, and family-office practice on one platform.',
                },
                {
                    q: 'What language is the app?',
                    a: 'The service interface is in Russian. This landing is in RU and EN.',
                },
            ],
        },
        leadForm: {
            general: {
                title: 'Apply to BankFuture',
                subtitle: 'Leave your contacts — we will suggest the right family office format',
                submit: 'Submit request',
            },
            client: {
                title: 'Open personal family office',
                subtitle: 'Leave contacts — we will explain your dashboard',
                submit: 'Submit request',
            },
            consultant: {
                title: 'Launch your family office',
                subtitle: 'For agents: apply to start your practice on BankFuture',
                submit: 'Submit application',
            },
            nameLabel: 'Name',
            phoneLabel: 'Phone',
            emailLabel: 'Email (optional)',
            consentLabel:
                'I agree to the processing of personal data under the privacy policy of LLC TSUPRF',
            consentRequired: 'Personal data consent is required',
            submitting: 'Sending…',
            successTitle: 'Request sent',
            successMessage: 'We will contact you shortly.',
            error: 'Could not send. Try again later or sign in.',
            hasAccount: 'Already have an account?',
            loginLink: 'Sign in',
        },
        journey: {
            title: 'Agent path: your family office',
            subtitle: 'Three steps to launch your practice',
            steps: [
                { title: 'Apply', description: 'Tell us about your experience' },
                { title: 'Onboarding', description: 'Family-office methodology and platform' },
                { title: 'Go live', description: 'First clients and your own office' },
            ],
        },
        tools: {
            title: 'Family office tools',
            subtitle: 'Everything to run your agent practice in one platform',
            items: [
                { title: 'Smart CRM', description: 'Clients, tasks, and history in one place' },
                { title: 'Financial Calculators', description: 'Fast calculations and scenarios' },
                { title: 'Digital Proposals', description: 'Presentations and reports for clients' },
                { title: 'Performance Analytics', description: 'Metrics and practice growth' },
            ],
        },
        education: {
            title: 'Education That Builds Experts',
            subtitle: 'Video lessons, tests, and certification',
            videoTitle: 'What is a family office',
            videoAria: 'Video: what is a family office',
            features: ['Video Lessons', 'Interactive Tests', 'Certification', 'Knowledge Base', 'Mentorship'],
            disclaimer: 'Service interface and work tools are in Russian.',
        },
        successPath: {
            title: 'Success Journey',
            steps: [
                { title: 'Join', description: 'Register and access the platform' },
                { title: 'Learn', description: 'Courses and certification' },
                { title: 'First Clients', description: 'Practice with a mentor' },
                { title: 'Grow', description: 'Scale your income' },
                { title: 'Build Your Team', description: 'Expand your practice' },
            ],
        },
        testimonials: {
            title: 'From the practice',
            items: [
                { name: 'Emily R.', role: 'Family office founder', quote: 'Clients finally see the full picture — not fragments across banks.' },
                { name: 'James T.', role: 'BankFuture agent', quote: 'Launched my office in a month — CRM and planning out of the box.' },
                { name: 'Sophia L.', role: 'Family advisor', quote: 'The family-office format filters "just a portfolio" clients — we work with the whole family.' },
            ],
        },
        partners: {
            title: 'Our Partners',
        },
        finalCta: {
            title: 'Family capital deserves its own office',
            subtitle: 'One family office format on BankFuture — for families and for practice',
            cta: 'Open Family Office',
        },
        footer: {
            tagline: 'The family office platform',
            copyright: '© 2026 BankFuture. All rights reserved.',
            privacy: 'Privacy Policy (LLC TSUPRF)',
            legalEntity: 'Personal data operator: LLC «TSUPRF» (ООО «ЦУПРФ»)',
            disclaimer:
                'Information on this site is not individual investment advice and is not a public offer.',
        },
        cookies: {
            message: 'We use cookies and process personal data to improve the site.',
            accept: 'Accept',
            learnMore: 'Learn more',
            pdnLabel: 'I agree to personal data processing (LLC TSUPRF) and cookie use',
            pdnRequired: 'Please confirm consent to continue',
        },
        privacy: {
            title: 'Privacy Policy',
            stub: 'Personal data operator: LLC «TSUPRF» (ООО «ЦУПРФ»). Key points below. Full legal text pending.',
            backHome: 'Back to home',
            sections: [
                {
                    heading: '1. General',
                    body: 'This policy describes how BankFuture website users\' personal data is processed by LLC TSUPRF.',
                },
                {
                    heading: '2. Data we process',
                    body: 'Name, phone, email, cookies and UTM campaign tags when you submit forms or browse the site.',
                },
                {
                    heading: '3. Purposes',
                    body: 'Responding to requests, providing service access, analytics (with your cookie consent).',
                },
                {
                    heading: '4. Your rights',
                    body: 'You may request access, correction, blocking or deletion of your data by contacting the operator.',
                },
                {
                    heading: '5. Operator contact',
                    body: 'LLC TSUPRF (ООО «ЦУПРФ»). Contact the company through official channels for privacy inquiries.',
                },
            ],
        },
    },
};
