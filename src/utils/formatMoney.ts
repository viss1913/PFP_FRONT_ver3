export function formatMoneyRub(amount?: number | null): string {
    if (amount === undefined || amount === null) return '—';
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        maximumFractionDigits: 0,
    }).format(amount);
}

export function formatTermMonths(months?: number | null): string {
    if (months === undefined || months === null) return '—';
    return String(months);
}
