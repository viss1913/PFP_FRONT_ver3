import { useCallback, useEffect, useState } from 'react';

export type LandingTheme = 'dark' | 'light';

const THEME_KEY = 'landing_theme';

function readInitialTheme(): LandingTheme {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get('theme');
    if (fromUrl === 'light' || fromUrl === 'dark') return fromUrl;
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
    return 'dark';
}

export function useLandingTheme() {
    const [theme, setThemeState] = useState<LandingTheme>(readInitialTheme);

    useEffect(() => {
        document.documentElement.dataset.landingTheme = theme;
    }, [theme]);

    const setTheme = useCallback((next: LandingTheme) => {
        setThemeState(next);
        localStorage.setItem(THEME_KEY, next);
    }, []);

    const toggleTheme = useCallback(() => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    }, [theme, setTheme]);

    return { theme, setTheme, toggleTheme };
}
