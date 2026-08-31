import { useEffect, useState } from 'react';
import { api, ApiRequestError } from '../api/client';
import type { RiskReportItem } from '../api/types';

function riskBadgeClass(score: number, maxScore: number): string {
  const t = maxScore > 0 ? score / maxScore : 0;
  if (t >= 0.66) return 'bg-risk-high/15 text-risk-high';
  if (t >= 0.33) return 'bg-risk-mid/15 text-risk-mid';
  return 'bg-risk-low/15 text-risk-low';
}

export default function Dashboard() {
  const [report, setReport] = useState<RiskReportItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.riskReport()
      .then(setReport)
      .catch((err) => {
        setError(err instanceof ApiRequestError ? err.message : 'Failed to load risk report');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-text-muted">Loading risk report...</p>;
  if (error) return <p className="text-risk-high">Error: {error}</p>;
  if (!report) return null;

  const sorted = [...report].sort((a, b) => b.risk_score - a.risk_score);
  const maxScore = Math.max(...report.map((r) => r.risk_score));

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-text-primary">Risk Report</h1>
      <div className="overflow-hidden rounded-lg border border-panel-border">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-panel-border bg-panel">
              <th className="px-4 py-3 text-left text-sm font-medium text-text-muted">Asset</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-text-muted">Type</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-text-muted">Risk Score</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((item) => (
              <tr key={item.name} className="border-b border-panel-border bg-panel/40 last:border-b-0">
                <td className="px-4 py-3 font-mono text-sm text-text-primary">{item.name}</td>
                <td className="px-4 py-3 text-sm text-text-muted">{item.type}</td>
                <td className="px-4 py-3 text-right">
                  <span className={`rounded px-2 py-0.5 font-mono text-sm ${riskBadgeClass(item.risk_score, maxScore)}`}>
                    {item.risk_score}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}