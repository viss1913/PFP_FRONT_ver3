import React from 'react';
import Header from '../components/Header';

interface NewsPageProps {
    onNavigate: (page: 'crm' | 'pfp' | 'ai-assistant' | 'ai-agent' | 'news' | 'macro' | 'settings') => void;
}

const NewsPage: React.FC<NewsPageProps> = ({ onNavigate }) => {
    return (
        <div style={{ minHeight: '100vh', background: '#f8f9fa', display: 'flex', flexDirection: 'column' }}>
            <Header activePage="news" onNavigate={onNavigate} />

            <main
                style={{
                    flex: 1,
                    padding: '32px',
                    maxWidth: '1200px',
                    margin: '0 auto',
                    width: '100%',
                    boxSizing: 'border-box',
                }}
            >
                <div
                    style={{
                        background: '#fff',
                        borderRadius: '24px',
                        padding: '32px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
                        border: '1px solid #f0f0f0',
                        textAlign: 'left',
                    }}
                >
                    <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '12px', color: '#111' }}>
                        Новости
                    </h1>
                    <p style={{ fontSize: '14px', color: '#666', marginBottom: '24px' }}>
                        Здесь скоро появятся новости, обзоры и аналитика для агентов и их клиентов.
                    </p>
                    <div
                        style={{
                            borderRadius: '18px',
                            border: '1px dashed #e5e7eb',
                            padding: '20px',
                            background: '#faf5ff',
                            color: '#4b5563',
                            fontSize: '14px',
                        }}
                    >
                        Макет раздела готов. Как только бэкенд будет отдавать ленту новостей, сюда можно будет
                        подключить реальные данные.
                    </div>
                </div>
            </main>
        </div>
    );
};

export default NewsPage;

