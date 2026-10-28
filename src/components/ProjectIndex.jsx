import { useTranslation } from "react-i18next";

export default function ProjectIndex({ projects }) {
  const { t } = useTranslation();
  return (
    <ul>
      {projects.map((project, i) => {
        // "#case-…" links jump to a private case study on this page.
        const external = !project.urlProject.startsWith("#");
        return (
          <li key={project.id} data-project-card className="border-b border-dashed border-fg/15 last:border-b-0">
            <a
              href={project.urlProject}
              {...(external && { target: "_blank", rel: "noopener noreferrer" })}
              className="group relative flex items-center gap-4 py-5 transition-colors hover:bg-fg/[0.03] md:py-7"
            >
              <span className="font-mono text-xs tabular-nums text-fg/35 transition-colors group-hover:text-accent">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="flex-1 truncate font-display text-2xl font-medium leading-tight text-fg/90 transition-colors group-hover:text-fg md:text-4xl">
                {project.title}
              </span>
              <span className="hidden font-mono text-[11px] uppercase tracking-widest text-fg/40 md:inline">
                {project.categories
                  .map((c) => t(`cat_${c.toLowerCase().replace(/[^a-z]/g, "")}`, { defaultValue: c }))
                  .join(" / ")}
              </span>
              <span
                aria-hidden
                className="inline-block w-4 text-fg/30 transition-all group-hover:translate-x-1 group-hover:text-accent"
              >
                {external ? "↗" : "↓"}
              </span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
