import React from 'react';
import { Moon } from 'lucide-react';

const DEFAULT_MESSAGE = 'За последние 48 часов нет значимых событий';

interface NewsQuietStateProps {
    message?: string | null;
}

const NewsQuietState: React.FC<NewsQuietStateProps> = ({ message }) => (
    <div
        style={{
            textAlign: 'center',
            padding: '48px 24px',
            borderRadius: '18px',
            border: '1px dashed #e5e7eb',
            background: '#faf5ff',
        }}
    >
        <Moon
            size={40}
            strokeWidth={1.5}
            color="#6B214C"
            style={{ marginBottom: '16px', opacity: 0.7 }}
        />
        <p style={{ fontSize: '15px', color: '#4b5563', margin: 0, lineHeight: 1.5 }}>
            {message?.trim() || DEFAULT_MESSAGE}
        </p>
    </div>
);

export default NewsQuietState;
