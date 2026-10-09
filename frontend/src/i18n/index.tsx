import React, { createContext, useContext, useState, useEffect } from 'react';
import { en } from './en';
import { ta } from './ta';
import { hi } from './hi';
import { LanguageCode } from '../types';

export type TranslationsType = typeof en;

const dictionaries: Record<LanguageCode, TranslationsType> = {
  en,
  ta,
  hi,
};

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: TranslationsType;
  dir: 'ltr' | 'rtl';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [patientLanguage, setPatientLanguageState] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem('aihc_patient_lang');
    return (saved as LanguageCode) || 'en';
  });

  const [activeRole, setActiveRole] = useState<string>(() => {
    return localStorage.getItem('aihc_active_role') || 'PATIENT';
  });

  useEffect(() => {
    const checkRole = () => {
      const currentRole = localStorage.getItem('aihc_active_role') || 'PATIENT';
      if (currentRole !== activeRole) {
        setActiveRole(currentRole);
      }
      const savedLang = localStorage.getItem('aihc_patient_lang') as LanguageCode;
      if (savedLang && savedLang !== patientLanguage) {
        setPatientLanguageState(savedLang);
      }
    };

    window.addEventListener('storage', checkRole);
    const interval = setInterval(checkRole, 300);
    return () => {
      window.removeEventListener('storage', checkRole);
      clearInterval(interval);
    };
  }, [activeRole, patientLanguage]);

  const setLanguage = (lang: LanguageCode) => {
    setPatientLanguageState(lang);
    localStorage.setItem('aihc_patient_lang', lang);
    if (activeRole === 'PATIENT') {
      document.documentElement.lang = lang;
    }
  };

  // STAFF LANGUAGE RULE: Doctor, Nurse, and Lab Technician dashboards must strictly render in English only
  const isStaff = activeRole !== 'PATIENT';
  const effectiveLanguage: LanguageCode = isStaff ? 'en' : patientLanguage;

  useEffect(() => {
    document.documentElement.lang = effectiveLanguage;
  }, [effectiveLanguage]);

  const value: LanguageContextType = {
    language: effectiveLanguage,
    setLanguage,
    t: dictionaries[effectiveLanguage] || en,
    dir: 'ltr',
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
