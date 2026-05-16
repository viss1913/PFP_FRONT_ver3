import React, { useState } from 'react';
import type { LandingCopy, LandingLang } from '../../content/landingCopy';
import type { LandingTheme } from '../../hooks/useLandingTheme';

interface LandingHeaderProps {
    copy: LandingCopy;
    lang: LandingLang;
    theme: LandingTheme;
    onThemeChange: (theme: LandingTheme) => void;
    onLangChange: (lang: LandingLang) => void;
    onLogin: () => void;
}

const NAV_IDS = [
    { key: 'familyOffice' as const, id: 'family-office' },
    { key: 'services' as const, id: 'services' },
    { key: 'consultant' as const, id: 'consultant' },
    { key: 'tools' as const, id: 'tools' },
    { key: 'education' as const, id: 'education' },
    { key: 'partners' as const, id: 'partners' },
];

const LandingHeader: React.FC<LandingHeaderProps> = ({
    copy,
    lang,
    theme,
    onThemeChange,
    onLangChange,
    onLogin,
}) => {
    const [menuOpen, setMenuOpen] = useState(false);

    const closeMenu = () => setMenuOpen(false);

    return (
        <header className="landing-header">
            <div className="landing-container landing-header__inner">
                <a
                    href="#"
                    className="landing-logo"
                    onClick={(e) => {
                        e.preventDefault();
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                >
                    BankFuture
                </a>

                <nav className="landing-nav" aria-label="Main">
                    {NAV_IDS.map(({ key, id }) => (
                        <a key={id} href={`#${id}`}>
                            {copy.header.nav[key]}
                        </a>
                    ))}
                </nav>

                <div className="landing-header__actions">
                    <div className="landing-theme-toggle" role="group" aria-label="Theme">
                        <button
                            type="button"
                            className={theme === 'light' ? 'active' : ''}
                            onClick={() => onThemeChange('light')}
                        >
                            {copy.header.themeLight}
                        </button>
                        <button
                            type="button"
                            className={theme === 'dark' ? 'active' : ''}
                            onClick={() => onThemeChange('dark')}
                        >
                            {copy.header.themeDark}
                        </button>
                    </div>
                    <div className="landing-lang-toggle" role="group" aria-label="Language">
                        <button
                            type="button"
                            className={lang === 'ru' ? 'active' : ''}
                            onClick={() => onLangChange('ru')}
                        >
                            RU
                        </button>
                        <button
                            type="button"
                            className={lang === 'en' ? 'active' : ''}
                            onClick={() => onLangChange('en')}
                        >
                            EN
                        </button>
                    </div>
                    <button type="button" className="landing-header__login" onClick={onLogin}>
                        {copy.header.login}
                    </button>
                    <button
                        type="button"
                        className="landing-burger"
                        aria-label="Menu"
                        aria-expanded={menuOpen}
                        onClick={() => setMenuOpen((o) => !o)}
                    >
                        <span />
                        <span />
                        <span />
                    </button>
                </div>
            </div>

            <nav className={`landing-mobile-nav ${menuOpen ? 'open' : ''}`} aria-label="Mobile">
                {NAV_IDS.map(({ key, id }) => (
                    <a key={id} href={`#${id}`} onClick={closeMenu}>
                        {copy.header.nav[key]}
                    </a>
                ))}
            </nav>
        </header>
    );
};

export default LandingHeader;
