import React, { useEffect, useRef, useState } from 'react';
import { User, ChevronDown, Menu, X, Pencil, PanelLeftClose, PanelRight } from 'lucide-react';
import {
    isFinamOnboardingDismissed,
    useAgentProfileOptional,
} from '../context/AgentProfileContext';
import { formatAgentDisplayName } from '../utils/agentDisplayName';
import AgentProfileModal from './AgentProfileModal';
import LkLogo from './LkLogo';
import { LK_NAV_ITEMS, type LkNavItem, type NavPage } from './lk/lkNavigation';

export type { NavPage };

const SIDEBAR_COLLAPSED_STORAGE_KEY = 'lk_sidebar_collapsed';

function readSidebarCollapsedPreference(): boolean {
    try {
        return localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === '1';
    } catch {
        return false;
    }
}

interface HeaderProps {
    activePage?: NavPage;
    onNavigate?: (page: NavPage) => void;
    onLogout?: () => void;
    children?: React.ReactNode;
    navItems?: LkNavItem[];
}

const Header: React.FC<HeaderProps> = ({
    activePage = 'crm',
    onNavigate,
    onLogout,
    children,
    navItems = LK_NAV_ITEMS,
}) => {
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(readSidebarCollapsedPreference);
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
        document.body.classList.toggle('lk-sidebar-open', isSidebarOpen);
        return () => document.body.classList.remove('lk-sidebar-open');
    }, [isSidebarOpen]);

    const handleNavClick = (page: NavPage, e: React.MouseEvent) => {
        e.preventDefault();
        setIsProfileMenuOpen(false);
        setIsSidebarOpen(false);
        onNavigate?.(page);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('uuid');
        setIsProfileMenuOpen(false);
        setIsSidebarOpen(false);
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

    const sidebarLinkClass = (page: NavPage) =>
        `lk-sidebar__link${activePage === page ? ' lk-sidebar__link--active' : ''}`;

    const toggleSidebarCollapsed = () => {
        setIsSidebarCollapsed((prev) => {
            const next = !prev;
            try {
                localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, next ? '1' : '0');
            } catch {
                /* ignore quota / private mode */
            }
            return next;
        });
    };

    const profileBlock = (
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
    );

    return (
        <div className="lk-shell">
            {showFinamBanner && agentProfile && (
                <div className="lk-finam-banner lk-finam-banner--shell">
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

            <div className="lk-shell__row">
                <aside
                    className={`lk-sidebar${isSidebarOpen ? ' lk-sidebar--open' : ''}${
                        isSidebarCollapsed ? ' lk-sidebar--collapsed' : ''
                    }`}
                    aria-label="Меню личного кабинета"
                >
                    <div className="lk-sidebar__head">
                        {isSidebarCollapsed ? (
                            <span className="lk-sidebar__logo-mark" aria-hidden>
                                FO
                            </span>
                        ) : (
                            <LkLogo className="lk-header__logo lk-sidebar__logo" />
                        )}
                        <div className="lk-sidebar__head-actions">
                            <button
                                type="button"
                                className="lk-sidebar__collapse"
                                aria-label={isSidebarCollapsed ? 'Развернуть меню' : 'Свернуть меню'}
                                aria-expanded={!isSidebarCollapsed}
                                onClick={toggleSidebarCollapsed}
                            >
                                {isSidebarCollapsed ? <PanelRight size={20} /> : <PanelLeftClose size={20} />}
                            </button>
                            <button
                                type="button"
                                className="lk-sidebar__close"
                                aria-label="Закрыть меню"
                                onClick={() => setIsSidebarOpen(false)}
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    <nav className="lk-sidebar__nav">
                        {navItems.map(({ page, label, icon: Icon }) => (
                            <a
                                key={page}
                                href="#"
                                className={sidebarLinkClass(page)}
                                title={isSidebarCollapsed ? label : undefined}
                                aria-label={label}
                                onClick={(e) => handleNavClick(page, e)}
                            >
                                <Icon size={20} aria-hidden />
                                <span className="lk-sidebar__link-label">{label}</span>
                            </a>
                        ))}
                    </nav>

                    {profile ? (
                        <div
                            className="lk-sidebar__foot"
                            title={isSidebarCollapsed && email ? `${displayName} · ${email}` : undefined}
                        >
                            {isSidebarCollapsed ? (
                                <div className="lk-sidebar__foot-compact" aria-label={displayName}>
                                    <User size={20} aria-hidden />
                                </div>
                            ) : (
                                <>
                                    <div className="lk-sidebar__foot-name">{displayName}</div>
                                    {email ? <div className="lk-sidebar__foot-email">{email}</div> : null}
                                </>
                            )}
                        </div>
                    ) : null}
                </aside>

                <div
                    className={`lk-sidebar__backdrop${isSidebarOpen ? ' lk-sidebar__backdrop--open' : ''}`}
                    aria-hidden={!isSidebarOpen}
                    onClick={() => setIsSidebarOpen(false)}
                />

                <div className="lk-shell__main">
                    <header className="lk-topbar">
                        <div className="lk-topbar__left">
                            <button
                                type="button"
                                className="lk-header__burger"
                                aria-label={isSidebarOpen ? 'Закрыть меню' : 'Открыть меню'}
                                aria-expanded={isSidebarOpen}
                                onClick={() => setIsSidebarOpen((v) => !v)}
                            >
                                {isSidebarOpen ? <X size={22} /> : <Menu size={22} />}
                            </button>
                            <span className="lk-topbar__title">
                                {navItems.find((item) => item.page === activePage)?.label ?? 'Личный кабинет'}
                            </span>
                        </div>
                        {profileBlock}
                    </header>

                    <div className="lk-shell__content">{children}</div>
                </div>
            </div>

            <AgentProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
        </div>
    );
};

export default Header;
