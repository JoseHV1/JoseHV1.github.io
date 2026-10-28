import { useTranslation } from "react-i18next";
import { CONTACTS } from "../data/contacts";

export default function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-6 pb-8">
      <div className="mb-8 h-px bg-gradient-to-r from-transparent via-fg/15 to-transparent" />
      <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-fg/45">
          <span className="text-fg/70">© {year}</span>{" "}
          <span>José Hernández</span>{" "}
          <span aria-hidden className="mx-2 text-fg/25">/</span>{" "}
          <span>{t("footer_built")}</span>
        </p>
        <ul className="flex items-center gap-2">
          {CONTACTS.map(({ icon, url, name }) => (
            <li key={url}>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t(name)}
                className="inline-flex size-10 items-center justify-center rounded-full border border-fg/10 bg-fg/5 text-fg/70 transition hover:border-fg/30 hover:bg-fg/10 hover:text-fg"
              >
                <i className={`${icon} text-base`} aria-hidden />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
