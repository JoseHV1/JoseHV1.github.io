import { useTranslation } from "react-i18next";

export default function Experience({ experience }) {
  const { t } = useTranslation();

  return (
    <li data-exp-item className="border-b border-dashed border-fg/15 pb-6 last:border-b-0 last:pb-0">
      <time className="font-mono text-xs uppercase tracking-widest text-accent/80">
        <span aria-hidden className="me-2">›</span>
        {t(experience.date)}
      </time>
      <h3 className="mt-2 font-display text-lg font-semibold text-fg md:text-xl">
        {t(experience.title)}
      </h3>
      <p className="mt-2 max-w-3xl text-pretty text-sm leading-relaxed text-fg/60 md:text-base">
        <span aria-hidden className="me-2 font-mono text-fg/30">#</span>
        {t(experience.description)}
      </p>
    </li>
  );
}
