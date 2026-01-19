import React from 'react';

interface AllocationItem {
    name: string;
    amount: number;
    // We can add color if it comes from backend, otherwise we'll assign it
    color?: string;
    // Percentage might be pre-calculated or not
    share?: number;
    percentage?: number;
}

interface PortfolioDistributionProps {
    assetsAllocation?: AllocationItem[];
    cashFlowAllocation?: AllocationItem[];
}

const COLORS = [
    '#E91E63', // Pink
    '#9C27B0', // Purple
    '#673AB7', // Deep Purple
    '#3F51B5', // Indigo
    '#2196F3', // Blue
    '#03A9F4', // Light Blue
    '#00BCD4', // Cyan
    '#009688', // Teal
    '#4CAF50', // Green
    '#8BC34A', // Light Green
];

const DonutChart: React.FC<{ items: AllocationItem[], title: string, total: number }> = ({ items, title, total }) => {
    // Calculate gradients
    let currentAngle = 0;
    const gradientSegments = items.map((item, index) => {
        const value = item.amount;
        const percentage = total > 0 ? (value / total) * 100 : 0;
        const nextAngle = currentAngle + (percentage * 3.6); // 3.6 degrees per percent
        const color = COLORS[index % COLORS.length];
        const segment = `${color} ${currentAngle}deg ${nextAngle}deg`;
        currentAngle = nextAngle;
        return { segment, color, ...item, percentage };
    });

    const gradientString = `conic-gradient(${gradientSegments.map(s => s.segment).join(', ')})`;

    const formatCurrency = (val: number) => new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(val);

    return (
        <div style={{
            background: '#FFFFFF',
            borderRadius: '24px',
            padding: '24px',
            boxShadow: '0px 4px 6px -1px rgba(0, 0, 0, 0.05)',
            flex: 1,
            display: 'flex',
            flexDirection: 'column'
        }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '24px', color: '#111827' }}>{title}</h3>

            <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                {/* Chart */}
                <div style={{
                    width: '160px',
                    height: '160px',
                    borderRadius: '50%',
                    background: items.length > 0 ? gradientString : '#E5E7EB',
                    position: 'relative',
                    flexShrink: 0
                }}>
                    {/* Inner White Circle for Donut Effect */}
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '110px',
                        height: '110px',
                        borderRadius: '50%',
                        background: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column'
                    }}>
                        <div style={{ fontSize: '12px', color: '#6B7280' }}>Всего</div>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#111827' }}>
                            {new Intl.NumberFormat('ru-RU', { compactDisplay: 'short', notation: 'compact', maximumFractionDigits: 1 }).format(total)}
                        </div>
                    </div>
                </div>

                {/* Legend/Table */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {gradientSegments.map((item, index) => (
                        <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: item.color }}></div>
                                <span style={{ color: '#374151' }}>{item.name}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <span style={{ fontWeight: '600', color: '#111827', minWidth: '80px', textAlign: 'right' }}>{formatCurrency(item.amount)}</span>
                                <span style={{ color: '#6B7280', width: '40px', textAlign: 'right' }}>{item.percentage.toFixed(0)}%</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export const PortfolioDistribution: React.FC<PortfolioDistributionProps> = ({ assetsAllocation, cashFlowAllocation }) => {
    // Helper to sum amounts
    const getTotal = (items?: AllocationItem[]) => items?.reduce((acc, item) => acc + item.amount, 0) || 0;

    const hasAssets = assetsAllocation && assetsAllocation.length > 0;
    const hasCashFlow = cashFlowAllocation && cashFlowAllocation.length > 0;

    if (!hasAssets && !hasCashFlow) return null;

    return (
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '40px' }}>
            {hasAssets && (
                <DonutChart
                    items={assetsAllocation!}
                    title="Распределение первоначального капитала"
                    total={getTotal(assetsAllocation)}
                />
            )}
            {hasCashFlow && (
                <DonutChart
                    items={cashFlowAllocation!}
                    title="Распределение ежемесячного пополнения"
                    total={getTotal(cashFlowAllocation)}
                />
            )}
        </div>
    );
};
