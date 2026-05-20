import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Moon, Sun } from 'lucide-react';
import { sberLandingCopy } from '../../content/sberLandingCopy';
import { getSberBrandLabel, sberLandingAssets } from '../../content/sberLandingAssets';
import type { SberLandingTheme } from '../../hooks/useSberLandingTheme';

interface SberHeaderProps {
    theme: SberLandingTheme;
    onThemeChange: (theme: SberLandingTheme) => void;
    onLogin: () => void;
}

const SberHeader: React.FC<SberHeaderProps> = ({ theme, onThemeChange, onLogin }) => {
    const copy = sberLandingCopy.header;
    const [groupOpen, setGroupOpen] = useState(false);
    const groupRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const onDocClick = (e: MouseEvent) => {
            if (groupRef.current && !groupRef.current.contains(e.target as Node)) {
                setGroupOpen(false);
            }
        };
        document.addEventListener('click', onDocClick);
        return () => document.removeEventListener('click', onDocClick);
    }, []);

    return (
        <header className="sber-header">
            <div className="sber-container sber-header__inner">
                <a href="/sber" className="sber-header__brand" onClick={(e) => e.preventDefault()}>
                    <img src={sberLandingAssets.logo} alt="" className="sber-header__logo" width={36} height={36} />
                    <span className="sber-header__product">
                        {getSberBrandLabel()} · {copy.productName}
                    </span>
                </a>

                <nav className="sber-header__nav" aria-label="Навигация">
                    <div className="sber-header__group" ref={groupRef}>
                        <button
                            type="button"
                            className="sber-header__group-btn"
                            aria-expanded={groupOpen}
                            onClick={() => setGroupOpen((v) => !v)}
                        >
                            {copy.groupLabel}
                            <ChevronDown size={16} aria-hidden />
                        </button>
                        {groupOpen && (
                            <div className="sber-header__dropdown" role="menu">
                                {copy.groupItems.map((item) => (
                                    <a key={item.label} href={item.href} role="menuitem" onClick={() => setGroupOpen(false)}>
                                        {item.label}
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="sber-theme-toggle" role="group" aria-label="Тема">
                        <button
                            type="button"
                            className={theme === 'light' ? 'active' : ''}
                            onClick={() => onThemeChange('light')}
                            aria-label={copy.themeLight}
                            title={copy.themeLight}
                        >
                            <Sun size={18} strokeWidth={2} aria-hidden />
                        </button>
                        <button
                            type="button"
                            className={theme === 'dark' ? 'active' : ''}
                            onClick={() => onThemeChange('dark')}
                            aria-label={copy.themeDark}
                            title={copy.themeDark}
                        >
                            <Moon size={18} strokeWidth={2} aria-hidden />
                        </button>
                    </div>

                    <button type="button" className="sber-header__login" onClick={onLogin}>
                        {copy.login}
                    </button>
                </nav>
            </div>
        </header>
    );
};

export default SberHeader;
