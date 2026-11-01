import i18next from "i18next";
import Backend from "i18next-http-backend";
import { initReactI18next } from "react-i18next";

i18next
  .use(Backend)
  .use(initReactI18next)
  .init({
    fallbackLng: "en",
    supportedLngs: ["en", "es"],
    ns: ["lang"],
    defaultNS: "lang",
    // a saved choice wins; otherwise follow the browser (Spanish speakers get Spanish)
    lng: localStorage.getItem("lang") ?? (navigator.language?.toLowerCase().startsWith("es") ? "es" : "en"),
    interpolation: { escapeValue: false },
    backend: { loadPath: `locales/{{lng}}/{{ns}}.json?v=${import.meta.env.VITE_BUILD_ID}` },
  });

export default i18next;
