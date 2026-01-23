
// Map specific goal names (from Figma filenames) to Goal Type IDs
// and provide a helper to get the image path.

// Import all images
import gospensiya from '../assets/goals/gospensiya.png';
import passivnyy from '../assets/goals/passivnyy_dohod_v_buduschem.png';
import invest from '../assets/goals/sohranit__i_preumnozhit.png'; // "Сохранить и приумножить"
import rent from '../assets/goals/poluchenie_ezhemesyachnogo_dohoda.png'; // "Рента"

// Others (mapped to ID 4 or 3 based on logic)
import kvartira from '../assets/goals/kvartira.png';
import zagorod from '../assets/goals/zagorodnayanedvizhimost.png';
import avtomobil from '../assets/goals/avtomobil.png';
import puteshestvie from '../assets/goals/puteshestvie.png';
import education from '../assets/goals/obrazovanie_rebyonka.png';
import capital from '../assets/goals/preumnozhenie_kapitala.png';
import ipoteka from '../assets/goals/pervyy_vznos_na_ipoteku.png';
import pereezd from '../assets/goals/pereezd.png';
import business from '../assets/goals/svoybiznes.png';
import other from '../assets/goals/drugoe.png';

// Goal Type IDs
export const GOAL_TYPE_PENSION = 1;
export const GOAL_TYPE_PASSIVE_INCOME = 2;
export const GOAL_TYPE_INVESTMENT = 3;
export const GOAL_TYPE_OTHER = 4; // Major Purchase / Real Estate / Other
export const GOAL_TYPE_LIFE = 5;
export const GOAL_TYPE_FIN_RESERVE = 7;
export const GOAL_TYPE_RENT = 8;

// Config for Grid Display
// Each item represents a card in the gallery
export const GOAL_GALLERY_ITEMS = [
    { id: 'pension', typeId: GOAL_TYPE_PENSION, title: 'ГосПенсия', image: gospensiya, description: 'На старость' },
    { id: 'passive', typeId: GOAL_TYPE_PASSIVE_INCOME, title: 'Пассивный доход', image: passivnyy, description: 'Жить на проценты' },
    { id: 'rent', typeId: GOAL_TYPE_RENT, title: 'Получение ежемесячного дохода', image: rent, description: 'Рента' },
    { id: 'edu', typeId: GOAL_TYPE_OTHER, title: 'Образование ребёнка', image: education, description: 'Детям' },

    // Logic for "Other" mappings
    // User said: "Все остальное - OTHER (id=9)"
    { id: 'apartment', typeId: GOAL_TYPE_OTHER, title: 'Квартира', image: kvartira, description: 'Покупка жилья' },
    { id: 'house', typeId: GOAL_TYPE_OTHER, title: 'Загородная недвижимость', image: zagorod, description: 'Дом' },
    { id: 'mortgage', typeId: GOAL_TYPE_OTHER, title: 'Первый взнос на ипотеку', image: ipoteka, description: 'Ипотека' },
    { id: 'move', typeId: GOAL_TYPE_OTHER, title: 'Переезд', image: pereezd, description: 'Смена жилья' },

    // User mentioned: "Сохранить и приумножить - это INVESTMENT (id=3)"
    { id: 'invest_save', typeId: GOAL_TYPE_INVESTMENT, title: 'Сохранить и преумножить', image: invest, description: 'Инвестиции' },
    { id: 'capital', typeId: GOAL_TYPE_INVESTMENT, title: 'Преумножение капитала', image: capital, description: 'Рост капитала' },

    // "Все остальное - OTHER (id=9)"
    { id: 'auto', typeId: GOAL_TYPE_OTHER, title: 'Автомобиль', image: avtomobil, description: 'Покупка авто' },
    { id: 'travel', typeId: GOAL_TYPE_OTHER, title: 'Путешествие', image: puteshestvie, description: 'Отдых' },
    { id: 'business', typeId: GOAL_TYPE_OTHER, title: 'Свой бизнес', image: business, description: 'Дело' },
    { id: 'other', typeId: GOAL_TYPE_OTHER, title: 'Другое', image: other, description: 'Своя цель' },
];

export const getGoalImage = (goalName: string, typeId: number): string => {
    // Try to find exact match by title first
    const match = GOAL_GALLERY_ITEMS.find(i => i.title === goalName);
    if (match) return match.image;

    // Fallback by Type ID
    if (typeId === GOAL_TYPE_PENSION) return gospensiya;
    if (typeId === GOAL_TYPE_PASSIVE_INCOME) return passivnyy;
    if (typeId === GOAL_TYPE_RENT) return rent;
    if (typeId === GOAL_TYPE_INVESTMENT) return invest;
    if (typeId === GOAL_TYPE_OTHER) return other;

    // Default fallback
    return other;
};
