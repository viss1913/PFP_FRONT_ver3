import type { NewsEventType } from '../api/newsApi';

const EVENT_LABELS: Record<NewsEventType, string> = {
    RATE_CHANGE: 'Ставка ЦБ',
    INFLATION: 'Инфляция',
    CURRENCY: 'Валюта',
    TAX_CHANGE: 'Налоги',
    BANKING: 'Банки',
    STOCK_MARKET: 'Рынок',
    OIL: 'Нефть',
    SANCTIONS: 'Санкции',
    OTHER: 'Прочее',
};

export function getNewsEventLabel(eventType: NewsEventType | string): string {
    return EVENT_LABELS[eventType as NewsEventType] ?? 'Прочее';
}
