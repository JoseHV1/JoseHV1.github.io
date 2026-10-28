import { useTranslation } from "react-i18next";
import { useLanguage } from "../hooks/useLanguage";

export default function SidebarLang() {
  const { t } = useTranslation();
  const { changeLanguage, supported, labels } = useLanguage();

  return (
    <div className="px-3 py-2">
      <p className="mb-2 text-xs uppercase tracking-wider text-fg/50">
        {t("language")}
      </p>
      <div className="flex gap-2">
        {supported.map((code) => (
          <button
            key={code}
            type="button"
            onClick={() => changeLanguage(code)}
            className="flex-1 rounded-lg border border-fg/10 px-3 py-2 text-sm transition hover:bg-fg/10"
          >
            {t(labels[code])}
          </button>
        ))}
      </div>
    </div>
  );
}
