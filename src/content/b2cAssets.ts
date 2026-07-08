import familyOfficeLogo from '../assets/b2c/family-office-logo.svg';
import victoriaAvatar from '../assets/b2c/victoria-avatar.png';

export const b2cVisualAssets = {
    familyOfficeLogo,
    victoriaAvatar,
} as const;

export type B2cPartner = {
    id: string;
    name: string;
    description: string;
    logo: string;
};

const partnerBase = '/landing/partners';

export const B2C_WELCOME_PARTNERS: B2cPartner[] = [
    {
        id: 'finam',
        name: 'ФИНАМ',
        description: 'Инвестиции и финансовые решения',
        logo: `${partnerBase}/finam.svg`,
    },
    {
        id: 'sber-life',
        name: 'СБЕР СТРАХОВАНИЕ ЖИЗНИ',
        description: 'Страховая защита для вас и вашей семьи',
        logo: `${partnerBase}/sber-life.svg`,
    },
    {
        id: 'renaissance',
        name: 'Ренессанс НАКОПЛЕНИЯ',
        description: 'Пенсионные решения и накопления',
        logo: `${partnerBase}/renaissance.svg`,
    },
];
