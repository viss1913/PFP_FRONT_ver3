import React from 'react';
import { Svg, Path, G, Rect, Text, View } from '@react-pdf/renderer';

interface DataItem {
    name: string;
    value: number;
    color: string;
    label?: string; // Optional custom label
}

interface PdfPieChartProps {
    data: DataItem[];
    size?: number;
    innerRadius?: number; // For Donut chart support
}

const PdfPieChart: React.FC<PdfPieChartProps> = ({ data, size = 200, innerRadius = 0 }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const center = size / 2;
    const radius = size / 2;

    let startAngle = 0;

    // Helper to calculate coordinates
    const getCoordinatesForPercent = (percent: number) => {
        const x = center + radius * Math.cos(2 * Math.PI * percent);
        const y = center + radius * Math.sin(2 * Math.PI * percent);
        return [x, y];
    };

    const slices = data.map((item, index) => {
        if (total === 0) return null;

        const percent = item.value / total;
        const endAngle = startAngle + percent;

        // Calculate path
        const [startX, startY] = getCoordinatesForPercent(startAngle);
        const [endX, endY] = getCoordinatesForPercent(endAngle);

        const largeArcFlag = percent > 0.5 ? 1 : 0;

        const pathData = [
            `M ${center} ${center}`,
            `L ${startX} ${startY}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
            `Z`
        ].join(' ');

        // Update angle for next slice
        const currentStartAngle = startAngle;
        startAngle = endAngle;

        return (
            <Path
                key={index}
                d={pathData}
                fill={item.color}
            />
        );
    });

    // Legend
    const Legend = () => (
        <View style={{ marginLeft: 20, justifyContent: 'center' }}>
            {data.map((item, index) => (
                <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <View style={{ width: 10, height: 10, backgroundColor: item.color, marginRight: 6 }} />
                    <Text style={{ fontSize: 9, color: '#334155' }}>
                        {item.name} ({Math.round(item.value / total * 100)}%)
                    </Text>
                </View>
            ))}
        </View>
    );

    return (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Svg width={size} height={size}>
                {slices}
                {/* White circle for donut effect if innerRadius > 0 */}
                {innerRadius > 0 && (
                    <Path
                        d={`M ${center} ${center} m -${innerRadius}, 0 a ${innerRadius},${innerRadius} 0 1,0 ${innerRadius * 2},0 a ${innerRadius},${innerRadius} 0 1,0 -${innerRadius * 2},0`}
                        fill="#FFFFFF"
                    />
                )}
            </Svg>
            <Legend />
        </View>
    );
};

export default PdfPieChart;
