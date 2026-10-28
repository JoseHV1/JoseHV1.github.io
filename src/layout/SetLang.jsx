import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../hooks/useLanguage";

export default function SetLang() {
  const { language, changeLanguage, supported } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handlePointer = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    const handleKey = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const select = (lang) => {
    changeLanguage(lang);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="rounded-full px-3 py-2 text-sm uppercase text-fg/70 transition hover:bg-fg/10 hover:text-fg"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {language}
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label="Language"
          className="absolute right-0 mt-2 min-w-[6rem] overflow-hidden rounded-lg border border-fg/10 bg-surface shadow-lg"
        >
          {supported.map((lang) => (
            <li key={lang} role="option" aria-selected={lang === language}>
              <button
                type="button"
                onClick={() => select(lang)}
                className="w-full px-4 py-2 text-left text-sm uppercase hover:bg-fg/10"
              >
                {lang}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
