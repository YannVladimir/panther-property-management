import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const data = [
  { month: 'Jan', revenue: 98400, expenses: 24200, netProfit: 74200 },
  { month: 'Feb', revenue: 104500, expenses: 26800, netProfit: 77700 },
  { month: 'Mar', revenue: 112000, expenses: 29500, netProfit: 82500 },
  { month: 'Apr', revenue: 118000, expenses: 31000, netProfit: 87000 },
  { month: 'May', revenue: 126400, expenses: 34100, netProfit: 92300 },
  { month: 'Jun', revenue: 135800, expenses: 36200, netProfit: 99600 },
  { month: 'Jul', revenue: 139200, expenses: 38400, netProfit: 100800 },
  { month: 'Aug', revenue: 143200, expenses: 39500, netProfit: 103700 },
];

export const RevenueExpenseArea: React.FC = () => {
  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0c8fe9" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#0c8fe9" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.2)" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(val) => `$${val / 1000}k`}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-slate-900 text-white text-xs p-3 rounded-xl shadow-2xl border border-slate-800 space-y-1">
                    <p className="font-bold text-slate-300 mb-1">{label} 2026</p>
                    <p className="text-brand-400 font-semibold">
                      Revenue: ${(payload[0].value as number)?.toLocaleString()}
                    </p>
                    <p className="text-rose-400 font-semibold">
                      Expenses: ${(payload[1].value as number)?.toLocaleString()}
                    </p>
                    <p className="text-emerald-400 font-bold border-t border-slate-700/60 pt-1 mt-1">
                      Net Income: ${(payload[2].value as number)?.toLocaleString()}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend
            iconType="circle"
            wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
            formatter={(value) => <span className="text-slate-600 dark:text-slate-300 font-medium capitalize">{value}</span>}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            name="Gross Revenue"
            stroke="#0c8fe9"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#colorRevenue)"
          />
          <Area
            type="monotone"
            dataKey="expenses"
            name="Operational Expenses"
            stroke="#f43f5e"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorExpense)"
          />
          <Area
            type="monotone"
            dataKey="netProfit"
            name="Net Income"
            stroke="#10b981"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#colorNet)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
