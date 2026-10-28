import { useEffect, useState } from "react";
import ItemNav from "./ItemNav";
import SidebarItem from "./SidebarItem";
import SidebarLang from "./SidebarLang";
import SetLang from "./SetLang";

const SCROLL_THRESHOLD = 10;

const NAV_ITEMS = [
  { url: "#process", label: "nav_process", icon: "las la-cogs" },
  { url: "#automation", label: "nav_ai", icon: "las la-robot" },
  { url: "#work", label: "nav_work", icon: "las la-laptop" },
  { url: "#contact", label: "contact", icon: "lar la-envelope" },
];

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > SCROLL_THRESHOLD);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!isSidebarOpen) return;
    const handleKey = (event) => {
      if (event.key === "Escape") setIsSidebarOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isSidebarOpen]);

  const closeSidebar = () => setIsSidebarOpen(false);
  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  return (
    <>
      <header className="sticky top-0 z-30 mx-auto flex h-16 w-full items-center justify-center px-4 md:h-20 md:pt-4">
        <nav
          aria-label="Main"
          className={`relative flex h-12 w-full items-center justify-between rounded-full border px-3 transition-all duration-300 md:w-auto md:gap-1 md:px-2 ${
            isScrolled || isSidebarOpen
              ? "border-fg/10 bg-surface/70 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.6)] backdrop-blur-xl"
              : "border-transparent bg-transparent"
          }`}
        >
          <a
            href="#hero"
            aria-label="Home"
            className="ml-2 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-fg/80 hover:text-fg"
          >
            <span className="size-2 rounded-full bg-accent shadow-[0_0_8px_rgba(252,211,77,0.8)]" />
            JH
          </a>
          <ul className="hidden items-center md:flex">
            {NAV_ITEMS.map((item) => (
              <li key={item.url}>
                <ItemNav item={item} />
              </li>
            ))}
            <li className="mx-2 h-5 w-px bg-fg/10" />
            <li>
              <SetLang />
            </li>
          </ul>
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label="Toggle navigation menu"
            aria-expanded={isSidebarOpen}
            aria-controls="mobile-sidebar"
            className="md:hidden inline-flex size-10 items-center justify-center rounded-full text-xl text-fg/80 transition hover:bg-fg/10 hover:text-fg"
          >
            <i className={isSidebarOpen ? "las la-times" : "las la-bars"} aria-hidden />
          </button>
        </nav>
      </header>

      <aside
        id="mobile-sidebar"
        inert={!isSidebarOpen}
        className={`md:hidden fixed top-16 right-0 z-20 h-[calc(100dvh-4rem)] w-full transition-transform duration-300 ease-out ${
          isSidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-full overflow-y-auto bg-surface/95 px-4 py-6 backdrop-blur-xl">
          <ul className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <SidebarItem key={item.url} item={item} onNavigate={closeSidebar} />
            ))}
          </ul>
          <SidebarLang />
        </div>
      </aside>
    </>
  );
}
