import React, { useState, useEffect, useMemo } from 'react';
import { 
  Transaction, 
  Member, 
  ViewState, 
  TransactionType 
} from './types';
import * as FinanceService from './services/financeService';
import { formatRupiah, formatInputDisplay } from './utils';
import LiveClock from './components/LiveClock';
import MemberManager from './components/MemberManager';
import FinanceChart from './components/FinanceChart';
import MemberChart from './components/MemberChart';

// Icons
const DashboardIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
const IncomeIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 11l5-5m0 0l5 5m-5-5v12" /></svg>;
const ExpenseIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 13l-5 5m0 0l-5-5m5 5V6" /></svg>;
const HistoryIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const MemberIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const SunIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 9h-1m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" /></svg>;
const MoonIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>;
const ExportIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('DASHBOARD');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
  });

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amountStr, setAmountStr] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMember, setSelectedMember] = useState('');

  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [editTxAmountStr, setEditTxAmountStr] = useState('');
  const [editTxDesc, setEditTxDesc] = useState('');
  const [editTxDate, setEditTxDate] = useState('');

  const [historyFilter, setHistoryFilter] = useState<'ALL' | TransactionType>('ALL');
  const [historyMonth, setHistoryMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => { loadAllData(); }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [txs, mems] = await Promise.all([
        FinanceService.getTransactions(),
        FinanceService.getMembers()
      ]);
      setTransactions(txs);
      setMembers(mems);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const totalBalance = useMemo(() => {
    return transactions.reduce((acc, curr) => curr.type === TransactionType.INCOME ? acc + curr.amount : acc - curr.amount, 0);
  }, [transactions]);

  const { monthlyIncome, monthlyExpense } = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const currentMonthTxs = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    return {
      monthlyIncome: currentMonthTxs.filter(t => t.type === TransactionType.INCOME).reduce((a, t) => a + t.amount, 0),
      monthlyExpense: currentMonthTxs.filter(t => t.type === TransactionType.EXPENSE).reduce((a, t) => a + t.amount, 0),
    };
  }, [transactions]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\./g, '');
    if (!isNaN(Number(val))) setAmountStr(val);
  };

  const handleEditAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\./g, '');
    if (!isNaN(Number(val))) setEditTxAmountStr(val);
  };

  const handleTransactionSubmit = async (type: TransactionType) => {
    if (!amountStr || parseInt(amountStr) <= 0) return alert("Mohon isi nominal yang valid");
    if (!description) return alert("Mohon isi keterangan");
    if (type === TransactionType.INCOME && !selectedMember) return alert("Mohon pilih anggota");

    const memberName = members.find(m => m.id === selectedMember)?.name;
    try {
      const newTx = await FinanceService.saveTransaction({
        date, type, amount: parseInt(amountStr), description,
        memberId: selectedMember || undefined,
        memberName: memberName || undefined
      });
      setTransactions(prev => [...prev, newTx]);
      setAmountStr(''); setDescription(''); setSelectedMember('');
      setView('DASHBOARD');
    } catch (e: any) { alert("Gagal menyimpan transaksi"); }
  };

  const handleEditMember = async (id: string, newName: string) => {
    try {
      await FinanceService.updateMember(id, newName);
      loadAllData();
    } catch (error: any) { alert("Gagal mengupdate anggota"); throw error; }
  };

  const handleStartEditTx = (t: Transaction) => {
    setEditingTxId(t.id);
    setEditTxAmountStr(t.amount.toString());
    setEditTxDesc(t.description);
    setEditTxDate(t.date);
  };

  const handleSaveEditTx = async () => {
    if (!editingTxId) return;
    if (!editTxAmountStr || parseInt(editTxAmountStr) <= 0) return alert("Mohon isi nominal yang valid");
    if (!editTxDesc) return alert("Mohon isi keterangan");

    try {
      await FinanceService.updateTransaction(editingTxId, {
        amount: parseInt(editTxAmountStr),
        description: editTxDesc,
        date: editTxDate
      });
      await loadAllData();
      setEditingTxId(null);
    } catch (e: any) { alert("Gagal mengupdate transaksi"); }
  };

  const handleExportCSV = () => {
    let sorted = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (historyMonth) sorted = sorted.filter(t => t.date.startsWith(historyMonth));
    if (historyFilter !== 'ALL') sorted = sorted.filter(t => t.type === historyFilter);

    if (sorted.length === 0) return alert("Tidak ada data untuk diekspor");

    // Header disesuaikan dengan tampilan Riwayat
    const headers = ['Tanggal', 'Keterangan', 'Kontributor', 'Tipe', 'Nominal (Angka)', 'Nominal (Format)'];
    
    const rows = sorted.map(t => [
      t.date,
      `"${t.description.replace(/"/g, '""')}"`,
      `"${t.memberName || '-'}"`,
      t.type === TransactionType.INCOME ? 'Pemasukan' : 'Pengeluaran',
      t.type === TransactionType.INCOME ? t.amount : -t.amount, // Raw number untuk kalkulasi Excel
      `"${t.type === TransactionType.INCOME ? '+' : '-'}${formatRupiah(t.amount)}"` // Formatted untuk estetika
    ]);

    // Tambahkan BOM agar Excel membaca sebagai UTF-8 (mencegah karakter berantakan)
    const BOM = '\uFEFF';
    const csvContent = BOM + [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Laporan_Kas_Grup_D_${historyMonth || 'Semua'}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const ThemeToggle = () => (
    <button
      onClick={toggleTheme}
      className="relative flex items-center justify-between w-full p-1 bg-slate-200/50 dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-2xl overflow-hidden group transition-all duration-500 hover:shadow-lg"
      aria-label="Toggle Theme"
    >
      <div 
        className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white dark:bg-indigo-600 rounded-[0.85rem] shadow-sm transition-all duration-500 theme-switch-thumb ${
          theme === 'dark' ? 'translate-x-full' : 'translate-x-0'
        }`}
      />
      <div className="flex-1 flex items-center justify-center py-2.5 relative z-10 transition-colors duration-500">
        <SunIcon />
        <span className={`ml-2 text-[10px] font-black uppercase tracking-widest hidden md:inline ${theme === 'light' ? 'text-indigo-600' : 'text-slate-500'}`}>Light</span>
      </div>
      <div className="flex-1 flex items-center justify-center py-2.5 relative z-10 transition-colors duration-500">
        <MoonIcon />
        <span className={`ml-2 text-[10px] font-black uppercase tracking-widest hidden md:inline ${theme === 'dark' ? 'text-white' : 'text-slate-400'}`}>Dark</span>
      </div>
    </button>
  );

  const renderNav = () => (
    <nav className="fixed bottom-0 left-0 w-full bg-white/90 dark:bg-slate-950/90 backdrop-blur-3xl border-t border-slate-200 dark:border-white/5 px-2 py-1 flex justify-around items-center z-50 md:sticky md:top-0 md:h-screen md:w-80 md:flex-col md:justify-start md:border-t-0 md:border-r md:p-10 transition-all duration-500">
      <div className="hidden md:flex flex-col items-center mb-16 w-full group">
        <div className="p-5 bg-indigo-600 rounded-[2.25rem] shadow-indigo-glow transform transition-all duration-700 group-hover:rotate-[10deg] group-hover:scale-110">
           <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05 1.18 1.91 2.53 1.91 1.29 0 2.13-.72 2.13-1.71 0-2.69-5.04-1.84-5.04-4.5 0-1.42 1.1-2.58 2.69-2.94V5h2.67v1.9c1.7.35 2.96 1.48 2.96 3.45h-1.96c-.1-1.05-1.02-1.88-2.31-1.88-1.2 0-2.08.73-2.08 1.62 0 2.39 5.04 1.5 5.04 4.31 0 1.46-1.11 2.7-2.65 3.1z"/>
           </svg>
        </div>
        <div className="text-center mt-6">
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">GRUP D</h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400 dark:text-slate-500 mt-1 opacity-60">UANG KAS</p>
        </div>
      </div>
      
      <div className="flex flex-row md:flex-col md:w-full items-center justify-around w-full gap-1 md:gap-3">
        {[
          { id: 'DASHBOARD', label: 'Dashboard', icon: DashboardIcon },
          { id: 'INCOME', label: 'Pemasukan', icon: IncomeIcon },
          { id: 'EXPENSE', label: 'Pengeluaran', icon: ExpenseIcon },
          { id: 'HISTORY', label: 'Riwayat', icon: HistoryIcon },
          { id: 'MEMBERS', label: 'Anggota', icon: MemberIcon },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id as ViewState)}
            className={`flex flex-col md:flex-row items-center md:w-full md:px-6 md:py-4 md:rounded-[1.75rem] transition-all duration-500 relative group ${
              view === item.id 
                ? 'text-indigo-600 dark:text-white md:bg-indigo-600/10 dark:md:bg-indigo-600 md:shadow-soft-xl' 
                : 'text-slate-400 dark:text-slate-500 hover:text-indigo-500 md:hover:bg-slate-100/50 dark:md:hover:bg-white/5'
            }`}
          >
            {view === item.id && (
              <span className="hidden md:block absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-indigo-600 rounded-full dark:bg-white"></span>
            )}
            <span className={`mb-1 md:mb-0 md:mr-5 transition-all duration-500 ${view === item.id ? 'scale-110' : 'group-hover:scale-110'}`}>{item.icon()}</span>
            <span className={`text-[9px] md:text-[15px] font-bold tracking-tight ${view === item.id ? 'opacity-100' : 'opacity-60'}`}>{item.label}</span>
          </button>
        ))}
      </div>

      <div className="hidden md:block mt-auto w-full pt-8 border-t border-slate-100 dark:border-white/5">
        <ThemeToggle />
      </div>

      <button onClick={toggleTheme} className="md:hidden flex flex-col items-center justify-center p-2 text-slate-400">
        <span>{theme === 'light' ? <MoonIcon /> : <SunIcon />}</span>
      </button>
    </nav>
  );

  const renderDashboard = () => (
    <div className="space-y-10 animate-slide-up">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Balance Card */}
        <div className="bg-white dark:bg-slate-900/40 p-10 rounded-5xl shadow-soft-xl border border-slate-200 dark:border-white/5 relative overflow-hidden group hover:-translate-y-2 transition-all duration-500">
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-[80px] group-hover:bg-indigo-500/20 transition-all duration-700"></div>
          <div className="relative z-10">
            <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/30 rounded-3xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-8 transform transition-transform group-hover:scale-110">
              <DashboardIcon />
            </div>
            <p className="text-slate-400 dark:text-slate-500 text-[11px] font-black uppercase tracking-[0.3em]">Total Saldo Kas</p>
            <p className="text-4xl font-black text-slate-900 dark:text-white mt-4 font-mono-premium tracking-tighter">{formatRupiah(totalBalance)}</p>
          </div>
        </div>

        {/* Income Card */}
        <div className="bg-white dark:bg-slate-900/40 p-10 rounded-5xl shadow-soft-xl border border-slate-200 dark:border-white/5 relative overflow-hidden group hover:-translate-y-2 transition-all duration-500">
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-[80px] group-hover:bg-emerald-500/20 transition-all duration-700"></div>
          <div className="relative z-10">
            <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/30 rounded-3xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-8 transform transition-transform group-hover:scale-110">
              <IncomeIcon />
            </div>
            <p className="text-slate-400 dark:text-slate-500 text-[11px] font-black uppercase tracking-[0.3em]">Masuk • {new Date().toLocaleDateString('id-ID', {month: 'short'})}</p>
            <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-4 font-mono-premium tracking-tighter">+{formatRupiah(monthlyIncome)}</p>
          </div>
        </div>

        {/* Expense Card */}
        <div className="bg-white dark:bg-slate-900/40 p-10 rounded-5xl shadow-soft-xl border border-slate-200 dark:border-white/5 relative overflow-hidden group hover:-translate-y-2 transition-all duration-500">
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-rose-500/10 rounded-full blur-[80px] group-hover:bg-rose-500/20 transition-all duration-700"></div>
          <div className="relative z-10">
            <div className="w-14 h-14 bg-rose-50 dark:bg-rose-900/30 rounded-3xl flex items-center justify-center text-rose-600 dark:text-rose-400 mb-8 transform transition-transform group-hover:scale-110">
              <ExpenseIcon />
            </div>
            <p className="text-slate-400 dark:text-slate-500 text-[11px] font-black uppercase tracking-[0.3em]">Keluar • {new Date().toLocaleDateString('id-ID', {month: 'short'})}</p>
            <p className="text-3xl font-black text-rose-600 dark:text-rose-400 mt-4 font-mono-premium tracking-tighter">-{formatRupiah(monthlyExpense)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-10">
        <FinanceChart transactions={transactions} theme={theme} />
        <MemberChart transactions={transactions} theme={theme} />
      </div>

      <div className="bg-white dark:bg-slate-900/40 rounded-5xl shadow-soft-xl border border-slate-200 dark:border-white/5 p-10">
        <div className="flex justify-between items-center mb-10 px-2">
          <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-5 tracking-tight">
            Mutasi Terakhir
            <span className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse"></span>
          </h3>
          <button onClick={() => setView('HISTORY')} className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-500 hover:text-indigo-600 transition-colors">Semua Data</button>
        </div>
        <div className="space-y-4">
          {transactions.slice().reverse().slice(0, 5).map(t => (
            <div key={t.id} className="group flex justify-between items-center p-6 rounded-4xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all duration-500 border border-transparent hover:border-slate-200 dark:hover:border-white/10 shadow-inner-soft md:shadow-none hover:shadow-soft-xl">
              <div className="flex items-center gap-6 flex-1 min-w-0">
                <div className={`flex-shrink-0 w-14 h-14 rounded-[1.75rem] flex items-center justify-center shadow-inner ${t.type === TransactionType.INCOME ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600'}`}>
                  {t.type === TransactionType.INCOME ? <IncomeIcon /> : <ExpenseIcon />}
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-bold text-slate-900 dark:text-white truncate transition-colors group-hover:text-indigo-600">{t.description}</p>
                  <p className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500 mt-2">{new Date(t.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})} {t.memberName ? `• ${t.memberName}` : ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-8">
                <p className={`font-mono-premium font-black text-lg whitespace-nowrap px-6 py-2 rounded-2xl ${t.type === TransactionType.INCOME ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600'}`}>
                  {t.type === TransactionType.INCOME ? '+' : '-'}{formatRupiah(t.amount)}
                </p>
                <button onClick={() => handleStartEditTx(t)} className="opacity-0 group-hover:opacity-100 p-3 text-slate-300 hover:text-indigo-500 dark:hover:text-white dark:hover:bg-indigo-600 rounded-2xl transition-all duration-300 transform hover:scale-110">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </button>
              </div>
            </div>
          ))}
          {transactions.length === 0 && <p className="text-slate-400 text-sm font-bold text-center py-20 bg-slate-50 dark:bg-white/5 rounded-[2.5rem]">Belum ada aktivitas.</p>}
        </div>
      </div>
    </div>
  );

  const renderHistory = () => {
    let sorted = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (historyMonth) sorted = sorted.filter(t => t.date.startsWith(historyMonth));
    if (historyFilter !== 'ALL') sorted = sorted.filter(t => t.type === historyFilter);

    return (
      <div className="animate-slide-up bg-white dark:bg-slate-900/40 rounded-5xl shadow-soft-xl border border-slate-200 dark:border-white/5 overflow-hidden">
        <div className="p-12 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/30">
          <div className="flex flex-col xl:flex-row justify-between xl:items-center gap-10">
            <div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Riwayat Mutasi</h2>
              <p className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 dark:text-slate-500 mt-2">Laporan Rekapitulasi Kas</p>
            </div>
            <div className="flex flex-wrap gap-5">
              <button 
                onClick={handleExportCSV}
                className="flex items-center gap-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 px-7 py-4 rounded-3xl text-[11px] font-black uppercase tracking-widest hover:border-indigo-500/30 hover:text-indigo-600 transition-all shadow-sm group"
              >
                <span className="group-hover:-translate-y-1 transition-transform">
                  <ExportIcon />
                </span>
                Export CSV (Excel Ready)
              </button>
              <input type="month" value={historyMonth} onChange={(e) => setHistoryMonth(e.target.value)} className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-white/10 text-slate-800 dark:text-white px-7 py-4 rounded-3xl text-sm font-bold focus:border-indigo-500 shadow-sm" />
              <div className="flex bg-white dark:bg-slate-900 p-2 rounded-3xl border-2 border-slate-200 dark:border-white/10 shadow-sm">
                {[
                  { id: 'ALL', label: 'Semua' },
                  { id: TransactionType.INCOME, label: 'Masuk' },
                  { id: TransactionType.EXPENSE, label: 'Keluar' }
                ].map(f => (
                  <button key={f.id} onClick={() => setHistoryFilter(f.id as any)} className={`px-7 py-2.5 text-[11px] font-black uppercase tracking-[0.15em] rounded-2xl transition-all ${historyFilter === f.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-indigo-500'}`}>{f.label}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-white/5">
          {sorted.map((t) => (
            <div key={t.id} className="p-10 hover:bg-slate-50/50 dark:hover:bg-white/5 transition-all duration-500 group flex flex-col sm:flex-row justify-between sm:items-center gap-8">
              <div className="flex items-center gap-8">
                 <div className={`w-16 h-16 rounded-[1.75rem] flex items-center justify-center shrink-0 shadow-inner ${t.type === TransactionType.INCOME ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600'}`}>
                   {t.type === TransactionType.INCOME ? <IncomeIcon /> : <ExpenseIcon />}
                 </div>
                 <div>
                    <p className="text-xl font-bold text-slate-800 dark:text-white leading-tight mb-2 group-hover:text-indigo-600 transition-colors">{t.description}</p>
                    <div className="flex items-center gap-4">
                      <span className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500">{new Date(t.date).toLocaleDateString('id-ID', {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'})}</span>
                      {t.memberName && <span className="w-2 h-2 bg-slate-200 dark:bg-slate-800 rounded-full"></span>}
                      {t.memberName && <span className="text-xs font-bold text-indigo-500">Kontributor: {t.memberName}</span>}
                    </div>
                 </div>
              </div>
              <div className="flex items-center gap-8 justify-between sm:justify-end">
                <p className={`font-mono-premium font-black text-2xl ${t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {t.type === TransactionType.INCOME ? '+' : '-'}{formatRupiah(t.amount)}
                </p>
                <button onClick={() => handleStartEditTx(t)} className="p-4 text-slate-300 hover:text-white hover:bg-indigo-600 shadow-sm transition-all rounded-[1.25rem] border border-transparent hover:border-indigo-500/20">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
              </div>
            </div>
          ))}
          {sorted.length === 0 && <div className="p-32 text-center text-slate-400 dark:text-slate-600 font-black uppercase tracking-[0.4em] text-sm opacity-30 italic">Laporan Kosong</div>}
        </div>
      </div>
    );
  };

  const renderForm = (type: TransactionType) => (
    <div className="animate-slide-up max-w-2xl mx-auto bg-white dark:bg-slate-900/40 rounded-5xl shadow-soft-xl border border-slate-200 dark:border-white/5 overflow-hidden">
      <div className={`p-12 relative overflow-hidden ${type === TransactionType.INCOME ? 'bg-indigo-600' : 'bg-slate-800 dark:bg-slate-950'}`}>
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-white opacity-10 rounded-full blur-[90px]"></div>
        <h2 className="text-4xl font-black text-white mb-3 relative z-10 tracking-tight">{type === TransactionType.INCOME ? 'Entri Pemasukan' : 'Entri Pengeluaran'}</h2>
        <p className="text-white/50 text-[11px] font-black uppercase tracking-[0.4em] relative z-10">Laporan Finansial Grup</p>
      </div>
      <div className="p-14 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div>
            <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-4 ml-1">Tanggal</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-8 py-5 rounded-[1.75rem] bg-slate-50 dark:bg-slate-950 border-2 border-transparent focus:border-indigo-500/20 text-slate-800 dark:text-white font-bold" />
          </div>
          {type === TransactionType.INCOME && (
            <div>
              <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-4 ml-1">Kontributor</label>
              <select value={selectedMember} onChange={(e) => setSelectedMember(e.target.value)} className="w-full px-8 py-5 rounded-[1.75rem] bg-slate-50 dark:bg-slate-950 border-2 border-transparent focus:border-indigo-500/20 text-slate-800 dark:text-white font-bold">
                <option value="">Pilih Anggota</option>
                {members.map(m => (<option key={m.id} value={m.id}>{m.name}</option>))}
              </select>
            </div>
          )}
        </div>
        <div>
          <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-4 ml-1">Nominal</label>
          <div className="relative group">
            <span className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xl">Rp</span>
            <input type="text" value={formatInputDisplay(amountStr ? parseInt(amountStr) : 0)} onChange={handleAmountChange} placeholder="0" className="w-full pl-20 pr-10 py-7 rounded-[2.25rem] bg-slate-50 dark:bg-slate-950 border-2 border-transparent focus:border-indigo-500 text-slate-800 dark:text-white font-mono-premium text-3xl font-black shadow-inner-soft" />
          </div>
        </div>
        <div>
          <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-4 ml-1">Keterangan</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Apa tujuan transaksi ini?" className="w-full px-8 py-6 rounded-[2rem] bg-slate-50 dark:bg-slate-950 border-2 border-transparent focus:border-indigo-500/20 text-slate-800 dark:text-white font-bold placeholder-slate-400 transition-all resize-none shadow-inner-soft" />
        </div>
        <button onClick={() => handleTransactionSubmit(type)} className={`w-full py-7 rounded-[2.25rem] text-white font-black text-xl tracking-tight shadow-xl hover:-translate-y-2 hover:shadow-2xl transition-all duration-500 ${type === TransactionType.INCOME ? 'bg-indigo-600 shadow-indigo-600/30' : 'bg-slate-800 dark:bg-slate-950 shadow-slate-900/30'}`}>Submit Laporan</button>
      </div>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
      <div className="relative w-20 h-20 mb-10">
        <div className="absolute inset-0 border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 rounded-full animate-spin"></div>
        <div className="absolute inset-4 border-4 border-indigo-100 dark:border-indigo-950 border-b-indigo-400 rounded-full animate-spin [animation-direction:reverse] opacity-50"></div>
      </div>
      <p className="text-indigo-600 font-black uppercase tracking-[0.5em] text-xs animate-pulse">Initializing Hub</p>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-500">
      {renderNav()}
      <main className="flex-1 p-6 md:p-16 mb-24 md:mb-0 overflow-y-auto h-screen">
        <div className="max-w-6xl mx-auto pb-16">
          <div className="flex justify-end md:hidden mb-4">
             <div className="w-24"><ThemeToggle /></div>
          </div>
          <LiveClock />
          <div className="mt-16">
            {view === 'DASHBOARD' && renderDashboard()}
            {view === 'INCOME' && renderForm(TransactionType.INCOME)}
            {view === 'EXPENSE' && renderForm(TransactionType.EXPENSE)}
            {view === 'HISTORY' && renderHistory()}
            {view === 'MEMBERS' && (
              <MemberManager 
                members={members} 
                onUpdate={loadAllData}
                onEdit={handleEditMember}
              />
            )}
          </div>

          <footer className="mt-24 py-8 border-t border-slate-200 dark:border-white/5 flex flex-col items-center">
            <div className="text-slate-400 dark:text-slate-600 font-bold text-[10px] tracking-[0.4em] uppercase opacity-60 hover:opacity-100 transition-opacity cursor-default animate-fade-in">
              AILO CORP | ANIQ SUSILO
            </div>
          </footer>
        </div>
        
        {/* Simple Modal Overlay for Editing (Already implemented in original) */}
        {editingTxId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-md animate-fade-in">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-5xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
               <div className="p-8 bg-indigo-600 text-white flex justify-between items-center">
                  <h3 className="text-2xl font-black">Edit Data</h3>
                  <button onClick={() => setEditingTxId(null)} className="p-2 hover:bg-white/20 rounded-xl transition-all">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
               </div>
               <div className="p-10 space-y-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Tanggal</label>
                    <input type="date" value={editTxDate} onChange={(e) => setEditTxDate(e.target.value)} className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 font-bold text-slate-800 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Nominal</label>
                    <input type="text" value={formatInputDisplay(parseInt(editTxAmountStr) || 0)} onChange={handleEditAmountChange} className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 font-mono-premium font-bold text-slate-800 dark:text-white text-xl" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Keterangan</label>
                    <textarea value={editTxDesc} onChange={(e) => setEditTxDesc(e.target.value)} className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 font-bold text-slate-800 dark:text-white resize-none" rows={2} />
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button onClick={() => setEditingTxId(null)} className="flex-1 py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-black uppercase tracking-widest text-[11px]">Batal</button>
                    <button onClick={handleSaveEditTx} className="flex-1 py-4 rounded-2xl bg-indigo-600 text-white font-black uppercase tracking-widest text-[11px] shadow-lg shadow-indigo-600/20">Update</button>
                  </div>
               </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;