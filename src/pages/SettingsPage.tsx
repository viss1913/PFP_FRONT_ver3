import React, { useState } from 'react';
import Header from '../components/Header';

type NavPage = 'crm' | 'pfp' | 'ai-assistant' | 'ai-agent' | 'news' | 'macro' | 'settings';

interface SettingsPageProps {
    onNavigate: (page: NavPage) => void;
}

type SettingsTab = 'products' | 'portfolios' | 'plans' | 'ai-b2c' | 'legacy';

const SettingsPage: React.FC<SettingsPageProps> = ({ onNavigate }) => {
    const [activeTab, setActiveTab] = useState<SettingsTab>('products');

    const renderTabLabel = (tab: SettingsTab) => {
        switch (tab) {
            case 'products':
                return 'Продукты';
            case 'portfolios':
                return 'Портфели';
            case 'plans':
                return 'Планы и инфляция';
            case 'ai-b2c':
                return 'AI B2C';
            case 'legacy':
                return 'Прочие настройки';
            default:
                return tab;
        }
    };

    const tabs: SettingsTab[] = ['products', 'portfolios', 'plans', 'ai-b2c', 'legacy'];

    return (
        <div style={{ minHeight: '100vh', background: '#f8f9fa', display: 'flex', flexDirection: 'column' }}>
            <Header activePage="settings" onNavigate={onNavigate} />

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
                {/* Tabs */}
                <div
                    style={{
                        background: '#fff',
                        borderRadius: '20px',
                        padding: '8px',
                        display: 'inline-flex',
                        gap: '6px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                        marginBottom: '24px',
                    }}
                >
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            type="button"
                            onClick={() => setActiveTab(tab)}
                            style={{
                                padding: '10px 18px',
                                borderRadius: '14px',
                                border: 'none',
                                fontSize: '13px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                background: activeTab === tab ? '#fdf4ff' : 'transparent',
                                color: activeTab === tab ? '#D946EF' : '#6b7280',
                                transition: 'all 0.15s ease',
                            }}
                        >
                            {renderTabLabel(tab)}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div
                    style={{
                        background: '#fff',
                        borderRadius: '24px',
                        padding: '32px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
                        border: '1px solid #f3f4f6',
                    }}
                >
                    <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '12px', color: '#111' }}>
                        {renderTabLabel(activeTab)}
                    </h1>
                    <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
                        Здесь будут настройки раздела{' '}
                        <span style={{ fontWeight: 600 }}>{renderTabLabel(activeTab)}</span>. Сейчас это только
                        каркас, чтобы зафиксировать навигацию.
                    </p>
                    <p style={{ fontSize: '13px', color: '#9ca3af' }}>
                        Когда подключим новые эндпоинты (`/pfp/products`, `/pfp/portfolios`, `/pfp/settings`,
                        `/pfp/ai-b2c/*`), сюда вынесем соответствующие формы и таблицы. Старые служебные экраны
                        тоже можно постепенно переносить во вкладку «Прочие настройки».
                    </p>
                </div>
            </main>
        </div>
    );
};

export default SettingsPage;

