import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import TerminalCard from "./TerminalCard";

const TYPE_MS = 24;
const DELETE_MS = 9;
const HOLD_MS = 2600;
const GAP_MS = 350;

// A terminal that types one step at a time (`design`, then `develop`, then
// `automate`), holds it, erases it and moves on, looping. With reduced motion
// it shows the first step, still.
export default function TypedBuildLog({ steps }) {
  const { t, i18n } = useTranslation();
  const [index, setIndex] = useState(0);
  const [count, setCount] = useState(0);

  const step = steps[index];
  const line = `${step.cmd}  ${t(step.note)}`;
  const still = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (still) return undefined;
    let cancelled = false;
    let timer;
    const full = `${step.cmd}  ${t(step.note)}`.length;
    const type = (n) => {
      if (cancelled) return;
      setCount(n);
      if (n < full) timer = setTimeout(() => type(n + 1), TYPE_MS);
      else timer = setTimeout(() => erase(full), HOLD_MS);
    };
    const erase = (n) => {
      if (cancelled) return;
      setCount(n);
      if (n > 0) timer = setTimeout(() => erase(n - 2), DELETE_MS);
      else timer = setTimeout(() => setIndex((i) => (i + 1) % steps.length), GAP_MS);
    };
    type(0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [index, step, steps.length, still, t, i18n.language]);

  const shown = still ? line : line.slice(0, Math.max(0, count));
  const cmd = shown.slice(0, step.cmd.length);
  const note = shown.slice(step.cmd.length + 2);

  return (
    <TerminalCard title="~/jose — build" bodyClassName="p-4 font-mono text-[12.5px] leading-6 md:text-[13px]">
      {/* Screen readers get the full text at once; the typing is decoration. */}
      <p className="sr-only">{steps.map((s) => `${s.cmd}: ${t(s.note)}`).join(". ")}</p>
      <p aria-hidden className="min-h-[7.5rem]">
        <span className="text-accent">› </span>
        <span className="font-semibold text-fg">{cmd}</span>
        {note && <span className="text-fg/70">{"  "}{note}</span>}
        <span className="ms-1 inline-block h-4 w-2 translate-y-0.5 bg-accent/80 motion-safe:animate-pulse" />
      </p>
    </TerminalCard>
  );
}
