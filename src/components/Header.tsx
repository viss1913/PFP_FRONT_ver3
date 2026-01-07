import React from 'react';
import { User, ChevronDown } from 'lucide-react';

interface HeaderProps {
    activePage?: 'crm' | 'pfp' | 'ai-assistant' | 'ai-agent' | 'products';
    onNavigate?: (page: 'crm' | 'pfp' | 'ai-assistant' | 'ai-agent' | 'products') => void;
}

const Header: React.FC<HeaderProps> = ({ activePage = 'crm', onNavigate }) => {
    const handleNavClick = (page: 'crm' | 'pfp' | 'ai-assistant' | 'ai-agent' | 'products', e: React.MouseEvent) => {
        e.preventDefault();
        if (onNavigate) {
            onNavigate(page);
        }
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
                <a href="#" onClick={(e) => handleNavClick('pfp', e)} style={getLinkStyle('pfp')}>
                    ПФП
                </a>
                <a href="#" onClick={(e) => handleNavClick('ai-assistant', e)} style={getLinkStyle('ai-assistant')}>
                    AI Помощник
                </a>
                <a href="#" onClick={(e) => handleNavClick('ai-agent', e)} style={getLinkStyle('ai-agent')}>
                    AI-агент
                </a>
                <a href="#" onClick={(e) => handleNavClick('products', e)} style={getLinkStyle('products')}>
                    Продукты
                </a>
            </nav>

            {/* User Profile */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
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
            </div>
        </header>
    );
};

export default Header;
