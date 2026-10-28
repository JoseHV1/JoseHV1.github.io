import { useEffect, useState } from "react";

export default function ScrollRail() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handle = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setProgress(max > 0 ? h.scrollTop / max : 0);
    };
    handle();
    window.addEventListener("scroll", handle, { passive: true });
    return () => window.removeEventListener("scroll", handle);
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed right-4 top-1/2 z-20 hidden h-[30vh] -translate-y-1/2 lg:block"
    >
      <div className="relative h-full w-px bg-fg/10">
        <span
          style={{ top: `${progress * 100}%` }}
          className="absolute -left-[3px] size-1.5 rounded-full bg-accent shadow-[0_0_8px_rgba(252,211,77,0.8)] transition-[top] duration-100"
        />
      </div>
    </div>
  );
}
