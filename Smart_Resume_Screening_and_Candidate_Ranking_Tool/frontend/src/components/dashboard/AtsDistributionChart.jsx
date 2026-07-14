import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { SCORE_COLORS } from "../../utils/scoring";

const BANDS = [
  { key: "0-49", label: "0–49", min: 0, max: 49, band: "low" },
  { key: "50-74", label: "50–74", min: 50, max: 74, band: "mid" },
  { key: "75-100", label: "75–100", min: 75, max: 100, band: "high" },
];

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { label, count } = payload[0].payload;
  return (
    <div className="bg-surface border border-border rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="font-medium text-ink">{count} candidate{count !== 1 ? "s" : ""}</p>
      <p className="text-ink-soft">ATS score {label}</p>
    </div>
  );
}

export default function AtsDistributionChart({ candidates }) {
  const data = BANDS.map((b) => ({
    ...b,
    count: candidates.filter((c) => {
      const score = c.ats_report?.overall_score;
      return score !== undefined && score >= b.min && score <= b.max;
    }).length,
  }));

  const total = data.reduce((sum, d) => sum + d.count, 0);

  if (total === 0) {
    return (
      <p className="text-sm text-ink-soft text-center py-10">
        Upload candidates to see their ATS score distribution here.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} barSize={48}>
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: "var(--color-ink-soft)" }}
        />
        <YAxis hide allowDecimals={false} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--color-canvas)" }} />
        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
          {data.map((d) => (
            <Cell key={d.key} fill={SCORE_COLORS[d.band].ring} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
