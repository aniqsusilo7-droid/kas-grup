import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Transaction, TransactionType } from '../types';
import { formatRupiah } from '../utils';

interface Props {
  transactions: Transaction[];
  theme: 'light' | 'dark';
}

const MemberChart: React.FC<Props> = ({ transactions, theme }) => {
  const data = React.useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const filtered = transactions.filter(t => {
      const tDate = new Date(t.date);
      return (
        t.type === TransactionType.INCOME &&
        t.memberId &&
        tDate.getMonth() === currentMonth &&
        tDate.getFullYear() === currentYear
      );
    });

    const map = new Map<string, number>();
    filtered.forEach(t => {
      const name = t.memberName || 'Tanpa Nama';
      const current = map.get(name) || 0;
      map.set(name, current + t.amount);
    });

    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

  }, [transactions]);

  const currentMonthName = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  const chartHeight = Math.max(350, data.length * 60);
  const isDark = theme === 'dark';

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900/40 p-10 rounded-[2.5rem] shadow-soft-xl border border-slate-200 dark:border-white/5 h-full flex flex-col min-h-[350px] animate-fade-in">
        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter mb-2">Peringkat Kontributor</h3>
        <p className="text-slate-400 dark:text-slate-600 text-[10px] font-black uppercase tracking-widest mb-10">Bulan {currentMonthName}</p>
        <div className="flex-1 flex items-center justify-center text-slate-400 dark:text-slate-600 text-xs font-black uppercase tracking-widest italic border-2 border-dashed border-slate-100 dark:border-white/5 rounded-[2rem]">
          Belum ada kontribusi bulan ini
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900/40 p-10 rounded-[2.5rem] shadow-soft-xl border border-slate-200 dark:border-white/5 hover:border-indigo-500/30 transition-all duration-700 animate-slide-up group flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12">
        <div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter mb-1 group-hover:text-indigo-600 transition-colors duration-500">Peringkat Kontributor</h3>
          <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest">Kontribusi {currentMonthName}</p>
        </div>
        <div className="px-5 py-2 bg-indigo-600/10 rounded-2xl text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] border border-indigo-500/10 shadow-sm font-mono-premium">
          LEADERBOARD
        </div>
      </div>
      
      <div style={{ height: chartHeight, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 0, right: 60, left: 10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="contributorGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.9}/>
                <stop offset="100%" stopColor="#4f46e5" stopOpacity={1}/>
              </linearGradient>
              <linearGradient id="contributorGold" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.9}/>
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.05)"} />
            <XAxis 
              type="number" 
              tickFormatter={(value) => formatRupiah(value).replace(',00', '').replace('Rp', '')}
              tick={{fill: isDark ? '#64748b' : '#94a3b8', fontSize: 10, fontWeight: 700}} 
              axisLine={false} 
              tickLine={false} 
              dy={10}
            />
            <YAxis 
              dataKey="name" 
              type="category" 
              width={120} 
              tick={{fill: isDark ? '#f1f5f9' : '#0f172a', fontSize: 12, fontWeight: 900, letterSpacing: '-0.025em'}} 
              axisLine={false} 
              tickLine={false}
            />
            <Tooltip 
              cursor={{fill: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', radius: 12}}
              contentStyle={{ 
                backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                borderRadius: '24px', 
                border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)', 
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                padding: '16px 20px',
                backdropFilter: 'blur(10px)'
              }}
              formatter={(value: number) => [formatRupiah(value), 'Total Kas']}
              labelStyle={{ color: isDark ? '#f1f5f9' : '#0f172a', fontWeight: 900, marginBottom: '10px', fontSize: '14px' }}
            />
            <Bar 
              dataKey="value" 
              name="Kontribusi" 
              fill="url(#contributorGradient)" 
              radius={[0, 10, 10, 0]} 
              barSize={32}
              animationDuration={2200}
              animationEasing="cubic-bezier(0.19, 1, 0.22, 1)"
              animationBegin={100}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={index === 0 ? 'url(#contributorGold)' : 'url(#contributorGradient)'} 
                  opacity={1 - (index * 0.1)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MemberChart;