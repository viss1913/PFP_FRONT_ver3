export const formatMonthsToDate = (months: number): string => {
    const date = new Date();
    date.setMonth(date.getMonth() + months);

    // Example: "январь 2045", "май 2026"
    return date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
};
