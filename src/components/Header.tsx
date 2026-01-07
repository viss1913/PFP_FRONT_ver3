import React from 'react';
import { User, ChevronDown } from 'lucide-react';

const Header: React.FC = () => {
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
                <a href="#" style={{
                    display: 'flex',
                    alignItems: 'center',
                    height: '100%',
                    color: '#D946EF',
                    fontWeight: 600,
                    borderBottom: '2px solid #D946EF',
                    textDecoration: 'none',
                    fontSize: '14px'
                }}>
                    AI CRM
                </a>
                <a href="#" style={{
                    display: 'flex',
                    alignItems: 'center',
                    height: '100%',
                    color: '#666',
                    textDecoration: 'none',
                    fontSize: '14px'
                }}>
                    ПФП
                </a>
                <a href="#" style={{
                    display: 'flex',
                    alignItems: 'center',
                    height: '100%',
                    color: '#666',
                    textDecoration: 'none',
                    fontSize: '14px'
                }}>
                    AI Помощник
                </a>
                <a href="#" style={{
                    display: 'flex',
                    alignItems: 'center',
                    height: '100%',
                    color: '#666',
                    textDecoration: 'none',
                    fontSize: '14px'
                }}>
                    AI-агент
                </a>
                <a href="#" style={{
                    display: 'flex',
                    alignItems: 'center',
                    height: '100%',
                    color: '#666',
                    textDecoration: 'none',
                    fontSize: '14px'
                }}>
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
