export type PortfolioAllocationItem = {
    amount?: number;
    yield?: number;
    yield_percent?: number;
};

export function getWeightedPortfolioYield(items?: PortfolioAllocationItem[]): number {
    if (!items?.length) return 0;
    const total = items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    if (total <= 0) return 0;
    const weighted = items.reduce((acc, item) => {
        const itemYield = Number(item.yield ?? item.yield_percent ?? 0);
        return acc + Number(item.amount || 0) * itemYield;
    }, 0);
    return weighted / total;
}

export function resolvePortfolioYieldPercent(
    consolidatedPortfolio?: {
        yield_percent?: number;
        accumulation_yield_percent?: number;
        assets_allocation?: PortfolioAllocationItem[];
        cash_flow_allocation?: PortfolioAllocationItem[];
    } | null,
    goals?: Array<{
        accumulation_yield_percent?: number;
        summary?: { accumulation_yield_percent?: number; initial_capital?: number; total_capital?: number };
        details?: { accumulation_yield_percent?: number };
    }>,
): number {
    const direct = Number(
        consolidatedPortfolio?.yield_percent
        ?? consolidatedPortfolio?.accumulation_yield_percent
        ?? 0,
    );
    if (direct > 0) return direct;

    const fromAssets = getWeightedPortfolioYield(consolidatedPortfolio?.assets_allocation);
    if (fromAssets > 0) return fromAssets;

    const fromCashFlow = getWeightedPortfolioYield(consolidatedPortfolio?.cash_flow_allocation);
    if (fromCashFlow > 0) return fromCashFlow;

    if (!goals?.length) return 0;

    let weightSum = 0;
    let yieldSum = 0;
    for (const goal of goals) {
        const y = Number(
            goal.accumulation_yield_percent
            ?? goal.summary?.accumulation_yield_percent
            ?? goal.details?.accumulation_yield_percent
            ?? 0,
        );
        const w = Number(goal.summary?.initial_capital ?? goal.summary?.total_capital ?? 0);
        if (y > 0 && w > 0) {
            yieldSum += y * w;
            weightSum += w;
        }
    }
    return weightSum > 0 ? yieldSum / weightSum : 0;
}
