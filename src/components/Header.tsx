import React, { useEffect, useRef, useState } from 'react';
import { User, ChevronDown } from 'lucide-react';

type NavPage = 'crm' | 'pfp' | 'ai-assistant' | 'ai-agent' | 'news' | 'macro' | 'settings';

interface HeaderProps {
    activePage?: NavPage;
    onNavigate?: (page: NavPage) => void;
    onLogout?: () => void;
}

const Header: React.FC<HeaderProps> = ({ activePage = 'crm', onNavigate, onLogout }) => {
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const profileMenuRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (!profileMenuRef.current) return;
            if (!profileMenuRef.current.contains(event.target as Node)) {
                setIsProfileMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNavClick = (page: NavPage, e: React.MouseEvent) => {
        e.preventDefault();
        setIsProfileMenuOpen(false);
        if (onNavigate) {
            onNavigate(page);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('uuid');

        if (onLogout) {
            onLogout();
            return;
        }

        window.location.reload();
    };

    const getLinkStyle = (page: string) => ({
        display: 'flex',
        alignItems: 'center',
        height: '100%',
        color: activePage === page ? '#D946EF' : '#666',
        fontWeight: activePage === page ? 600 : 400,
        borderBottom: activePage === page ? '2px solid #D946EF' : 'none',
        textDecoration: 'none',
        fontSize: '14px'
    });

    return (
        <header style={{
            height: '64px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 32px',
            borderBottom: '1px solid #eee',
            position: 'sticky',
            top: 0,
            zIndex: 100
        }}>
            {/* Logo area */}
            <div style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#333',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
            }}>
                <span style={{ color: '#D946EF' }}>LO</span>go
            </div>

            {/* Navigation */}
            <nav style={{ display: 'flex', gap: '40px', height: '100%' }}>
                <a href="#" onClick={(e) => handleNavClick('crm', e)} style={getLinkStyle('crm')}>
                    AI CRM
                </a>
                <a href="#" onClick={(e) => handleNavClick('news', e)} style={getLinkStyle('news')}>
                    Новости
                </a>
                <a href="#" onClick={(e) => handleNavClick('macro', e)} style={getLinkStyle('macro')}>
                    Макростатистика
                </a>
                <a href="#" onClick={(e) => handleNavClick('settings', e)} style={getLinkStyle('settings')}>
                    Настройки
                </a>
                <a href="#" onClick={(e) => handleNavClick('pfp', e)} style={getLinkStyle('pfp')}>
                    ПФП
                </a>
                <a href="#" onClick={(e) => handleNavClick('ai-assistant', e)} style={getLinkStyle('ai-assistant')}>
                    AI Помощник
                </a>
                <a href="#" onClick={(e) => handleNavClick('ai-agent', e)} style={getLinkStyle('ai-agent')}>
                    AI-агент
                </a>
            </nav>

            {/* User Profile */}
            <div ref={profileMenuRef} style={{ position: 'relative' }}>
                <button
                    type="button"
                    onClick={() => setIsProfileMenuOpen(prev => !prev)}
                    aria-label="Профиль"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        cursor: 'pointer',
                        border: 'none',
                        background: 'transparent',
                        padding: 0
                    }}
                >
                    <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        border: '1px solid #ddd',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#666'
                    }}>
                        <User size={18} />
                    </div>
                    <ChevronDown size={16} color="#666" />
                </button>

                {isProfileMenuOpen && (
                    <div
                        style={{
                            position: 'absolute',
                            top: 'calc(100% + 10px)',
                            right: 0,
                            width: '180px',
                            background: '#fff',
                            border: '1px solid #e9e9e9',
                            borderRadius: '12px',
                            boxShadow: '0 16px 36px rgba(15, 23, 42, 0.12)',
                            padding: '8px',
                            zIndex: 150
                        }}
                    >
                        <button
                            type="button"
                            onClick={handleLogout}
                            style={{
                                width: '100%',
                                border: 'none',
                                borderRadius: '8px',
                                background: '#fff5f5',
                                color: '#dc2626',
                                padding: '10px 12px',
                                fontSize: '14px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                textAlign: 'left'
                            }}
                        >
                            Выйти из кабинета
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;
