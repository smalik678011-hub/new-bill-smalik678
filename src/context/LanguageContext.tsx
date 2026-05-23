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

  // Lock to English
  const language: LanguageType = 'English';

  useEffect(() => {
    localStorage.setItem('billkaro_language', 'English');
    if (profile.language !== 'English') {
      updateProfile({ language: 'English' });
    }
  }, [profile.language, updateProfile]);

  const setLanguage = (newLang: LanguageType) => {
    // Locked to English
  };

  const t = useMemo(() => {
    return (text: string): string => translateText(text, 'English');
  }, []);

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
