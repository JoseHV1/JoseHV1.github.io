import { useTranslation } from "react-i18next";
import { useJourneySection } from "../hooks/useJourneySection";
import { CONTACTS, WHATSAPP_URL } from "../data/contacts";
import Footer from "../layout/Footer";
import SectionHeading from "./SectionHeading";

// The last screen: contact panel plus footer, no extra scrolling. The ship
// dissolves on the right while this screen scrolls in.
export default function Contact() {
  const { t } = useTranslation();
  const ref = useJourneySection("contact", undefined, { end: "bottom bottom" });

  return (
    <section ref={ref} id="contact" className="relative flex min-h-[100dvh] flex-col">
      <div className="flex flex-1 items-end pt-24 md:items-center">
        <div className="mx-auto w-full max-w-6xl px-4">
          <div className="max-w-xl">
            <SectionHeading kicker={t("contact_kicker")} title={t("contact_title")} lead={t("contact_lead")} />
            <p className="mt-8 text-sm text-fg/70 md:text-base">{t("contact_about")}</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-ink-950 transition glow-accent hover:bg-accent-glow"
              >
                <i className="lab la-whatsapp text-lg" aria-hidden />
                {t("contact_me")}
              </a>
              {CONTACTS.filter((c) => !c.url.startsWith("https://wa.me")).map(({ icon, url, name }) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-fg/10 bg-fg/5 px-4 py-2.5 text-sm text-fg/80 transition hover:border-fg/30 hover:bg-fg/10 hover:text-fg"
                >
                  <i className={`${icon} text-base`} aria-hidden />
                  {t(name)}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto w-full max-w-6xl px-4">
        <Footer />
      </div>
    </section>
  );
}
