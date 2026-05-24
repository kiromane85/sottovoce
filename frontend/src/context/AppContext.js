import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useLocalStorage } from '@/lib/hooks';
import { apiGetLanguages } from '@/lib/api';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
    const [language, setLanguage] = useLocalStorage('sv_language', null);
    const [carMode, setCarMode] = useLocalStorage('sv_car_mode', false);
    const [theme] = useLocalStorage('sv_theme', 'dark');
    const [languages, setLanguages] = useState([]);
    const [currentTrack, setCurrentTrack] = useState(null);

    useEffect(() => {
        let mounted = true;
        apiGetLanguages()
            .then((langs) => { if (mounted) setLanguages(langs); })
            .catch(() => {});
        return () => { mounted = false; };
    }, []);

    // Apply theme + car mode to <html>
    useEffect(() => {
        const root = document.documentElement;
        if (theme === 'dark') root.classList.add('dark'); else root.classList.remove('dark');
        if (carMode) root.classList.add('car'); else root.classList.remove('car');
    }, [theme, carMode]);

    const value = useMemo(() => ({
        language, setLanguage,
        carMode, setCarMode,
        theme,
        languages,
        currentTrack, setCurrentTrack,
    }), [language, carMode, theme, languages, currentTrack]);

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useApp must be used inside AppProvider');
    return ctx;
};
