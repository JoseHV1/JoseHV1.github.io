import { useTranslation } from "react-i18next";
import { useJourneySection } from "../hooks/useJourneySection";
import TerminalCard from "../components/TerminalCard";
import { STACK_GROUPS } from "../data/content";
import SectionHeading from "./SectionHeading";

export default function Stack() {
  const { t } = useTranslation();
  const ref = useJourneySection("stack");

  return (
    <section ref={ref} id="stack" className="relative py-12 md:py-14">
      <div className="mx-auto max-w-6xl px-4">
        <div className="lg:max-w-[70%]">
          <SectionHeading kicker={t("stack_kicker")} title={t("stack_title")} lead={t("stack_lead")} />
          <TerminalCard title="~/stack — tools" className="mt-10" bodyClassName="p-4 font-mono text-[12.5px] leading-6 md:p-5 md:text-[13px]">
            <dl className="space-y-4">
              {STACK_GROUPS.map((group) => (
                <div key={group.key}>
                  <dt className="text-signal"># {t(group.key)}</dt>
                  <dd className="mt-1 flex flex-wrap gap-x-2 text-fg/85">
                    {group.items.map((item, i) => (
                      <span key={item}>
                        {item}
                        {i < group.items.length - 1 && <span aria-hidden className="ms-2 text-fg/25">·</span>}
                      </span>
                    ))}
                  </dd>
                </div>
              ))}
            </dl>
          </TerminalCard>
        </div>
      </div>
    </section>
  );
}
