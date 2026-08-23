const SIZE = 148;
const STROKE = 8;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function TimerRing({ value, max, label = 'seconds', urgent = false }) {
  const fraction = max > 0 ? Math.max(value, 0) / max : 0;
  const offset = CIRCUMFERENCE * (1 - fraction);

  return (
    <div className={`timer-ring ${urgent ? 'timer-ring-urgent' : ''}`}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--border)"
          strokeWidth={STROKE}
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke={urgent ? 'var(--error)' : 'var(--accent)'}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          style={{ transition: 'stroke-dashoffset 0.3s linear, stroke 0.3s ease' }}
        />
      </svg>
      <div className="timer-ring-inner">
        <span className="timer-ring-value">{Math.max(value, 0)}</span>
        <span className="timer-ring-label">{label}</span>
      </div>
    </div>
  );
}
