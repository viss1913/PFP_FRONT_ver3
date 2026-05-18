import React, { useEffect, useRef, useState } from 'react';
import { User, ChevronDown, Menu, X, Pencil } from 'lucide-react';
import {
    isFinamOnboardingDismissed,
    useAgentProfileOptional,
} from '../context/AgentProfileContext';
import { formatAgentDisplayName } from '../utils/agentDisplayName';
import AgentProfileModal from './AgentProfileModal';
import LkLogo from './LkLogo';

type NavPage = 'crm' | 'pfp' | 'ai-assistant' | 'ai-agent' | 'news' | 'macro' | 'settings';

interface HeaderProps {
    activePage?: NavPage;
    onNavigate?: (page: NavPage) => void;
    onLogout?: () => void;
}

const NAV_ITEMS: { page: NavPage; label: string }[] = [
    { page: 'crm', label: 'AI CRM' },
    { page: 'news', label: 'Новости' },
    { page: 'macro', label: 'Макростатистика' },
    { page: 'settings', label: 'Настройки' },
    { page: 'pfp', label: 'ПФП' },
    { page: 'ai-assistant', label: 'AI Помощник' },
    { page: 'ai-agent', label: 'AI-агент' },
];

const Header: React.FC<HeaderProps> = ({ activePage = 'crm', onNavigate, onLogout }) => {
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
    const profileMenuRef = useRef<HTMLDivElement | null>(null);
    const agentProfile = useAgentProfileOptional();
    const profile = agentProfile?.profile;
    const showFinamBanner =
        agentProfile?.isLimitedAccess === true &&
        isFinamOnboardingDismissed(profile?.agentId);

    const displayName = formatAgentDisplayName(profile ?? null);
    const email = profile?.email?.trim() ?? '';
    const finamId =
        profile?.effective_partner_agent_id?.trim() ||
        profile?.partner_agent_id?.trim() ||
        '';

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (!profileMenuRef.current?.contains(event.target as Node)) {
                setIsProfileMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        document.body.classList.toggle('lk-nav-open', isMobileNavOpen);
        return () => document.body.classList.remove('lk-nav-open');
    }, [isMobileNavOpen]);

    const handleNavClick = (page: NavPage, e: React.MouseEvent) => {
        e.preventDefault();
        setIsProfileMenuOpen(false);
        setIsMobileNavOpen(false);
        onNavigate?.(page);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('uuid');
        setIsProfileMenuOpen(false);
        setIsMobileNavOpen(false);
        if (onLogout) {
            onLogout();
            return;
        }
        window.location.reload();
    };

    const openProfileModal = () => {
        setIsProfileMenuOpen(false);
        setIsProfileModalOpen(true);
    };

    const navLinkClass = (page: NavPage) =>
        `lk-header__nav-link${activePage === page ? ' lk-header__nav-link--active' : ''}`;

    const drawerLinkClass = (page: NavPage) =>
        `lk-header__drawer-link${activePage === page ? ' lk-header__drawer-link--active' : ''}`;

    return (
        <>
            {showFinamBanner && agentProfile && (
                <div className="lk-finam-banner">
                    <span>Полный доступ — укажите Finam ID</span>
                    <button
                        type="button"
                        onClick={() => agentProfile.openPasteLinkWizard()}
                        style={{
                            border: 'none',
                            borderRadius: '8px',
                            padding: '8px 14px',
                            background: 'var(--primary, #ffc750)',
                            color: '#000',
                            fontWeight: 600,
                            fontSize: '13px',
                            cursor: 'pointer',
                        }}
                    >
                        Указать Finam ID
                    </button>
                </div>
            )}

            <header className="lk-header">
                <div className="lk-header__left">
                    <button
                        type="button"
                        className="lk-header__burger"
                        aria-label={isMobileNavOpen ? 'Закрыть меню' : 'Открыть меню'}
                        aria-expanded={isMobileNavOpen}
                        onClick={() => setIsMobileNavOpen((v) => !v)}
                    >
                        {isMobileNavOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
                    <LkLogo />
                </div>

                <nav className="lk-header__nav-desktop" aria-label="Основная навигация">
                    {NAV_ITEMS.map(({ page, label }) => (
                        <a
                            key={page}
                            href="#"
                            className={navLinkClass(page)}
                            onClick={(e) => handleNavClick(page, e)}
                        >
                            {label}
                        </a>
                    ))}
                </nav>

                <div ref={profileMenuRef} className="lk-header__profile">
                    <button
                        type="button"
                        className="lk-header__profile-btn"
                        onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                        aria-label="Профиль"
                        aria-expanded={isProfileMenuOpen}
                    >
                        <div className="lk-header__profile-text">
                            <span className="lk-header__profile-name" title={displayName}>
                                {displayName}
                            </span>
                            {email ? (
                                <span className="lk-header__profile-email" title={email}>
                                    {email}
                                </span>
                            ) : null}
                        </div>
                        <div className="lk-header__profile-avatar">
                            <User size={18} />
                        </div>
                        <ChevronDown size={16} color="#666" className="lk-header__chevron" />
                    </button>

                    {isProfileMenuOpen && (
                        <div className="lk-header__profile-menu">
                            <div className="lk-header__profile-menu-info">
                                <div className="lk-header__profile-menu-name">{displayName}</div>
                                {email ? <div className="lk-header__profile-menu-email">{email}</div> : null}
                                {finamId ? (
                                    <div className="lk-header__profile-menu-meta">
                                        Finam ID: {finamId}
                                    </div>
                                ) : null}
                            </div>
                            <button
                                type="button"
                                className="lk-header__profile-menu-item"
                                onClick={openProfileModal}
                            >
                                <Pencil size={16} />
                                Редактировать профиль
                            </button>
                            <button
                                type="button"
                                className="lk-header__profile-menu-item lk-header__profile-menu-item--danger"
                                onClick={handleLogout}
                            >
                                Выйти из кабинета
                            </button>
                        </div>
                    )}
                </div>
            </header>

            <div
                className={`lk-header__backdrop${isMobileNavOpen ? ' lk-header__backdrop--open' : ''}`}
                aria-hidden={!isMobileNavOpen}
                onClick={() => setIsMobileNavOpen(false)}
            />

            <nav
                className={`lk-header__drawer${isMobileNavOpen ? ' lk-header__drawer--open' : ''}`}
                aria-label="Мобильная навигация"
                aria-hidden={!isMobileNavOpen}
            >
                <div className="lk-header__drawer-head">
                    <LkLogo />
                    <button
                        type="button"
                        className="lk-header__drawer-close"
                        aria-label="Закрыть меню"
                        onClick={() => setIsMobileNavOpen(false)}
                    >
                        <X size={20} />
                    </button>
                </div>
                {profile && (
                    <div className="lk-header__drawer-profile">
                        <div className="lk-header__drawer-profile-name">{displayName}</div>
                        {email ? <div className="lk-header__drawer-profile-email">{email}</div> : null}
                        <button type="button" className="lk-header__drawer-profile-edit" onClick={openProfileModal}>
                            Редактировать профиль
                        </button>
                    </div>
                )}
                {NAV_ITEMS.map(({ page, label }) => (
                    <a
                        key={page}
                        href="#"
                        className={drawerLinkClass(page)}
                        onClick={(e) => handleNavClick(page, e)}
                    >
                        {label}
                    </a>
                ))}
            </nav>

            <AgentProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
        </>
    );
};

export default Header;
