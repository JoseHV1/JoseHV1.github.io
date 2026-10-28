import { useRef } from "react";
import { gsap } from "gsap";

export default function Project({ project, variant = "default" }) {
  const cardRef = useRef(null);

  const handleMove = (e) => {
    if (window.matchMedia("(hover: none)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    gsap.to(card, {
      rotateX: -py * 6,
      rotateY: px * 6,
      duration: 0.4,
      ease: "power3.out",
      transformPerspective: 800,
      transformOrigin: "center",
    });
  };

  const handleLeave = () => {
    if (!cardRef.current) return;
    gsap.to(cardRef.current, {
      rotateX: 0,
      rotateY: 0,
      duration: 0.7,
      ease: "elastic.out(1, 0.5)",
    });
  };

  const isFeatured = variant === "featured";

  return (
    <a
      ref={cardRef}
      href={project.urlProject}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Open ${project.title}`}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={`group relative block h-full overflow-hidden rounded-lg border border-fg/10 bg-surface-2 transition-colors hover:border-fg/20 ${
        isFeatured ? "min-h-[420px] md:min-h-full" : "min-h-[260px]"
      }`}
    >
      <img
        src={project.image}
        alt={project.title}
        loading="lazy"
        decoding="async"
        width={isFeatured ? "1200" : "800"}
        height={isFeatured ? "900" : "600"}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/30 to-transparent" />

      <div className="relative flex h-full flex-col justify-end p-5 md:p-6">
        {project.categories?.length > 0 && (
          <ul className="mb-3 flex flex-wrap gap-2">
            {project.categories.map((category) => (
              <li
                key={category}
                className="rounded-full border border-fg/15 bg-fg/5 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-fg/80 backdrop-blur"
              >
                {category}
              </li>
            ))}
          </ul>
        )}
        <h3
          className={`font-display font-semibold text-fg ${
            isFeatured ? "text-2xl md:text-4xl" : "text-lg md:text-xl"
          }`}
        >
          {project.title}
        </h3>
        <span className="mt-2 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-accent">
          View
          <svg className="size-3 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
    </a>
  );
}
