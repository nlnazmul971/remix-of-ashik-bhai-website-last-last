import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { translations, type Language, LANGUAGES } from "@/lib/translations";

type Ctx = {
  lang: Language;
  setLang: (l: Language) => void;
  t: (key: string, fallback?: string) => string;
  languages: typeof LANGUAGES;
};

const LanguageContext = createContext<Ctx | undefined>(undefined);

const STORAGE_KEY = "app_lang";

const detectInitial = (): Language => {
  if (typeof window === "undefined") return "en";
  const stored = localStorage.getItem(STORAGE_KEY) as Language | null;
  if (stored === "en" || stored === "bn") return stored;
  const nav = navigator.language?.toLowerCase() || "";
  if (nav.startsWith("bn")) return "bn";
  return "en";
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Language>(detectInitial);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (l: Language) => setLangState(l);

  const t = (key: string, fallback?: string) => {
    return translations[lang][key] ?? translations.en[key] ?? fallback ?? key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, languages: LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider");
  return ctx;
};
