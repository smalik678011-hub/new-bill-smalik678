import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import useAppStore from '../store';
import { translateText } from '../hooks/useTranslation';

type LanguageType = 'Hinglish' | 'Hindi' | 'English';

interface LanguageContextProps {
  language: LanguageType;
  setLanguage: (lang: LanguageType) => void;
  t: (text: string) => string;
}

export const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const profile = useAppStore((state) => state.profile);
  const updateProfile = useAppStore((state) => state.updateProfile);

  // 1. On app load — read language from localStorage first
  // 2. If no localStorage value found — default to English
  // 3. LanguageContext must initialize with the saved/default language
  const [language, setLanguageState] = useState<LanguageType>(() => {
    const stored = localStorage.getItem('billkaro_language');
    if (stored === 'Hindi' || stored === 'English' || stored === 'Hinglish') {
      return stored as LanguageType;
    }
    localStorage.setItem('billkaro_language', 'English');
    return 'English';
  });

  // Persists the corrected state instantly and updates profile store to match
  useEffect(() => {
    localStorage.setItem('billkaro_language', language);
    if (profile.language !== language) {
      updateProfile({ language });
    }
  }, [language, updateProfile]);

  const setLanguage = (newLang: LanguageType) => {
    setLanguageState(newLang);
    localStorage.setItem('billkaro_language', newLang);
    updateProfile({ language: newLang });
  };

  const t = useMemo(() => {
    return (text: string): string => translateText(text, language);
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
