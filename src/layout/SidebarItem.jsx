import { useTranslation } from "react-i18next";

export default function SidebarItem({ item, onNavigate }) {
  const { t } = useTranslation();

  return (
    <li>
      <a
        href={item.url}
        aria-label={t(item.label)}
        onClick={onNavigate}
        className="flex items-center gap-3 rounded-lg px-3 py-3 text-fg/80 transition hover:bg-fg/10 hover:text-accent"
      >
        {item.icon && <i className={`${item.icon} text-xl`} aria-hidden />}
        <span className="capitalize">{t(item.label)}</span>
      </a>
    </li>
  );
}
