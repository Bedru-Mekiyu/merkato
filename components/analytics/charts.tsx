export interface BarData {
  label: string;
  value: number;
  color?: string;
}

export function BarChart({
  data,
  height = 160,
  color = "#6366F1",
}: {
  data: BarData[];
  height?: number;
  color?: string;
}) {
  if (!data.length) return <div className="text-xs text-faint text-center py-8">No data yet</div>;

  const max = Math.max(...data.map((d) => d.value), 1);
  const barWidth = Math.floor(560 / data.length) - 4;

  return (
    <svg viewBox={`0 0 560 ${height + 28}`} className="w-full" aria-label="Bar chart">
      {data.map((d, i) => {
        const barH = Math.max((d.value / max) * height, d.value > 0 ? 2 : 0);
        const x = i * (barWidth + 4);
        const y = height - barH;
        const barColor = d.color ?? color;
        return (
          <g key={d.label}>
            <rect x={x} y={y} width={barWidth} height={barH} rx={3} fill={barColor} opacity={0.9} />
            {d.value > 0 && (
              <text x={x + barWidth / 2} y={y - 4} textAnchor="middle" fontSize={9} fill="rgba(255,255,255,0.6)">
                {d.value}
              </text>
            )}
            <text
              x={x + barWidth / 2}
              y={height + 16}
              textAnchor="middle"
              fontSize={9}
              fill="rgba(255,255,255,0.4)"
            >
              {d.label.length > 6 ? d.label.slice(0, 6) + "…" : d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function DonutChart({
  segments,
  size = 120,
}: {
  segments: { label: string; value: number; color: string }[];
  size?: number;
}) {
  const total = segments.reduce((s, d) => s + d.value, 0);
  if (!total) return <div className="text-xs text-faint text-center py-4">No data yet</div>;

  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;
  const innerR = size * 0.22;
  let angle = -Math.PI / 2;

  const arcs = segments.map((seg) => {
    const frac = seg.value / total;
    const startAngle = angle;
    const endAngle = angle + frac * 2 * Math.PI;
    angle = endAngle;

    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const xi1 = cx + innerR * Math.cos(endAngle);
    const yi1 = cy + innerR * Math.sin(endAngle);
    const xi2 = cx + innerR * Math.cos(startAngle);
    const yi2 = cy + innerR * Math.sin(startAngle);
    const largeArc = frac > 0.5 ? 1 : 0;

    return {
      ...seg,
      d: `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${xi1} ${yi1} A ${innerR} ${innerR} 0 ${largeArc} 0 ${xi2} ${yi2} Z`,
      pct: Math.round(frac * 100),
    };
  });

  return (
    <div className="flex items-center gap-4">
      <svg viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size }}>
        {arcs.map((arc) => (
          <path key={arc.label} d={arc.d} fill={arc.color} />
        ))}
        <text x={cx} y={cy + 4} textAnchor="middle" fontSize={11} fontWeight={600} fill="white">
          {total}
        </text>
      </svg>
      <div className="space-y-1.5">
        {arcs.map((arc) => (
          <div key={arc.label} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ backgroundColor: arc.color }} />
            <span className="text-xs text-muted">{arc.label}</span>
            <span className="text-xs text-white ml-auto font-medium">{arc.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
