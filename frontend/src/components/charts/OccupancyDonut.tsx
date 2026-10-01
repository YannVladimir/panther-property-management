import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface OccupancyDonutProps {
  occupied: number;
  available: number;
  reserved: number;
  maintenance: number;
}

export const OccupancyDonut: React.FC<OccupancyDonutProps> = ({
  occupied,
  available,
  reserved,
  maintenance,
}) => {
  const total = occupied + available + reserved + maintenance;
  const occupancyRate = total > 0 ? Math.round((occupied / total) * 100) : 0;

  const data = [
    { name: 'Occupied', value: occupied, color: '#10b981' }, // Emerald
    { name: 'Available', value: available, color: '#0ea5e9' }, // Sky Blue
    { name: 'Reserved', value: reserved, color: '#f59e0b' }, // Amber
    { name: 'Maintenance', value: maintenance, color: '#f43f5e' }, // Rose
  ].filter((d) => d.value > 0);

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <div className="relative w-44 h-44 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0];
                  return (
                    <div className="bg-slate-900 text-white text-xs px-2.5 py-1.5 rounded-lg shadow-xl border border-slate-800">
                      <p className="font-semibold">{item.name}: {item.value} Units</p>
                      <p className="text-[10px] text-slate-300">
                        {Math.round(((item.value as number) / total) * 100)}% of total
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Pie
              data={data}
              innerRadius={52}
              outerRadius={70}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {/* Center Metric */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-extrabold font-display text-slate-900 dark:text-white tracking-tight">
            {occupancyRate}%
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Occupied
          </span>
        </div>
      </div>

      {/* Legend list */}
      <div className="flex-1 w-full space-y-2 text-xs">
        <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-700 dark:text-slate-300 font-medium">Occupied</span>
          </div>
          <span className="font-bold text-slate-900 dark:text-white">{occupied} Units</span>
        </div>
        <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
            <span className="text-slate-700 dark:text-slate-300 font-medium">Available</span>
          </div>
          <span className="font-bold text-slate-900 dark:text-white">{available} Units</span>
        </div>
        <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-slate-700 dark:text-slate-300 font-medium">Reserved</span>
          </div>
          <span className="font-bold text-slate-900 dark:text-white">{reserved} Units</span>
        </div>
        <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="text-slate-700 dark:text-slate-300 font-medium">Maintenance</span>
          </div>
          <span className="font-bold text-slate-900 dark:text-white">{maintenance} Units</span>
        </div>
      </div>
    </div>
  );
};
