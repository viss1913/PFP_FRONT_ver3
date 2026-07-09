import familyOfficeLogo from '../assets/b2c/family-office-logo.svg';
import victoriaAvatar from '../assets/b2c/victoria-avatar.png';
import assetsHeroImage from '../assets/goals/assets-capital-hero.webp';
import reserveHeroImage from '../assets/goals/reserve.webp';
import lifeInsuranceHeroImage from '../assets/goals/life-protection-hero.webp';
import riskProfileHeroImage from '../assets/goals/risk-profile-hero.webp';
import welcomeDoorsHeroImage from '../assets/goals/welcome-doors-hero.webp';

export const b2cVisualAssets = {
    familyOfficeLogo,
    victoriaAvatar,
    /** Welcome `/plan` — двери Family Office */
    welcomeDoorsHero: welcomeDoorsHeroImage,
    /** Hero для шага «Активы» — интерьер + горы + бейджи (как в макете) */
    assetsHero: assetsHeroImage,
    /** Hero для шага «Финрезерв» — сейф с монетами */
    reserveHero: reserveHeroImage,
    /** Hero для шага «Защита Жизни» — семья + щит + бейджи (как в макете) */
    lifeInsuranceHero: lifeInsuranceHeroImage,
    /** Hero для шага «Риск-профиль» — золотой компас + барчарт */
    riskProfileHero: riskProfileHeroImage,
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
