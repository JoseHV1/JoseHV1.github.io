import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { gsap } from "gsap";
import { useJourneySection } from "../hooks/useJourneySection";
import TypedBuildLog from "../components/TypedBuildLog";
import { WHATSAPP_URL } from "../data/contacts";

const LINES = ["hero_line1", "hero_line2"];
// The "how" behind the headline, as a build log: design, develop, automate.
const BUILD = [
  { cmd: "design", note: "hero_term_design" },
  { cmd: "develop", note: "hero_term_develop" },
  { cmd: "automate", note: "hero_term_automate" },
];

export default function Hero() {
  const { t } = useTranslation();
  const ref = useJourneySection("hero", undefined, { start: "top top+=80" });

  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add(
      "(prefers-reduced-motion: no-preference)",
      () => {
        gsap
          .timeline({ defaults: { ease: "expo.out" } })
          .from("[data-hero-line]", { yPercent: 105, duration: 1, stagger: 0.08 })
          .from("[data-hero-fade]", { autoAlpha: 0, y: 12, duration: 0.7, stagger: 0.06 }, 0.3);
      },
      ref
    );
    return () => mm.revert();
  }, [ref]);

  return (
    <section ref={ref} id="hero" className="relative flex min-h-[100dvh] items-end pb-12 md:min-h-[84dvh] md:items-start md:pb-6">
      <div className="mx-auto w-full max-w-6xl px-4 pt-28 md:pt-8">
        {/* Text in the left ~65% of the screen; the rocket owns the right-hand column. */}
        <div className="lg:max-w-[70%]">
          <p data-hero-fade className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.3em] text-fg/70">
            <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            {t("availability")}
          </p>
          <p data-hero-fade className="mt-3 font-mono text-[11px] uppercase tracking-[0.3em] text-fg/50">
            {t("hero_kicker")}
          </p>
          <h1
            className="mt-8 font-display font-bold leading-[0.92] tracking-[-0.03em]"
            style={{ fontSize: "clamp(2.5rem, 6.2vw, 5.75rem)" }}
          >
            {LINES.map((key, i) => (
              <span key={key} className="block overflow-hidden pb-[0.06em]">
                <span
                  data-hero-line
                  className={`block ${
                    i === LINES.length - 1
                      ? "bg-gradient-to-r from-accent to-signal bg-clip-text text-transparent"
                      : "text-fg"
                  }`}
                >
                  {t(key)}
                </span>
              </span>
            ))}
          </h1>
          <div data-hero-fade className="mt-8 max-w-[30rem]">
            <TypedBuildLog steps={BUILD} />
          </div>
          <div data-hero-fade className="mt-8 flex flex-wrap items-center gap-6">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-ink-950 transition glow-accent hover:bg-accent-glow"
            >
              <i className="lab la-whatsapp text-lg" aria-hidden />
              {t("contact_me")}
            </a>
            <a
              href="#process"
              className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-fg/60 transition hover:text-fg"
            >
              {t("hero_scroll")}
              <span aria-hidden>↓</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
