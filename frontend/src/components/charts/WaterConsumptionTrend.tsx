import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface WaterConsumptionTrendProps {
  history: { month: string; reading: number; consumption: number; amount: number }[];
}

export const WaterConsumptionTrend: React.FC<WaterConsumptionTrendProps> = ({ history }) => {
  return (
    <div className="w-full h-56">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.2)" />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v} m³`}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const val = payload[0].value as number;
                return (
                  <div className="bg-slate-900 text-white text-xs p-2.5 rounded-xl shadow-xl border border-slate-800">
                    <p className="font-bold text-slate-300">{label}</p>
                    <p className="text-sky-400 font-semibold mt-0.5">Consumption: {val} m³</p>
                    <p className="text-slate-400 text-[11px]">Billed: ${(val * 1.75).toFixed(2)}</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Line
            type="monotone"
            dataKey="consumption"
            name="Usage (m³)"
            stroke="#0284c7"
            strokeWidth={3}
            dot={{ r: 4, fill: '#0284c7', strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 6, fill: '#0284c7' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
