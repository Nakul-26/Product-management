import { useEffect, useMemo, useState } from 'react';
import api from '../api/api';
import { DailySalesSummary, Dashboard } from '../types';

type RevenuePoint = {
  day: string;
  revenue: number;
};

const dayName = (date: Date) => date.toLocaleDateString(undefined, { weekday: 'short' });

function DashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [chartData, setChartData] = useState<RevenuePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      setError('');
      try {
        const dashboardRes = await api.get<Dashboard>('/dashboard');

        const days = Array.from({ length: 7 }).map((_, index) => {
          const date = new Date();
          date.setDate(date.getDate() - (6 - index));
          return date;
        });

        const summaries = await Promise.all(
          days.map(async (date) => {
            const dateParam = date.toISOString().slice(0, 10);
            try {
              const summaryRes = await api.get<DailySalesSummary>('/sales/summary/daily', { params: { date: dateParam } });
              return {
                day: dayName(date),
                revenue: summaryRes.data.totalSales || 0
              };
            } catch {
              return {
                day: dayName(date),
                revenue: 0
              };
            }
          })
        );

        setData(dashboardRes.data);
        setChartData(summaries);
      } catch {
        setError('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const maxRevenue = useMemo(() => Math.max(...chartData.map((item) => item.revenue), 1), [chartData]);

  return (
    <main className="app">
      <div className="dashboard-container">
        <h2>Dashboard</h2>

        {loading && <p>Loading...</p>}
        {error && <p className="error-text">{error}</p>}

        {data && (
          <>
            <div className="dashboard-cards">
              <div className="card">
                <h3>Today's Revenue</h3>
                <p>₹ {data.totalRevenue.toFixed(2)}</p>
              </div>

              <div className="card">
                <h3>Total Products</h3>
                <p>{data.products}</p>
              </div>

              <div className="card">
                <h3>Low Stock</h3>
                <p>{data.lowStock}</p>
              </div>

              <div className="card">
                <h3>Pending Payments</h3>
                <p>₹ {data.pendingPaymentsAmount.toFixed(2)}</p>
              </div>
            </div>

            <div className="chart-section">
              <h3>Revenue (Last 7 Days)</h3>
              <div className="mini-chart">
                {chartData.map((point) => (
                  <div key={point.day} className="mini-chart-col">
                    <div className="mini-chart-value">₹{point.revenue.toFixed(0)}</div>
                    <div
                      className="mini-chart-bar"
                      style={{ height: `${Math.max((point.revenue / maxRevenue) * 180, 8)}px` }}
                      title={`${point.day}: ₹${point.revenue.toFixed(2)}`}
                    />
                    <div className="mini-chart-label">{point.day}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default DashboardPage;
