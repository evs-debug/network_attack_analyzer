import { useEffect, useState } from 'react';
import { api, ApiRequestError } from '../api/client';
import type { RiskReportItem } from '../api/types';

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

  if (loading) return <p>Loading risk report...</p>;
  if (error) return <p style={{ color: 'crimson' }}>Error: {error}</p>;
  if (!report) return null;

  const sorted = [...report].sort((a, b) => b.risk_score - a.risk_score);

  return (
    <div>
      <h1>Risk Report</h1>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', borderBottom: '2px solid #ccc', padding: '0.5rem' }}>Asset</th>
            <th style={{ textAlign: 'left', borderBottom: '2px solid #ccc', padding: '0.5rem' }}>Type</th>
            <th style={{ textAlign: 'right', borderBottom: '2px solid #ccc', padding: '0.5rem' }}>Risk Score</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((item) => (
            <tr key={item.name}>
              <td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>{item.name}</td>
              <td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>{item.type}</td>
              <td style={{ padding: '0.5rem', borderBottom: '1px solid #eee', textAlign: 'right' }}>{item.risk_score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
