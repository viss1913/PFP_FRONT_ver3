import React, { useEffect, useState } from 'react';
import type { NewsFeedItem } from '../../api/newsApi';
import { newsApi } from '../../api/newsApi';
import { getNewsEventLabel } from '../../utils/newsEventLabels';
import { formatRelativeTime } from '../../utils/formatRelativeTime';

interface NewsFeedCardProps {
    item: NewsFeedItem;
}

const ACCENT = '#6B214C';

const NewsFeedCard: React.FC<NewsFeedCardProps> = ({ item: initialItem }) => {
    const [item, setItem] = useState(initialItem);

    useEffect(() => {
        setItem(initialItem);
    }, [initialItem]);

    const subtitle = item.agentTakeaway?.trim() || item.description?.trim() || '';
    const relativeTime = formatRelativeTime(item.publishedAt);
    const alsoLine =
        item.alsoReportedBy.length > 0
            ? `ещё: ${item.alsoReportedBy.join(', ')}`
            : null;

    const footerParts = [item.source?.name, relativeTime].filter(Boolean);
    const isRead = item.read;

    const handleClick = () => {
        if (item.url) {
            window.open(item.url, '_blank', 'noopener,noreferrer');
        }
        if (!item.read) {
            setItem((prev) => ({ ...prev, read: true }));
            newsApi.markRead(item.id).catch(() => {
                setItem((prev) => ({ ...prev, read: false }));
            });
        }
    };

    return (
        <article
            role="button"
            tabIndex={0}
            onClick={handleClick}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleClick();
                }
            }}
            style={{
                background: '#fff',
                borderRadius: '16px',
                padding: '20px',
                border: '1px solid #f0f0f0',
                marginBottom: '12px',
                cursor: 'pointer',
                opacity: isRead ? 0.65 : 1,
                transition: 'opacity 0.2s',
            }}
        >
            <span
                style={{
                    display: 'inline-block',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: ACCENT,
                    background: '#faf5ff',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    marginBottom: '10px',
                }}
            >
                {getNewsEventLabel(item.eventType)}
            </span>

            <h2 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 600, lineHeight: 1.35 }}>
                <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{ color: '#111', textDecoration: 'none' }}
                >
                    {item.title}
                </a>
            </h2>

            {subtitle && (
                <p style={{ margin: '0 0 12px', fontSize: '14px', color: '#64748b', lineHeight: 1.45 }}>
                    {subtitle}
                </p>
            )}

            <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>
                {footerParts.join(' · ')}
                {alsoLine && (
                    <>
                        {footerParts.length > 0 ? ' · ' : ''}
                        {alsoLine}
                    </>
                )}
            </p>
        </article>
    );
};

export default NewsFeedCard;
