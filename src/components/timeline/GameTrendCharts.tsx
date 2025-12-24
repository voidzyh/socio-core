import React from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { GameStatistics } from '../../store/types';
import './GameTrendCharts.css';

interface GameTrendChartsProps {
  statistics: GameStatistics;
}

export const GameTrendCharts: React.FC<GameTrendChartsProps> = ({ statistics }) => {
  // 准备人口数据
  const populationData = statistics.populationHistory.map(p => ({
    year: `第${p.year}年`,
    人口: p.count,
  }));

  // 准备资源数据
  const resourceData = statistics.resourceHistory.map(r => ({
    year: `第${r.year}年`,
    食物: Math.floor(r.resources.food),
    资金: Math.floor(r.resources.money),
    医疗: Math.floor(r.resources.medicine),
  }));

  // 准备出生死亡数据
  const birthsDeathsData = statistics.populationHistory.map(p => {
    const births = statistics.birthsHistory.find(b => b.year === p.year)?.count || 0;
    const deaths = statistics.deathsHistory.find(d => d.year === p.year)?.count || 0;
    return {
      year: `第${p.year}年`,
      出生: births,
      死亡: deaths,
    };
  });

  return (
    <div className="game-trend-charts">
      <h3 className="charts-title">📈 趋势分析</h3>

      <div className="charts-container">
        {/* 人口趋势图 */}
        <div className="chart-section">
          <h4 className="chart-title">人口变化</h4>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={populationData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="year"
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
              />
              <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '0.5rem',
                }}
                labelStyle={{ color: '#f3f4f6' }}
              />
              <Line
                type="monotone"
                dataKey="人口"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 资源趋势图 */}
        <div className="chart-section">
          <h4 className="chart-title">资源变化</h4>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={resourceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="year"
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
              />
              <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '0.5rem',
                }}
                labelStyle={{ color: '#f3f4f6' }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="食物"
                stackId="1"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.3}
              />
              <Area
                type="monotone"
                dataKey="资金"
                stackId="2"
                stroke="#f59e0b"
                fill="#f59e0b"
                fillOpacity={0.3}
              />
              <Area
                type="monotone"
                dataKey="医疗"
                stackId="3"
                stroke="#ec4899"
                fill="#ec4899"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 出生死亡趋势图 */}
        <div className="chart-section">
          <h4 className="chart-title">出生/死亡统计</h4>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={birthsDeathsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="year"
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
              />
              <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '0.5rem',
                }}
                labelStyle={{ color: '#f3f4f6' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="出生"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="死亡"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
