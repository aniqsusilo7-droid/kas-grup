import React, { useState, useEffect, useMemo } from 'react';
import { 
  Transaction, 
  Member, 
  ViewState, 
  TransactionType 
} from './types';
import * as FinanceService from './services/financeService';
import { formatRupiah, parseRupiahInput, formatInputDisplay } from './utils';
import LiveClock from './components/LiveClock';
import MemberManager from './components/MemberManager';
import FinanceChart from './components/FinanceChart';

// Icons (SVG) - Updated colors for Dark Theme
const DashboardIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
const IncomeIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" /></svg>;
const ExpenseIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" /></svg>;
const HistoryIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const MemberIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('DASHBOARD');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  // Form States
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amountStr, setAmountStr] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMember, setSelectedMember] = useState('');

  // Edit Transaction State
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [editTxAmountStr, setEditTxAmountStr] = useState('');
  const [editTxDesc, setEditTxDesc] = useState('');
  const [editTxDate, setEditTxDate] = useState('');

  // History Filter State
  const [historyFilter, setHistoryFilter] = useState<'ALL' | TransactionType>('ALL');

  // Initial Data Load
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [txs, mems] = await Promise.all([
        FinanceService.getTransactions(),
        FinanceService.getMembers()
      ]);
      setTransactions(txs);
      setMembers(mems);
    } catch (e) {
      console.error("Failed to load data", e);
    } finally {
      setLoading(false);
    }
  };

  const totalBalance = useMemo(() => {
    return transactions.reduce((acc, curr) => {
      return curr.type === TransactionType.INCOME ? acc + curr.amount : acc - curr.amount;
    }, 0);
  }, [transactions]);

  // Calculate Monthly Income/Expense
  const { monthlyIncome, monthlyExpense } = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const currentMonthTransactions = transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
    });

    const income = currentMonthTransactions
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((acc, t) => acc + t.amount, 0);

    const expense = currentMonthTransactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((acc, t) => acc + t.amount, 0);

    return { monthlyIncome: income, monthlyExpense: expense };
  }, [transactions]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\./g, '');
    if (!isNaN(Number(val))) {
      setAmountStr(val);
    }
  };

  const handleError = (error: any, context: string) => {
    console.error(`Error in ${context}:`, error);
    if (error?.code === '42501') {
      alert(`GAGAL: Izin Database Ditolak (RLS) saat ${context}.\n\nSolusi: Buka Supabase > SQL Editor > Jalankan:\nALTER TABLE members DISABLE ROW LEVEL SECURITY;\nALTER TABLE transactions DISABLE ROW LEVEL SECURITY;`);
    } else {
      alert(`Gagal ${context}: ` + (error?.message || "Error tidak diketahui"));
    }
  };

  const handleTransactionSubmit = async (type: TransactionType) => {
    if (!amountStr || parseInt(amountStr) <= 0) {
      alert("Mohon isi nominal yang valid");
      return;
    }
    if (!description) {
      alert("Mohon isi keterangan");
      return;
    }
    if (type === TransactionType.INCOME && !selectedMember) {
      alert("Mohon pilih anggota");
      return;
    }

    const memberName = members.find(m => m.id === selectedMember)?.name;

    try {
      const newTx = await FinanceService.saveTransaction({
        date,
        type,
        amount: parseInt(amountStr),
        description,
        memberId: selectedMember || undefined,
        memberName: memberName || undefined
      });

      setTransactions(prev => [...prev, newTx]);
      
      // Reset Form
      setAmountStr('');
      setDescription('');
      setSelectedMember('');
      alert('Transaksi berhasil disimpan!');
      setView('DASHBOARD');
    } catch (e: any) {
      handleError(e, "menyimpan transaksi");
    }
  };

  // Called when adding a new member
  const handleMemberUpdate = async () => {
    const mems = await FinanceService.getMembers();
    setMembers(mems);
  };

  const handleEditMember = async (id: string, newName: string) => {
    try {
      await FinanceService.updateMember(id, newName);
      // Refresh list
      const freshMembers = await FinanceService.getMembers();
      setMembers(freshMembers);
    } catch (error: any) {
      handleError(error, "mengupdate anggota");
      throw error; // Re-throw to inform MemberManager
    }
  }

  // --- Transaction Edit Handlers ---
  const handleStartEditTx = (tx: Transaction) => {
    setEditingTxId(tx.id);
    setEditTxAmountStr(tx.amount.toString());
    setEditTxDesc(tx.description);
    setEditTxDate(tx.date);
  };

  const handleCancelEditTx = () => {
    setEditingTxId(null);
    setEditTxAmountStr('');
    setEditTxDesc('');
    setEditTxDate('');
  };

  const handleSaveEditTx = async (id: string) => {
    if (!editTxAmountStr || isNaN(Number(editTxAmountStr)) || Number(editTxAmountStr) <= 0) {
      alert("Nominal tidak valid");
      return;
    }
    if (!editTxDesc.trim()) {
      alert("Keterangan tidak boleh kosong");
      return;
    }
    if (!editTxDate) {
      alert("Tanggal tidak boleh kosong");
      return;
    }

    try {
      await FinanceService.updateTransaction(id, {
        amount: parseInt(editTxAmountStr),
        description: editTxDesc,
        date: editTxDate
      });
      // Reload all data to refresh charts and totals properly
      await loadAllData();
      handleCancelEditTx();
    } catch (e: any) {
      handleError(e, "mengupdate transaksi");
    }
  };

  const renderNav = () => (
    <div className="fixed bottom-0 left-0 w-full bg-slate-900/90 backdrop-blur-md border-t border-slate-800 px-4 py-2 flex justify-around items-center z-50 md:sticky md:top-0 md:h-screen md:w-64 md:flex-col md:justify-start md:border-t-0 md:border-r md:p-6 shadow-2xl">
      <div className="hidden md:block mb-8 w-full animate-fade-in">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Dominic Kas Grup</h1>
        <p className="text-xs text-slate-400 mt-1">Professional Finance</p>
      </div>
      
      {[
        { id: 'DASHBOARD', label: 'Home', icon: DashboardIcon },
        { id: 'INCOME', label: 'Masuk', icon: IncomeIcon },
        { id: 'EXPENSE', label: 'Keluar', icon: ExpenseIcon },
        { id: 'HISTORY', label: 'Riwayat', icon: HistoryIcon },
        { id: 'MEMBERS', label: 'Anggota', icon: MemberIcon },
      ].map((item) => (
        <button
          key={item.id}
          onClick={() => setView(item.id as ViewState)}
          className={`flex flex-col md:flex-row items-center md:w-full md:px-4 md:py-3 md:rounded-xl md:mb-2 transition-all duration-300 ${
            view === item.id 
              ? 'bg-indigo-600/20 text-indigo-300 shadow-inner border border-indigo-500/30' 
              : 'text-slate-400 hover:text-indigo-300 hover:bg-slate-800/50'
          }`}
        >
          <span className="mb-1 md:mb-0 md:mr-3">{item.icon()}</span>
          <span className="text-[10px] md:text-sm font-medium">{item.label}</span>
        </button>
      ))}
    </div>
  );

  const renderDashboard = () => (
    <div className="space-y-6 animate-slide-up">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Balance Card */}
        <div className="bg-slate-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-slate-700 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <div className="w-24 h-24 bg-indigo-500 rounded-full blur-3xl"></div>
          </div>
          <p className="text-slate-400 text-sm font-medium">Saldo Kas Utama</p>
          <p className="text-3xl font-bold text-white mt-2 tracking-tight">{formatRupiah(totalBalance)}</p>
        </div>

        {/* Income Card */}
        <div className="bg-slate-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-slate-700 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-15 transition-opacity">
            <div className="w-24 h-24 bg-emerald-500 rounded-full blur-3xl"></div>
          </div>
          <p className="text-emerald-400 text-sm font-medium">Total Pemasukan Perbulan</p>
          <p className="text-2xl font-bold text-emerald-300 mt-2 tracking-tight">+{formatRupiah(monthlyIncome)}</p>
        </div>

        {/* Expense Card */}
        <div className="bg-slate-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-slate-700 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-15 transition-opacity">
            <div className="w-24 h-24 bg-rose-500 rounded-full blur-3xl"></div>
          </div>
          <p className="text-rose-400 text-sm font-medium">Total Pengeluaran Perbulan</p>
          <p className="text-2xl font-bold text-rose-300 mt-2 tracking-tight">-{formatRupiah(monthlyExpense)}</p>
        </div>
      </div>

      <FinanceChart transactions={transactions} />

      <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl shadow-lg border border-slate-700 p-6">
        <h3 className="font-bold text-slate-200 mb-4 flex items-center gap-2">
          <span>Transaksi Terakhir</span>
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
        </h3>
        <div className="space-y-3">
          {transactions.slice().reverse().slice(0, 5).map(t => (
            <div key={t.id} className="group flex justify-between items-center py-3 border-b border-slate-700/50 last:border-0 hover:bg-slate-700/30 px-3 rounded-lg transition-colors">
              
              {editingTxId === t.id ? (
                /* EDIT MODE */
                <div className="flex flex-col gap-2 w-full animate-fade-in p-2 bg-slate-900/50 rounded-lg">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editTxDesc}
                      onChange={(e) => setEditTxDesc(e.target.value)}
                      placeholder="Keterangan"
                      className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="flex gap-2 items-center flex-wrap">
                    <input 
                      type="date"
                      value={editTxDate}
                      onChange={(e) => setEditTxDate(e.target.value)}
                      className="bg-slate-800 border border-slate-600 rounded-lg px-2 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                    />
                    <div className="flex items-center gap-2 flex-1 min-w-[150px]">
                      <span className="text-slate-500 text-xs">Rp</span>
                      <input
                        type="text"
                        value={formatInputDisplay(Number(editTxAmountStr))}
                        onChange={(e) => {
                           const val = e.target.value.replace(/\./g, '');
                           if (!isNaN(Number(val))) setEditTxAmountStr(val);
                        }}
                        placeholder="Nominal"
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-right"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleSaveEditTx(t.id)} 
                        className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
                        title="Simpan"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      </button>
                      <button 
                        onClick={handleCancelEditTx} 
                        className="p-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
                        title="Batal"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* VIEW MODE */
                <>
                  <div className="flex items-center gap-3 flex-1 overflow-hidden">
                    <div className={`flex-shrink-0 w-2 h-2 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)] ${t.type === TransactionType.INCOME ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-rose-500 shadow-rose-500/50'}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate pr-2">{t.description}</p>
                      <p className="text-xs text-slate-400">{new Date(t.date).toLocaleDateString('id-ID')} {t.memberName ? `• ${t.memberName}` : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className={`font-bold font-mono text-sm whitespace-nowrap ${t.type === TransactionType.INCOME ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {t.type === TransactionType.INCOME ? '+' : '-'}{formatRupiah(t.amount)}
                    </p>
                    <div className="flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleStartEditTx(t)}
                        className="p-1.5 text-slate-500 hover:text-indigo-400 hover:bg-slate-700 rounded-lg transition-all"
                        title="Edit Transaksi"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                      {/* Delete button removed as requested */}
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
          {transactions.length === 0 && <p className="text-slate-500 text-sm text-center py-4">Belum ada transaksi.</p>}
        </div>
      </div>
    </div>
  );

  const renderForm = (type: TransactionType) => (
    <div className="animate-slide-up max-w-xl mx-auto bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden">
      <div className={`p-6 relative overflow-hidden ${type === TransactionType.INCOME ? 'bg-gradient-to-r from-emerald-800 to-emerald-600' : 'bg-gradient-to-r from-rose-800 to-rose-600'}`}>
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl"></div>
        <h2 className="text-2xl font-bold text-white mb-1 relative z-10">
          {type === TransactionType.INCOME ? 'Input Pemasukan' : 'Input Pengeluaran'}
        </h2>
        <p className="text-white/80 text-sm relative z-10">Catat arus kas {type === TransactionType.INCOME ? 'masuk' : 'keluar'} grup.</p>
      </div>
      
      <div className="p-8 space-y-6">
        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Tanggal Transaksi</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-600 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
          />
        </div>

        {/* Member Select (Income Only) */}
        {type === TransactionType.INCOME && (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Nama Anggota (Penyetor)</label>
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-600 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="">-- Pilih Anggota --</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Nominal (Rupiah)</label>
          <div className="relative">
            <span className="absolute left-4 top-3.5 text-slate-500 font-medium">Rp</span>
            <input
              type="text"
              value={formatInputDisplay(amountStr ? parseInt(amountStr) : 0)}
              onChange={handleAmountChange}
              placeholder="0"
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-600 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono text-lg"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Keterangan / Alasan</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder={type === TransactionType.INCOME ? "Contoh: Iuran Bulan Januari" : "Contoh: Beli Peralatan Kebersihan"}
            className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-600 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <button
          onClick={() => handleTransactionSubmit(type)}
          className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg transform transition hover:-translate-y-1 hover:shadow-xl ${
            type === TransactionType.INCOME 
              ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400' 
              : 'bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400'
          }`}
        >
          Simpan Transaksi
        </button>
      </div>
    </div>
  );

  const renderHistory = () => {
    // Basic sorting and grouping by month
    let sorted = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Filter logic
    if (historyFilter !== 'ALL') {
      sorted = sorted.filter(t => t.type === historyFilter);
    }

    return (
      <div className="animate-slide-up bg-slate-800 rounded-2xl shadow-lg border border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-700">
          <div className="flex flex-col md:flex-row justify-between items-center mb-4 md:mb-0">
            <h2 className="text-xl font-bold text-white">Riwayat Transaksi</h2>
            <div className="flex bg-slate-900 p-1 rounded-xl mt-3 md:mt-0 border border-slate-700">
              <button
                onClick={() => setHistoryFilter('ALL')}
                className={`px-4 py-2 text-xs font-medium rounded-lg transition-all ${historyFilter === 'ALL' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
              >
                Semua
              </button>
              <button
                onClick={() => setHistoryFilter(TransactionType.INCOME)}
                className={`px-4 py-2 text-xs font-medium rounded-lg transition-all ${historyFilter === TransactionType.INCOME ? 'bg-emerald-900/50 text-emerald-400 shadow-sm border border-emerald-900' : 'text-slate-400 hover:text-emerald-400'}`}
              >
                Pemasukan
              </button>
              <button
                onClick={() => setHistoryFilter(TransactionType.EXPENSE)}
                className={`px-4 py-2 text-xs font-medium rounded-lg transition-all ${historyFilter === TransactionType.EXPENSE ? 'bg-rose-900/50 text-rose-400 shadow-sm border border-rose-900' : 'text-slate-400 hover:text-rose-400'}`}
              >
                Pengeluaran
              </button>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2 text-center md:text-right">{sorted.length} Transaksi ditampilkan</p>
        </div>
        <div className="divide-y divide-slate-700/50">
          {sorted.map((t) => (
            <div key={t.id} className="p-4 hover:bg-slate-700/30 transition-colors flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                    t.type === TransactionType.INCOME ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-900' : 'bg-rose-900/50 text-rose-400 border border-rose-900'
                  }`}>
                    {t.type === TransactionType.INCOME ? 'Masuk' : 'Keluar'}
                  </span>
                  <span className="text-xs text-slate-500">{new Date(t.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <p className="text-slate-200 font-medium">{t.description}</p>
                {t.memberName && <p className="text-sm text-indigo-400 mt-0.5">Oleh: {t.memberName}</p>}
              </div>
              <div className="text-right">
                <p className={`font-bold font-mono ${t.type === TransactionType.INCOME ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {t.type === TransactionType.INCOME ? '+' : '-'}{formatRupiah(t.amount)}
                </p>
              </div>
            </div>
          ))}
          {sorted.length === 0 && (
            <div className="p-12 text-center text-slate-500">
              {historyFilter === 'ALL' ? 'Belum ada riwayat transaksi.' : `Tidak ada data ${historyFilter === TransactionType.INCOME ? 'pemasukan' : 'pengeluaran'}.`}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-indigo-400 animate-pulse">Memuat data...</div>;

  return (
    <div className="flex min-h-screen bg-slate-900 text-slate-200 font-sans">
      {renderNav()}
      
      <main className="flex-1 p-4 md:p-8 mb-16 md:mb-0 overflow-y-auto h-screen custom-scrollbar">
        <div className="max-w-4xl mx-auto">
          {/* Always show Clock on Dashboard or top of mobile */}
          <LiveClock />
          
          <div className="mt-6">
            {view === 'DASHBOARD' && renderDashboard()}
            {view === 'INCOME' && renderForm(TransactionType.INCOME)}
            {view === 'EXPENSE' && renderForm(TransactionType.EXPENSE)}
            {view === 'HISTORY' && renderHistory()}
            {view === 'MEMBERS' && (
              <MemberManager 
                members={members} 
                onUpdate={handleMemberUpdate}
                // Removed onDelete as requested
                onEdit={handleEditMember}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;