import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ProjectIndex from "./ProjectIndex";
import TerminalCard from "./TerminalCard";

gsap.registerPlugin(ScrollTrigger);

const PROJECTS = [
  { id: "midoctor", title: "Mi Doctor PR", urlProject: "https://midoctorpr.com/", categories: ["Software", "Health"] },
  { id: "yorkdaleford", title: "Yorkdale Ford", urlProject: "https://yorkdaleford.com/", categories: ["Website", "Vehicles"] },
  { id: "capitaldodge", title: "Capital Dodge", urlProject: "https://capitaldodge.ca/", categories: ["Website", "Vehicles"] },
  { id: "netwey", title: "Netwey", urlProject: "https://site.netwey.com.mx/", categories: ["Website"] },
  { id: "multiservicios", title: "Multiservicios", urlProject: "https://multiservicios.com.es/", categories: ["Website", "Services"] },
  { id: "mymasterbook", title: "MyMasterBook", urlProject: "https://mymasterbook.net/", categories: ["Software"] },
  { id: "skillgro", title: "SkillGro", urlProject: "https://telas.online/", categories: ["Website", "Education"] },
];

export default function Projects() {
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
        gsap.from("[data-project-card]", {
          autoAlpha: 0,
          y: 30,
          duration: 0.7,
          stagger: 0.08,
          ease: "power3.out",
          scrollTrigger: { trigger: rootRef.current, start: "top 80%", once: true },
        });
      }, rootRef);
      return () => ctx.revert();
    });
    return () => mm.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      id="projects"
      data-section="projects"
      className="scroll-mt-24 pb-16"
    >
      <div className="mb-8">
        <h2
          data-section-title
          className="font-display text-3xl font-semibold tracking-tight text-fg md:text-5xl"
        >
          {t("title_projects")}
        </h2>
      </div>

      <TerminalCard title="~/projects — ls" bodyClassName="px-4 md:px-6">
        <ProjectIndex projects={PROJECTS} />
      </TerminalCard>
    </section>
  );
}
