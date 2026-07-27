'use client';

interface QualificationMeterProps {
  probability: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function QualificationMeter({
  probability,
  label = 'Qualification',
  size = 'md',
}: QualificationMeterProps) {
  const pct = Math.round(probability * 100);

  const getColor = () => {
    if (pct >= 70) return '#10b981';
    if (pct >= 40) return '#f59e0b';
    return '#ef4444';
  };

  const stroke = getColor();

  const sizes = {
    sm: { r: 28, sw: 4, fontSize: 14, labelSize: 9, viewBox: 80 },
    md: { r: 40, sw: 6, fontSize: 20, labelSize: 11, viewBox: 110 },
    lg: { r: 56, sw: 8, fontSize: 28, labelSize: 13, viewBox: 150 },
  };

  const { r, sw, fontSize, labelSize, viewBox } = sizes[size];
  const cx = viewBox / 2;
  const cy = viewBox / 2;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - probability);

  return (
    <div className="flex flex-col items-center gap-1">
      <svg
        width={viewBox}
        height={viewBox}
        viewBox={`0 0 ${viewBox} ${viewBox}`}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="var(--border)"
          strokeWidth={sw}
        />
        {/* Progress circle */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={stroke}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      {/* Overlay text */}
      <div className="relative" style={{ marginTop: `-${viewBox + 8}px`, height: viewBox }}>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-bold tabular-nums"
            style={{ fontSize, color: stroke }}
          >
            {pct}%
          </span>
          <span
            className="text-center leading-tight"
            style={{ fontSize: labelSize, color: 'var(--text-muted)' }}
          >
            {label}
          </span>
        </div>
      </div>
    </div>
  );
}
