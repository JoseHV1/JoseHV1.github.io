import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { EXPERIENCES } from "../data/content";
import Experience from "./Experience";
import TerminalCard from "./TerminalCard";

gsap.registerPlugin(ScrollTrigger);

export default function Experiences() {
  const { t } = useTranslation();
  const rootRef = useRef(null);

  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const ctx = gsap.context(() => {
        gsap.from("[data-section-title]", {
          autoAlpha: 0,
          y: 20,
          duration: 0.7,
          ease: "power3.out",
          scrollTrigger: { trigger: rootRef.current, start: "top 85%", once: true },
        });
        gsap.from("[data-exp-item]", {
          autoAlpha: 0,
          x: -32,
          duration: 0.7,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: { trigger: rootRef.current, start: "top 75%", once: true },
        });
      }, rootRef);
      return () => ctx.revert();
    });
    return () => mm.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      id="experience"
      data-section="experience"
      className="scroll-mt-24 pb-16"
    >
      <div className="mb-8 flex items-end justify-between gap-6">
        <h2
          data-section-title
          className="font-display text-3xl font-semibold tracking-tight text-fg md:text-5xl"
        >
          {t("title_exp")}
        </h2>
        <span
          aria-hidden
          className="hidden h-px flex-1 max-w-[40%] translate-y-[-0.55em] bg-gradient-to-r from-fg/15 to-transparent md:block"
        />
      </div>
      <TerminalCard title="~/work — git log" bodyClassName="p-5 md:p-6">
        <ol className="space-y-6">
          {EXPERIENCES.map((experience, i) => (
            <Experience key={`${experience.id}-${i}`} experience={experience} />
          ))}
        </ol>
      </TerminalCard>
    </section>
  );
}
