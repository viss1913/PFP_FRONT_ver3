import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import type { AtbMassGoalCardMetric } from '../../utils/atbMassGoals';

export interface AtbMassGoalCardProps {
    title: string;
    imageUrl: string;
    metrics: AtbMassGoalCardMetric[];
    editable?: boolean;
    removable?: boolean;
    onClick?: () => void;
    onRemove?: () => void;
}

const AtbMassGoalCard: React.FC<AtbMassGoalCardProps> = ({
    title,
    imageUrl,
    metrics,
    editable = false,
    removable = false,
    onClick,
    onRemove,
}) => {
    const visibleMetrics = metrics.filter((metric) => metric.label.trim() && metric.value !== '—');
    const className = `atb-goal-card${editable ? ' atb-goal-card--editable' : ''}`;
    const content = (
        <>
            <div className="atb-goal-card__overlay" />
            <div className="atb-goal-card__content">
                <div className="atb-goal-card__head">
                    <h3 className="atb-goal-card__title">{title}</h3>
                    <div className="atb-goal-card__actions">
                        {editable && onClick ? (
                            <span className="atb-goal-card__edit-hint">
                                <Pencil size={14} />
                                Настроить
                            </span>
                        ) : null}
                        {removable && onRemove ? (
                            <button
                                type="button"
                                className="atb-goal-card__remove"
                                aria-label={`Удалить цель «${title}»`}
                                onClick={(event) => {
                                    event.stopPropagation();
                                    onRemove();
                                }}
                            >
                                <Trash2 size={16} />
                            </button>
                        ) : null}
                    </div>
                </div>

                <div
                    className={`atb-goal-card__metrics${
                        visibleMetrics.length === 1 ? ' atb-goal-card__metrics--single' : ''
                    }`}
                >
                    {visibleMetrics.map((metric) => (
                        <div key={`${title}-${metric.label}`} className="atb-goal-card__metric">
                            <span className="atb-goal-card__metric-label">{metric.label}</span>
                            <strong className="atb-goal-card__metric-value">{metric.value}</strong>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );

    if (editable && onClick) {
        return (
            <div
                role="button"
                tabIndex={0}
                className={className}
                onClick={onClick}
                onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        onClick();
                    }
                }}
                style={{ backgroundImage: `url(${imageUrl})` }}
            >
                {content}
            </div>
        );
    }

    return (
        <article className={className} style={{ backgroundImage: `url(${imageUrl})` }}>
            {content}
        </article>
    );
};

export default AtbMassGoalCard;
