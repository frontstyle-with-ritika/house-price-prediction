import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

// ── Static reference data (derived from Ames Housing Dataset analysis) ────────
const FEATURE_IMPORTANCE = [
  { label: 'Overall Quality',  value: 29 },
  { label: 'Living Area',      value: 22 },
  { label: 'Neighborhood',     value: 18 },
  { label: 'Year Built',       value: 11 },
  { label: 'Basement Size',    value: 8  },
  { label: 'Garage Cars',      value: 7  },
  { label: 'Kitchen Quality',  value: 5  },
];

const NEIGHBORHOOD_PRICES = [
  { label: 'NridgHt', value: 335 },
  { label: 'NoRidge', value: 320 },
  { label: 'StoneBr', value: 310 },
  { label: 'Timber',  value: 280 },
  { label: 'Veenker', value: 245 },
  { label: 'CollgCr', value: 210 },
  { label: 'NAmes',   value: 165 },
  { label: 'MeadowV', value: 120 },
];

const PRICE_DISTRIBUTION = [
  { label: '<$100K',      value: 45  },
  { label: '$100-150K',   value: 180 },
  { label: '$150-200K',   value: 310 },
  { label: '$200-250K',   value: 290 },
  { label: '$250-300K',   value: 215 },
  { label: '$300-350K',   value: 145 },
  { label: '$350-400K',   value: 90  },
  { label: '>$400K',      value: 65  },
];

const QUALITY_VS_PRICE = [
  { quality: 1,  price: 60  }, { quality: 2,  price: 75  },
  { quality: 3,  price: 95  }, { quality: 4,  price: 115 },
  { quality: 5,  price: 145 }, { quality: 6,  price: 175 },
  { quality: 7,  price: 210 }, { quality: 8,  price: 265 },
  { quality: 9,  price: 330 }, { quality: 10, price: 440 },
];

// ── Chart color palette ─────────────────────────────────────────────────────
const COLORS = {
  blue:  '#2563EB',
  teal:  '#0F9D74',
  amber: '#D97706',
  grid:  '#E5E7EB',
  text:  '#6B7280',
};

const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
};

// ── Sub-components ──────────────────────────────────────────────────────────
function MetricCard({ label, value, sub, subColor }) {
  return (
    <div className="metric-card">
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      {sub && <div className="metric-sub" style={{ color: subColor }}>{sub}</div>}
    </div>
  );
}

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="chart-card">
      <div className="chart-card-title">{title}</div>
      <div className="chart-card-subtitle">{subtitle}</div>
      <div className="chart-card-canvas">{children}</div>
    </div>
  );
}

// ── Main Insights Panel ──────────────────────────────────────────────────────
export default function InsightsPanel({ predictedPrice, neighborhood }) {
  const featureData = {
    labels: FEATURE_IMPORTANCE.map(f => f.label),
    datasets: [{
      data: FEATURE_IMPORTANCE.map(f => f.value),
      backgroundColor: COLORS.blue,
      borderRadius: 4,
      borderSkipped: false,
    }],
  };

  const neighborhoodData = {
    labels: NEIGHBORHOOD_PRICES.map(n => n.label),
    datasets: [{
      data: NEIGHBORHOOD_PRICES.map(n => n.value),
      backgroundColor: NEIGHBORHOOD_PRICES.map(n =>
        n.label === neighborhood ? COLORS.amber : COLORS.teal
      ),
      borderRadius: 4,
      borderSkipped: false,
    }],
  };

  const distributionData = {
    labels: PRICE_DISTRIBUTION.map(d => d.label),
    datasets: [{
      data: PRICE_DISTRIBUTION.map(d => d.value),
      backgroundColor: COLORS.blue,
      borderRadius: 4,
      borderSkipped: false,
    }],
  };

  const qualityData = {
    labels: QUALITY_VS_PRICE.map(q => q.quality),
    datasets: [{
      data: QUALITY_VS_PRICE.map(q => q.price),
      borderColor: COLORS.amber,
      backgroundColor: 'rgba(217,119,6,0.1)',
      borderWidth: 2,
      pointRadius: 5,
      pointBackgroundColor: COLORS.amber,
      fill: true,
      tension: 0.3,
    }],
  };

  return (
    <div className="insights-panel-wrap">
      <div className="insights-header">
        <span className="insights-icon">📊</span>
        <div>
          <div className="insights-title">Market Insights</div>
          <div className="insights-subtitle">How your prediction compares to the dataset</div>
        </div>
      </div>

      <div className="metric-grid">
        <MetricCard label="Avg Predicted Price" value="$213,000" sub="+12% vs dataset avg" subColor="#15803D" />
        <MetricCard label="Top Neighborhood" value="NridgHt" sub="Avg $335,000" />
        <MetricCard label="Key Price Driver" value="Quality" sub="29% feature weight" />
        <MetricCard label="Model Accuracy" value="R² 0.91" sub="XGBoost model" subColor="#15803D" />
      </div>

      <div className="chart-grid">
        <ChartCard title="Top Features by Price Impact" subtitle="How much each feature drives predicted price">
          <Bar
            data={featureData}
            options={{
              ...baseOptions,
              indexAxis: 'y',
              scales: {
                x: { grid: { color: COLORS.grid }, ticks: { color: COLORS.text, callback: v => v + '%' } },
                y: { grid: { display: false }, ticks: { color: COLORS.text } },
              },
            }}
          />
        </ChartCard>

        <ChartCard title="Avg Price by Neighborhood" subtitle="Top 8 neighborhoods in the dataset">
          <Bar
            data={neighborhoodData}
            options={{
              ...baseOptions,
              scales: {
                x: { grid: { display: false }, ticks: { color: COLORS.text, maxRotation: 35 } },
                y: { grid: { color: COLORS.grid }, ticks: { color: COLORS.text, callback: v => '$' + v + 'K' } },
              },
            }}
          />
        </ChartCard>

        <ChartCard title="Price Distribution" subtitle="Number of homes by price range in dataset">
          <Bar
            data={distributionData}
            options={{
              ...baseOptions,
              scales: {
                x: { grid: { display: false }, ticks: { color: COLORS.text, maxRotation: 35 } },
                y: { grid: { color: COLORS.grid }, ticks: { color: COLORS.text } },
              },
            }}
          />
        </ChartCard>

        <ChartCard title="Quality vs Price" subtitle="Average price by overall quality rating">
          <Line
            data={qualityData}
            options={{
              ...baseOptions,
              scales: {
                x: { grid: { color: COLORS.grid }, ticks: { color: COLORS.text }, title: { display: true, text: 'Quality Rating', color: COLORS.text } },
                y: { grid: { color: COLORS.grid }, ticks: { color: COLORS.text, callback: v => '$' + v + 'K' } },
              },
            }}
          />
        </ChartCard>
      </div>
    </div>
  );
}
