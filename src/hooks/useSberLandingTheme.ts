import { useCallback, useState } from 'react';

export type SberLandingTheme = 'dark' | 'light';

const THEME_KEY = 'sber_landing_theme';

function readInitialTheme(): SberLandingTheme {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get('theme');
    if (fromUrl === 'light' || fromUrl === 'dark') return fromUrl;
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
    return 'dark';
}

export function useSberLandingTheme() {
    const [theme, setThemeState] = useState<SberLandingTheme>(readInitialTheme);

    const setTheme = useCallback((next: SberLandingTheme) => {
        setThemeState(next);
        localStorage.setItem(THEME_KEY, next);
    }, []);

    const toggleTheme = useCallback(() => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    }, [theme, setTheme]);

    return { theme, setTheme, toggleTheme };
}
