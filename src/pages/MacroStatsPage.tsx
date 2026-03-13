import React from 'react';
import Header from '../components/Header';

interface MacroStatsPageProps {
    onNavigate: (page: 'crm' | 'pfp' | 'ai-assistant' | 'ai-agent' | 'news' | 'macro' | 'settings') => void;
}

const MacroStatsPage: React.FC<MacroStatsPageProps> = ({ onNavigate }) => {
    return (
        <div style={{ minHeight: '100vh', background: '#f8f9fa', display: 'flex', flexDirection: 'column' }}>
            <Header activePage="macro" onNavigate={onNavigate} />

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
                        marginBottom: '24px',
                    }}
                >
                    <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '12px', color: '#111' }}>
                        Макростатистика
                    </h1>
                    <p style={{ fontSize: '14px', color: '#666', marginBottom: '24px' }}>
                        Раздел для ключевых макро‑показателей: инфляция, ключевая ставка, курсы валют и другое.
                    </p>
                    <p style={{ fontSize: '13px', color: '#9ca3af' }}>
                        Сейчас здесь заглушка. Позже можно подключить реальные источники данных и визуализации.
                    </p>
                </div>

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                        gap: '20px',
                    }}
                >
                    {['Инфляция', 'Ключевая ставка', 'Курс USD/RUB', 'Курс EUR/RUB'].map((title) => (
                        <div
                            key={title}
                            style={{
                                background: '#fff',
                                borderRadius: '20px',
                                padding: '20px',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                                border: '1px solid #f3f4f6',
                            }}
                        >
                            <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#111' }}>
                                {title}
                            </div>
                            <div style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px', color: '#4f46e5' }}>
                                —
                            </div>
                            <div style={{ fontSize: '12px', color: '#9ca3af' }}>Данные будут подключены позже</div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default MacroStatsPage;

