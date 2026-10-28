import { useTranslation } from "react-i18next";
import { useJourneySection } from "../hooks/useJourneySection";
import TerminalCard from "../components/TerminalCard";
import { PROCESS_STEPS } from "../data/content";
import SectionHeading from "./SectionHeading";

// The six phases of building software, as a compact grid: one screen on
// desktop, no sticky panel and no extra scroll while the ship keeps flying.
export default function Process() {
  const { t } = useTranslation();
  const ref = useJourneySection("process");

  return (
    <section ref={ref} id="process" className="relative pb-12 pt-8 md:pb-14 md:pt-6">
      <div className="mx-auto max-w-6xl px-4">
        <div className="lg:max-w-[70%]">
          <SectionHeading kicker={t("process_kicker")} title={t("process_title")} lead={t("process_lead")} />
          <ol className="mt-12 grid gap-3 md:grid-cols-2">
          {PROCESS_STEPS.map((n) => (
            <li key={n} className="flex">
              <TerminalCard title={`~/process/${String(n).padStart(2, "0")}`} className="flex w-full flex-col" bodyClassName="flex-1 p-5">
                <h3 className="font-display text-xl font-semibold text-fg">{t(`process_step${n}_title`)}</h3>
                <p className="mt-2 text-sm text-fg/75">{t(`process_step${n}_desc`)}</p>
                <p className="mt-3 border-t border-dashed border-fg/15 pt-3 text-xs text-fg/55">
                  <span className="text-signal">{t("proof")}</span> {t(`process_step${n}_proof`)}
                </p>
              </TerminalCard>
            </li>
          ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
