import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const STORAGE_KEY = "lang";
const DEFAULT_LANG = "en";
const SUPPORTED = ["en", "es"];

const LANGUAGE_LABELS = {
  en: "english",
  es: "spanish",
};

export function useLanguage() {
  const { i18n } = useTranslation();
  const [language, setLanguage] = useState(
    () => localStorage.getItem(STORAGE_KEY) ?? DEFAULT_LANG
  );

  useEffect(() => {
    if (i18n.language !== language) i18n.changeLanguage(language);
    localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language; // screen readers pick the right voice
  }, [language, i18n]);

  const changeLanguage = (next) => {
    if (SUPPORTED.includes(next)) setLanguage(next);
  };

  return {
    language,
    changeLanguage,
    supported: SUPPORTED,
    labels: LANGUAGE_LABELS,
  };
}
