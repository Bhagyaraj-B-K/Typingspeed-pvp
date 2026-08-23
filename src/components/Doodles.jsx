// A sparse field of hand-drawn-style squiggles and dots, like the reference
// screenshot's margins. Purely decorative, kept quiet so it never competes
// with the timer ring (the page's one bold accent).
const SQUIGGLES = [
  { top: '6%', left: '4%', rotate: -12, scale: 1 },
  { top: '14%', left: '92%', rotate: 18, scale: 0.85 },
  { top: '78%', left: '3%', rotate: 8, scale: 0.9 },
  { top: '88%', left: '90%', rotate: -20, scale: 1.1 },
  { top: '42%', left: '96%', rotate: 4, scale: 0.7 },
  { top: '60%', left: '2%', rotate: -6, scale: 0.75 },
];

const DOTS = [
  { top: '10%', left: '18%' },
  { top: '22%', left: '85%' },
  { top: '68%', left: '12%' },
  { top: '82%', left: '80%' },
  { top: '48%', left: '6%' },
  { top: '35%', left: '94%' },
];

function Squiggle({ top, left, rotate, scale }) {
  return (
    <svg
      className="doodle doodle-squiggle"
      style={{ top, left, transform: `rotate(${rotate}deg) scale(${scale})` }}
      width="34"
      height="34"
      viewBox="0 0 34 34"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 24C7 10 12 6 16 12C20 18 24 8 30 4"
        stroke="var(--ink)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Dot({ top, left }) {
  return (
    <span
      className="doodle doodle-dot"
      style={{ top, left }}
      aria-hidden="true"
    />
  );
}

export default function Doodles() {
  return (
    <div className="doodle-field" aria-hidden="true">
      {SQUIGGLES.map((s, i) => (
        <Squiggle key={i} {...s} />
      ))}
      {DOTS.map((d, i) => (
        <Dot key={i} {...d} />
      ))}
    </div>
  );
}
