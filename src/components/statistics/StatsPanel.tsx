import React from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import './StatsPanel.css';

export const StatsPanel: React.FC = () => {
  const { statistics, populationCount, currentYear } = useGameStore();

  // 人口趋势数据
  const populationData = statistics.populationHistory.slice(-20);

  // 年龄分布
  const livingPeople = useGameStore.getState().people;
  const ageGroups = [
    { name: '0-18岁', value: 0, color: '#60a5fa' },
    { name: '19-60岁', value: 0, color: '#34d399' },
    { name: '60+岁', value: 0, color: '#fbbf24' },
  ];

  Array.from(livingPeople.values())
    .filter(p => p.isAlive)
    .forEach(p => {
      if (p.age < 18) ageGroups[0].value++;
      else if (p.age < 60) ageGroups[1].value++;
      else ageGroups[2].value++;
    });

  // 关键指标
  const metrics = [
    { label: '平均年龄', value: Math.floor(statistics.averageAge), unit: '岁' },
    { label: '平均健康', value: Math.floor(statistics.averageHealth), unit: '' },
    { label: '平均教育', value: statistics.averageEducation.toFixed(1), unit: '' },
    { label: '总出生', value: statistics.totalBirths, unit: '人' },
    { label: '总死亡', value: statistics.totalDeaths, unit: '人' },
    { label: '总人口', value: populationCount, unit: '人' },
  ];

  return (
    <div className="stats-panel">
      <h2 className="panel-title">数据统计</h2>

      {/* 关键指标 */}
      <div className="metrics-grid">
        {metrics.map((metric) => (
          <div key={metric.label} className="metric-card">
            <div className="metric-label">{metric.label}</div>
            <div className="metric-value">
              {metric.value}
              <span className="metric-unit">{metric.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 人口趋势图 */}
      <div className="chart-section">
        <h3 className="chart-title">人口趋势</h3>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={populationData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="year" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
            <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '0.5rem',
              }}
              labelStyle={{ color: '#f1f5f9' }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#3b82f6"
              name="人口"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 年龄分布图 */}
      <div className="chart-section">
        <h3 className="chart-title">年龄分布</h3>
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={ageGroups}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={60}
              paddingAngle={5}
              dataKey="value"
            >
              {ageGroups.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '0.5rem',
              }}
              labelStyle={{ color: '#f1f5f9' }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
