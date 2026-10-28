import { useTranslation } from "react-i18next";
import { useJourneySection } from "../hooks/useJourneySection";
import TerminalCard from "../components/TerminalCard";
import { CASES } from "../data/content";
import AgentSession from "./AgentSession";
import SectionHeading from "./SectionHeading";

const CASE_PARTS = ["problem", "solution", "result"];

export default function Automation() {
  const { t } = useTranslation();
  const ref = useJourneySection("automation");

  return (
    <section ref={ref} id="automation" className="relative py-12 md:py-14">
      <div className="mx-auto max-w-6xl px-4">
        <div className="lg:max-w-[70%]">
          <SectionHeading kicker={t("ai_kicker")} title={t("ai_title")} lead={t("ai_lead")} />

          <AgentSession />
          <p className="mt-5 text-sm text-fg/60">{t("ai_in_product")}</p>

          <h3 className="mt-16 font-display text-3xl font-semibold tracking-tight text-fg md:text-4xl">{t("cases_title")}</h3>
          <p className="mt-3 max-w-2xl text-fg/70">{t("cases_lead")}</p>
          <ol className="mt-8 space-y-5">
            {CASES.map((c) => (
              <li key={c.id} id={`case-${c.id}`} className="scroll-mt-28">
                <TerminalCard title={`~/cases/${c.id}`} bodyClassName="p-5 md:p-6">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <h4 className="font-display text-xl font-semibold text-fg md:text-2xl">{t(`case_${c.id}_title`)}</h4>
                    <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-accent">{c.client}</p>
                  </div>
                  <dl className="mt-4 space-y-3 text-sm">
                    {CASE_PARTS.map((part) => (
                      <div key={part} className="sm:grid sm:grid-cols-[5.5rem_1fr] sm:gap-3">
                        <dt className="font-mono text-[10px] uppercase tracking-[0.3em] text-signal">{t(`case_${part}`)}</dt>
                        <dd className="mt-1 text-fg/80">{t(`case_${c.id}_${part}`)}</dd>
                      </div>
                    ))}
                  </dl>
                  <ul className="mt-4 flex flex-wrap gap-1.5">
                    {c.tools.map((tool) => (
                      <li key={tool} className="rounded-full border border-fg/15 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-fg/60">
                        {tool}
                      </li>
                    ))}
                  </ul>
                </TerminalCard>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
