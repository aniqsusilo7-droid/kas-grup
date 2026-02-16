import React, { useState } from 'react';
import { Member } from '../types';
import * as FinanceService from '../services/financeService';

interface Props {
  members: Member[];
  onUpdate: () => Promise<void> | void; 
  onEdit: (id: string, newName: string) => Promise<void> | void;
}

const MemberManager: React.FC<Props> = ({ members, onUpdate, onEdit }) => {
  const [newName, setNewName] = useState('');
  const [isProcessing, setIsProcessing] = useState<string | null>(null); 
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setIsProcessing('ADD');
    try {
      await FinanceService.addMember(newName);
      setNewName('');
      await onUpdate();
    } catch (error: any) { alert("Error: " + error?.message); }
    finally { setIsProcessing(null); }
  };

  const saveEdit = async (id: string) => {
    if (!editName.trim()) return;
    setIsProcessing(id);
    try {
      await onEdit(id, editName);
      setEditingId(null);
    } catch (error) { console.error(error); }
    finally { setIsProcessing(null); }
  };

  return (
    <div className="animate-slide-up bg-white dark:bg-slate-900/40 rounded-5xl shadow-soft-xl p-12 md:p-16 border border-slate-200 dark:border-white/5">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10 mb-16">
        <div>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">Manajemen Anggota</h3>
          <p className="text-slate-400 dark:text-slate-500 text-[11px] font-black uppercase tracking-[0.4em] mt-3">Direktori Personel Grup</p>
        </div>
        <div className="px-7 py-3 bg-indigo-600/10 rounded-[1.25rem] text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-widest border border-indigo-500/10 font-mono-premium shadow-inner">
          {members.length} USERS
        </div>
      </div>
      
      <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-6 mb-16">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nama Personel Baru..."
          disabled={isProcessing === 'ADD'}
          className="flex-1 px-10 py-6 border-2 border-slate-100 dark:border-slate-800 rounded-[2rem] bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white placeholder-slate-400 focus:border-indigo-500/30 transition-all font-bold text-lg shadow-inner-soft"
        />
        <button
          type="submit"
          disabled={isProcessing === 'ADD' || !newName.trim()}
          className="bg-indigo-600 text-white px-12 py-6 rounded-[2rem] hover:bg-indigo-700 font-black tracking-tight transition-all duration-500 shadow-xl shadow-indigo-600/20 hover:-translate-y-2 active:scale-95 disabled:opacity-50"
        >
          {isProcessing === 'ADD' ? 'Processing...' : 'Tambah Anggota'}
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map((member) => (
          <div key={member.id} className="group p-8 bg-slate-50 dark:bg-slate-950/50 rounded-[2.25rem] border border-slate-200 dark:border-white/5 hover:border-indigo-500/20 hover:bg-white dark:hover:bg-slate-950 transition-all duration-700 hover:shadow-soft-xl">
            {editingId === member.id ? (
              <div className="flex flex-col gap-4">
                <input 
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-5 py-3 text-sm bg-white dark:bg-slate-950 border-2 border-indigo-500 rounded-2xl text-slate-800 dark:text-white font-bold shadow-inner"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button onClick={() => saveEdit(member.id)} className="flex-1 bg-emerald-500 text-white text-[10px] font-black uppercase py-2.5 rounded-xl shadow-lg shadow-emerald-500/20">Save</button>
                  <button onClick={() => setEditingId(null)} className="flex-1 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase py-2.5 rounded-xl">Back</button>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-lg transition-transform group-hover:scale-110 shadow-inner">
                    {member.name.charAt(0)}
                  </div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-lg tracking-tight">{member.name}</span>
                </div>
                <button type="button" onClick={() => { setEditingId(member.id); setEditName(member.name); }} className="p-3 text-slate-300 hover:text-indigo-600 dark:hover:text-white hover:bg-indigo-50 dark:hover:bg-indigo-600 rounded-2xl transition-all duration-300 transform hover:scale-110 border border-transparent hover:border-indigo-500/10">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      {members.length === 0 && (
        <div className="p-32 text-center border-4 border-dashed border-slate-100 dark:border-white/5 rounded-5xl">
          <p className="text-slate-300 dark:text-slate-700 font-black uppercase tracking-[0.4em] text-xs italic">Awaiting Personnel</p>
        </div>
      )}
    </div>
  );
};

export default MemberManager;