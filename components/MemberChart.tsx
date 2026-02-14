import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Transaction, TransactionType } from '../types';
import { formatRupiah } from '../utils';

interface Props {
  transactions: Transaction[];
}

const MemberChart: React.FC<Props> = ({ transactions }) => {
  const data = React.useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // 1. Filter: Income only & Current Month
    const filtered = transactions.filter(t => {
      const tDate = new Date(t.date);
      return (
        t.type === TransactionType.INCOME &&
        t.memberId && // Must have a member
        tDate.getMonth() === currentMonth &&
        tDate.getFullYear() === currentYear
      );
    });

    // 2. Aggregate by Member
    const map = new Map<string, number>();
    
    filtered.forEach(t => {
      const name = t.memberName || 'Tanpa Nama';
      const current = map.get(name) || 0;
      map.set(name, current + t.amount);
    });

    // 3. Convert to Array for Recharts
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value); // Sort highest first

  }, [transactions]);

  const currentMonthName = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  
  // Calculate height dynamically based on number of items to ensure it looks good
  const chartHeight = Math.max(300, data.length * 40);

  if (data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-full flex flex-col min-h-[300px]">
        <h3 className="text-lg font-bold text-slate-800 mb-2">Grafik Pemasukan Anggota</h3>
        <p className="text-xs text-slate-500 mb-6">Bulan {currentMonthName}</p>
        <div className="flex-1 flex items-center justify-center text-slate-400 text-sm italic border-2 border-dashed border-slate-200 rounded-xl">
          Belum ada pemasukan bulan ini
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-indigo-200 transition-colors flex flex-col">
      <h3 className="text-lg font-bold text-slate-800 mb-1">Grafik Pemasukan Anggota</h3>
      <p className="text-xs text-slate-500 mb-4">Bulan {currentMonthName}</p>
      
      <div style={{ height: chartHeight, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20, 
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
            <XAxis 
              type="number" 
              tickFormatter={(value) => formatRupiah(value).replace(',00', '')} // Simplify label
              tick={{fill: '#64748b', fontSize: 11}} 
              axisLine={false} 
              tickLine={false} 
            />
            <YAxis 
              dataKey="name" 
              type="category" 
              width={120} 
              tick={{fill: '#334155', fontSize: 12, fontWeight: 500}} 
              axisLine={false} 
              tickLine={false}
            />
            <Tooltip 
              cursor={{fill: 'rgba(0,0,0,0.05)'}}
              contentStyle={{ 
                backgroundColor: '#ffffff', 
                borderRadius: '12px', 
                border: '1px solid #e2e8f0', 
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                color: '#1e293b'
              }}
              formatter={(value: number) => [formatRupiah(value), 'Pemasukan']}
              itemStyle={{ color: '#10b981' }}
              labelStyle={{ color: '#0f172a', fontWeight: 'bold', marginBottom: '8px' }}
            />
            <Bar 
              dataKey="value" 
              name="Pemasukan" 
              fill="#10b981" 
              radius={[0, 4, 4, 0]} 
              barSize={24}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#34d399'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MemberChart;