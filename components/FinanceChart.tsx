import React from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Transaction, TransactionType } from '../types';
import { formatRupiah } from '../utils';

interface Props {
  transactions: Transaction[];
  theme: 'light' | 'dark';
}

const FinanceChart: React.FC<Props> = ({ transactions, theme }) => {
  const data = React.useMemo(() => {
    const map = new Map<string, { name: string; income: number; expense: number }>();
    const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    sorted.forEach(t => {
      const date = new Date(t.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const name = date.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });

      if (!map.has(key)) {
        map.set(key, { name, income: 0, expense: 0 });
      }

      const entry = map.get(key)!;
      if (t.type === TransactionType.INCOME) {
        entry.income += t.amount;
      } else {
        entry.expense += t.amount;
      }
    });

    return Array.from(map.values()).slice(-12);
  }, [transactions]);

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900/40 p-8 rounded-[2.5rem] shadow-soft-xl border border-slate-200 dark:border-white/5 flex items-center justify-center h-64 text-slate-400 dark:text-slate-600 font-bold uppercase tracking-widest text-xs animate-fade-in italic">
        Belum ada data transaksi untuk grafik.
      </div>
    );
  }

  const isDark = theme === 'dark';

  return (
    <div className="bg-white dark:bg-slate-900/40 p-8 rounded-[2.5rem] shadow-soft-xl border border-slate-200 dark:border-white/5 hover:border-indigo-500/30 transition-all duration-700 animate-slide-up group">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10 px-2">
        <div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter group-hover:text-indigo-600 transition-colors duration-500">
            Arus Kas Bulanan
          </h3>
          <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Analisis 12 Bulan Terakhir</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-500/5 rounded-full border border-emerald-500/10">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">Pemasukan</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-1.5 bg-rose-500/5 rounded-full border border-rose-500/10">
            <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]"></span>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">Pengeluaran</span>
          </div>
        </div>
      </div>
      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            barGap={8}
          >
            <defs>
              <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={1}/>
                <stop offset="100%" stopColor="#059669" stopOpacity={0.8}/>
              </linearGradient>
              <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity={1}/>
                <stop offset="100%" stopColor="#e11d48" stopOpacity={0.8}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.05)"} />
            <XAxis 
              dataKey="name" 
              tick={{fill: isDark ? '#64748b' : '#94a3b8', fontSize: 10, fontWeight: 700}} 
              axisLine={false} 
              tickLine={false} 
              dy={10}
            />
            <YAxis 
              tickFormatter={(value) => formatRupiah(value).replace(',00', '').replace('Rp', '')} 
              tick={{fill: isDark ? '#64748b' : '#94a3b8', fontSize: 10, fontWeight: 700}} 
              width={60}
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
              itemStyle={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}
              labelStyle={{ color: isDark ? '#f8fafc' : '#0f172a', fontWeight: 900, marginBottom: '12px', fontSize: '14px' }}
              formatter={(value: number) => [formatRupiah(value), '']}
            />
            <Bar 
              dataKey="income" 
              name="Pemasukan" 
              fill="url(#incomeGradient)" 
              radius={[6, 6, 0, 0]} 
              barSize={18}
              animationDuration={1800}
              animationEasing="cubic-bezier(0.19, 1, 0.22, 1)"
              animationBegin={0}
            />
            <Bar 
              dataKey="expense" 
              name="Pengeluaran" 
              fill="url(#expenseGradient)" 
              radius={[6, 6, 0, 0]} 
              barSize={18}
              animationDuration={1800}
              animationEasing="cubic-bezier(0.19, 1, 0.22, 1)"
              animationBegin={200}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default FinanceChart;