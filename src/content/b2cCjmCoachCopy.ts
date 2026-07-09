import { B2C_ASSETS_COACH_MESSAGE } from './b2cAssetsStepCopy';
import { B2C_FIN_RESERVE_COACH_MESSAGE } from './b2cFinReserveStepCopy';
import { getB2cGoalCoachMessage } from './b2cGoalSelectionCopy';
import { B2C_LIFE_INSURANCE_COACH_MESSAGE } from './b2cLifeInsuranceStepCopy';

export type B2cCjmCoachStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export function getB2cCjmCoachMessage(step: number, _inviterName?: string, clientAge = 39): string {
    switch (step as B2cCjmCoachStep) {
        case 1:
            return 'Привет! 👋 Для начала я бы хотел с тобой познакомиться. Введи, пожалуйста, данные о себе и нажми кнопку «Далее».';
        case 2:
            return 'Теперь про семью: брак, дети, кредиты и обязательства. Так план учтёт реальную нагрузку на бюджет, а не «среднего человека».';
        case 3:
            return getB2cGoalCoachMessage(clientAge);
        case 4:
            return B2C_ASSETS_COACH_MESSAGE;
        case 5:
            return B2C_FIN_RESERVE_COACH_MESSAGE;
        case 6:
            return B2C_LIFE_INSURANCE_COACH_MESSAGE;
        case 7:
            return 'Финишная прямая! Короткая анкета по риску — без сложных терминов. По ответам подберём инвестиционный профиль и сразу посчитаем план.';
        default:
            return 'Заполните шаг — я подскажу, что дальше.';
    }
}
