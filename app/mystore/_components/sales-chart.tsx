// app/mystore/_components/sales-chart.tsx
'use client';

import { Line } from 'react-chartjs-2';
import { useMoney } from './currency';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface SalesChartProps {
  data?: {
    labels?: string[];
    datasets?: Array<{
      label: string;
      data: number[];
    }>;
  };
}

const SalesChart = ({ data }: SalesChartProps) => {
  const { format } = useMoney();

  const chartData = {
    labels: data?.labels || [],
    datasets: data?.datasets || [],
  };
  const hasData = chartData.datasets.some((d) => (d.data || []).some((v) => Number(v) > 0));

  const chartConfig = {
    labels: chartData.labels,
    datasets: (chartData.datasets || []).map((dataset, index) => ({
      label: dataset.label,
      data: dataset.data,
      borderColor: index === 0 ? '#0C110E' : '#10b981',
      backgroundColor: index === 0 ? 'rgba(200, 241, 105, 0.35)' : 'rgba(16, 185, 129, 0.08)',
      borderWidth: 2.5,
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointHoverRadius: 7,
      pointBorderColor: index === 0 ? '#0C110E' : '#10b981',
      pointBackgroundColor: index === 0 ? '#C8F169' : '#fff',
      pointHoverBackgroundColor: '#C8F169',
      pointHoverBorderColor: '#0C110E',
      pointBorderWidth: 2,
    })),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: (chartData.datasets || []).length > 1,
        position: 'top' as const,
        align: 'end' as const,
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
            family: "'Montserrat', sans-serif",
          },
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#0C110E',
        titleColor: 'rgba(255, 255, 255, 0.6)',
        bodyColor: '#C8F169',
        padding: 12,
        cornerRadius: 14,
        displayColors: false,
        titleFont: {
          size: 13,
          family: "'Montserrat', sans-serif",
        },
        bodyFont: {
          size: 12,
          family: "'Montserrat', sans-serif",
        },
        callbacks: {
          label: function(context: { dataset: { label?: string }; parsed: { y: number | null } }) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += format(context.parsed.y);
            }
            return label;
          }
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        suggestedMax: hasData ? undefined : 1000,
        border: {
          display: false,
        },
        grid: {
          color: 'rgba(12, 17, 14, 0.05)',
          drawTicks: false,
        },
        ticks: {
          color: 'rgba(12, 17, 14, 0.4)',
          maxTicksLimit: 6,
          callback: function(value: number | string) {
            return format(value, { compact: true });
          },
          font: {
            size: 11,
            family: "'Space', monospace",
          },
        },
      },
      x: {
        border: {
          display: false,
        },
        grid: {
          display: false,
        },
        ticks: {
          color: 'rgba(12, 17, 14, 0.4)',
          autoSkip: true,
          maxRotation: 0,
          font: {
            size: 11,
            family: "'Space', monospace",
          },
        },
      },
    },
  };

  return (
    <div className="surface-card p-5 sm:p-7">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow font-space text-emerald-700">Performance</p>
          <h2 className="mt-1.5 text-xl font-extrabold tracking-[-0.02em] text-ink sm:text-2xl">Sales Overview</h2>
          <p className="mt-0.5 text-sm text-black/55">Your sales over the last 7 days</p>
        </div>
        {hasData && (
          <span className="inline-flex items-center gap-2 rounded-full bg-ink px-3 py-1.5 font-space text-[11px] uppercase tracking-wider text-white">
            <span className="h-2 w-2 rounded-full bg-lime" />
            Live
          </span>
        )}
      </div>
      <div className="relative h-60 w-full min-w-0 sm:h-72 lg:h-80">
        {chartData.labels.length > 0 && <Line data={chartConfig} options={options} />}
        {!hasData && (
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="rounded-2xl bg-white/90 px-5 py-4 text-center ring-1 ring-black/5 backdrop-blur">
              <p className="font-bold text-ink">No sales in the last 7 days</p>
              <p className="mt-0.5 text-sm text-black/55">New orders will show up here.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesChart;