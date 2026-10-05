import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { PropertyPerformancePoint } from '../../api/reports';

interface PropertyPerformanceBarProps {
  properties: PropertyPerformancePoint[];
}

export const PropertyPerformanceBar: React.FC<PropertyPerformanceBarProps> = ({ properties }) => {
  const data = properties.map((p) => {
    const nameParts = p.propertyName.split(' ');
    return {
      name: nameParts[0] + ' ' + (nameParts[1] || ''),
      fullName: p.propertyName,
      occupancyRate: Math.round(p.occupancyRatePercent),
      revenueEstimate: p.monthlyRevenue,
    };
  });

  const colors = ['#0c8fe9', '#10b981', '#6366f1', '#f59e0b', '#ec4899'];

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.2)" />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}%`}
            domain={[0, 100]}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className="bg-slate-900 text-white text-xs p-3 rounded-xl shadow-xl border border-slate-800 space-y-1">
                    <p className="font-bold text-brand-300">{item.fullName}</p>
                    <p className="font-semibold text-emerald-400">
                      Occupancy: {item.occupancyRate}%
                    </p>
                    <p className="text-slate-300">
                      Monthly Revenue: ${item.revenueEstimate.toLocaleString()}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="occupancyRate" radius={[8, 8, 0, 0]} maxBarSize={45}>
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
