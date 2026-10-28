export default function SectionHeading({ kicker, title, lead }) {
  return (
    <header className="max-w-2xl">
      <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-accent">{kicker}</p>
      <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight text-fg md:text-6xl">{title}</h2>
      {lead && <p className="mt-5 text-pretty text-base text-fg/70 md:text-lg">{lead}</p>}
    </header>
  );
}
