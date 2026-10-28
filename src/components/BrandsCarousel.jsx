import { useTranslation } from "react-i18next";

const BRANDS = [
  { name: "Grupo GDA", logo: "images/grupogda.png", invert: true },
  { name: "Leadbox", logo: "images/leadbox.svg" },
  { name: "Netwey", logo: "images/netwey.svg" },
  // dark artwork: inverted so it reads on the dark page
  { name: "Quantum Spot Media", logo: "images/qsm.png", invert: true },
  { name: "Vulister", logo: "images/vulister.svg" },
];

export default function BrandsCarousel() {
  const { t } = useTranslation();
  // Two identical halves (the CSS scrolls -50%), each wide enough to fill a desktop row.
  const loop = Array(6).fill(BRANDS).flat();

  return (
    <section aria-label={t("brands_worked")}>
      <p className="mb-6 text-center font-mono text-xs uppercase tracking-widest text-fg/40">
        {t("brands_worked")}
      </p>
      <div className="fade-mask carousel-container" aria-hidden="true">
        <div className="carousel-track">
          {loop.map((brand, index) => (
            <div
              key={`${brand.name}-${index}`}
              className="carousel-item flex items-center justify-center px-10"
            >
              <img
                src={brand.logo}
                alt=""
                decoding="async"
                width="160"
                height="64"
                className={`h-10 w-auto object-contain opacity-60 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0 md:h-12 ${brand.invert ? "invert" : ""}`}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
