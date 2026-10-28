import { useTranslation } from "react-i18next";

export default function ItemNav({ item }) {
  const { t } = useTranslation();

  return (
    <a
      href={item.url}
      className="rounded-full px-3 py-2 text-sm capitalize text-fg/70 transition hover:bg-fg/10 hover:text-fg"
    >
      {t(item.label)}
    </a>
  );
}
