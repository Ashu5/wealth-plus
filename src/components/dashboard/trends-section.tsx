import { useMemo } from 'react';
import { Line, Doughnut, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import type { PortfolioEntry, FixedDepositEntry } from './types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler);

type TrendsSectionProps = {
  portfolioEntries: PortfolioEntry[];
  fixedDepositEntries: FixedDepositEntry[];
};

function TrendsSection({ portfolioEntries, fixedDepositEntries }: TrendsSectionProps) {
  const trendData = useMemo(() => {
    const months = Array.from(
      new Set([
        ...portfolioEntries.map((entry) => entry.month),
        ...fixedDepositEntries.map((entry) => entry.month),
      ])
    ).sort();

    const lineLabels = months.length > 0 ? months : ['No data'];
    const portfolioSeries = lineLabels.map((month) => {
      if (month === 'No data') return 0;
      return portfolioEntries.filter((entry) => entry.month === month).reduce((sum, entry) => sum + entry.amount, 0);
    });
    const fdSeries = lineLabels.map((month) => {
      if (month === 'No data') return 0;
      return fixedDepositEntries.filter((entry) => entry.month === month).reduce((sum, entry) => sum + entry.amount, 0);
    });

    return {
      labels: lineLabels,
      portfolioSeries,
      fdSeries,
    };
  }, [portfolioEntries, fixedDepositEntries]);

  const doughnutData = useMemo(() => {
    const totalPortfolio = portfolioEntries.reduce((sum, entry) => sum + entry.amount, 0);
    const totalFD = fixedDepositEntries.reduce((sum, entry) => sum + entry.amount, 0);
    const total = totalPortfolio + totalFD;

    return {
      labels: ['Portfolio', 'FD'],
      datasets: [
        {
          data: total > 0 ? [totalPortfolio, totalFD] : [1, 1],
          backgroundColor: ['#4f46e5', '#f59e0b'],
          borderColor: ['#ffffff', '#ffffff'],
          borderWidth: 2,
        },
      ],
    };
  }, [portfolioEntries, fixedDepositEntries]);

  const pieData = useMemo(() => {
    const totalPortfolio = portfolioEntries.reduce((sum, entry) => sum + entry.currentValue, 0);
    const totalFD = fixedDepositEntries.reduce((sum, entry) => sum + entry.amount, 0);
    const total = totalPortfolio + totalFD;

    return {
      labels: ['Current Value', 'FD Value'],
      datasets: [
        {
          data: total > 0 ? [totalPortfolio, totalFD] : [1, 1],
          backgroundColor: ['#10b981', '#3b82f6'],
          borderColor: ['#ffffff', '#ffffff'],
          borderWidth: 2,
        },
      ],
    };
  }, [portfolioEntries, fixedDepositEntries]);

  return (
    <section className="summary-card trends-card">
      <div className="summary-header">
        <div>
          <p className="eyebrow">Trends</p>
        </div>
      </div>

      <div className="trends-grid">
        <div className="chart-card chart-card-large">
          <div className="chart-header">
            <h3>Monthly contribution trend</h3>
            <span>Portfolio vs FD</span>
          </div>
          <div className="chart-canvas-wrap">
            <Line
              data={{
              labels: trendData.labels,
              datasets: [
                {
                  label: 'Portfolio',
                  data: trendData.portfolioSeries,
                  borderColor: '#4f46e5',
                  backgroundColor: 'rgba(79, 70, 229, 0.16)',
                  fill: true,
                  tension: 0.35,
                  pointRadius: 4,
                },
                {
                  label: 'FD',
                  data: trendData.fdSeries,
                  borderColor: '#f59e0b',
                  backgroundColor: 'rgba(245, 158, 11, 0.18)',
                  fill: true,
                  tension: 0.35,
                  pointRadius: 4,
                },
              ],
            }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'bottom' },
                  tooltip: { enabled: true },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: { color: '#475569' },
                    grid: { color: 'rgba(148, 163, 184, 0.2)' },
                  },
                  x: {
                    ticks: { color: '#475569' },
                    grid: { display: false },
                  },
                },
              }}
            />
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h3>Allocation mix</h3>
            <span>Portfolio vs FD</span>
          </div>
          <div className="chart-canvas-wrap">
            <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h3>Value split</h3>
            <span>Current vs FD value</span>
          </div>
          <div className="chart-canvas-wrap">
            <Pie data={pieData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
          </div>
        </div>
      </div>
    </section>
  );
}

export default TrendsSection;
