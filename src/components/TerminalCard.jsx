// A card dressed as a terminal window: three dots and a path in the title bar.
// The house style for content cards over the 3D scene.
export default function TerminalCard({ title, className = "", bodyClassName = "", children }) {
  return (
    <figure
      className={`overflow-hidden rounded-2xl border border-fg/15 bg-bg/85 shadow-[0_0_70px_-25px_rgba(252,211,77,0.3)] backdrop-blur-md ${className}`}
    >
      <div className="flex items-center gap-2 border-b border-fg/10 px-4 py-3">
        <span aria-hidden className="size-2.5 rounded-full bg-fg/20" />
        <span aria-hidden className="size-2.5 rounded-full bg-fg/20" />
        <span aria-hidden className="size-2.5 rounded-full bg-fg/20" />
        <figcaption className="ms-3 font-mono text-[11px] tracking-wide text-fg/40">{title}</figcaption>
      </div>
      <div className={bodyClassName}>{children}</div>
    </figure>
  );
}
