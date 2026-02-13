import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { Transaction, TransactionType } from '../types';
import { formatRupiah } from '../utils';

interface Props {
  transactions: Transaction[];
}

const FinanceChart: React.FC<Props> = ({ transactions }) => {
  // Aggregate data by month
  const data = React.useMemo(() => {
    const map = new Map<string, { name: string; income: number; expense: number }>();
    
    // Sort transactions by date first
    const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    sorted.forEach(t => {
      const date = new Date(t.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
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

    // Take last 6 months usually looks best, or all if less
    return Array.from(map.values()).slice(-12);
  }, [transactions]);

  if (data.length === 0) {
    return (
      <div className="bg-slate-800 p-8 rounded-2xl shadow-lg border border-slate-700 flex items-center justify-center h-64 text-slate-500">
        Belum ada data transaksi untuk grafik.
      </div>
    );
  }

  return (
    <div className="bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700 hover:border-slate-600 transition-colors">
      <h3 className="text-lg font-bold text-slate-200 mb-6 flex items-center gap-2">
        Analisis Arus Kas Bulanan
      </h3>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 5,
              right: 10,
              left: 10,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
            <XAxis dataKey="name" tick={{fill: '#94a3b8', fontSize: 12}} axisLine={false} tickLine={false} />
            <YAxis 
              tickFormatter={(value) => formatRupiah(value)} 
              tick={{fill: '#94a3b8', fontSize: 11}} 
              width={100}
              axisLine={false} 
              tickLine={false}
            />
            <Tooltip 
              cursor={{fill: 'rgba(255,255,255,0.05)'}}
              contentStyle={{ 
                backgroundColor: '#1e293b', 
                borderRadius: '12px', 
                border: '1px solid #334155', 
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)',
                color: '#f8fafc'
              }}
              formatter={(value: number) => [formatRupiah(value), '']}
              labelStyle={{ color: '#e2e8f0', fontWeight: 'bold', marginBottom: '8px' }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Bar dataKey="income" name="Pemasukan" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
            <Bar dataKey="expense" name="Pengeluaran" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default FinanceChart;