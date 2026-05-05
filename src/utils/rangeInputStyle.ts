import type { CSSProperties } from 'react';

/** Доля заполнения range для CSS (.goal-modal-range / split-track). */
export function rangeFillStyle(value: number, min: number, max: number): CSSProperties {
    const pct = max <= min ? 0 : Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
    return { width: '100%', '--range-pct': `${pct}%` } as CSSProperties;
}
