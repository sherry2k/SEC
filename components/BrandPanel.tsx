// The dark left panel shared by login and signup. A thin line-drawing motif
// echoes the roofline strokes in the SEC logo — the one bold, memorable
// element on these two pages, kept quiet everywhere else.
export default function BrandPanel({
  eyebrow,
  heading,
  body,
}: {
  eyebrow: string;
  heading: string;
  body: string;
}) {
  return (
    <div className="relative hidden lg:flex lg:w-[42%] flex-col justify-between overflow-hidden bg-[var(--sec-blue-deep)] px-12 py-14 text-white">
      {/* Roofline motif, echoing the logo's construction lines */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.16]"
        viewBox="0 0 600 900"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <line x1="40" y1="120" x2="560" y2="420" stroke="white" strokeWidth="3" />
        <line x1="120" y1="60" x2="520" y2="300" stroke="white" strokeWidth="3" />
        <line x1="230" y1="330" x2="230" y2="560" stroke="white" strokeWidth="3" />
        <line x1="330" y1="260" x2="330" y2="560" stroke="white" strokeWidth="3" />
        <line x1="180" y1="560" x2="380" y2="560" stroke="white" strokeWidth="3" />
        <line x1="0" y1="720" x2="600" y2="720" stroke="white" strokeWidth="1" opacity="0.5" />
        <line x1="0" y1="780" x2="600" y2="780" stroke="white" strokeWidth="1" opacity="0.5" />
      </svg>

      <div className="relative flex items-center gap-3">
        <img src="/images/logo-transparent.png" alt="" className="h-9 w-9 object-contain" />
        <span className="font-display text-lg tracking-tight">Solid Engineering Consultancy</span>
      </div>

      <div className="relative max-w-sm">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/60">{eyebrow}</p>
        <h1 className="font-display mt-3 text-4xl leading-[1.15] text-white">{heading}</h1>
        <p className="mt-4 text-sm leading-relaxed text-white/70">{body}</p>
      </div>

      <p className="relative text-xs text-white/50">
        © {new Date().getFullYear()} Solid Engineering Consultancy
      </p>
    </div>
  );
}
