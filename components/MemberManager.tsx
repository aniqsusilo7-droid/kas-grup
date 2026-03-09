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
    <div className="animate-slide-up bg-white dark:bg-slate-900/40 rounded-3xl md:rounded-5xl shadow-sm md:shadow-soft-xl p-6 md:p-16 border border-slate-200 dark:border-white/5">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-10 mb-8 md:mb-16">
        <div>
          <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none">Manajemen Anggota</h3>
          <p className="text-slate-400 dark:text-slate-500 text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em] mt-2 md:mt-3">Direktori Personel Grup</p>
        </div>
        <div className="px-5 py-2 md:px-7 md:py-3 bg-indigo-600/10 rounded-xl md:rounded-[1.25rem] text-indigo-600 dark:text-indigo-400 text-[10px] md:text-xs font-black uppercase tracking-widest border border-indigo-500/10 font-mono-premium shadow-inner">
          {members.length} USERS
        </div>
      </div>
      
      <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-4 md:gap-6 mb-10 md:mb-16">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nama Personel Baru..."
          disabled={isProcessing === 'ADD'}
          className="flex-1 px-6 py-4 md:px-10 md:py-6 border border-slate-100 dark:border-slate-800 rounded-2xl md:rounded-[2rem] bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white placeholder-slate-400 focus:border-indigo-500/30 transition-all font-bold text-base md:text-lg shadow-inner-soft"
        />
        <button
          type="submit"
          disabled={isProcessing === 'ADD' || !newName.trim()}
          className="bg-indigo-600 text-white px-8 py-4 md:px-12 md:py-6 rounded-2xl md:rounded-[2rem] hover:bg-indigo-700 font-black tracking-tight transition-all duration-300 shadow-lg shadow-indigo-600/20 active:scale-95 disabled:opacity-50"
        >
          {isProcessing === 'ADD' ? 'Processing...' : 'Tambah Anggota'}
        </button>
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {members.map((member) => (
          <div key={member.id} className="group p-5 md:p-8 bg-slate-50 dark:bg-slate-950/50 rounded-2xl md:rounded-[2.25rem] border border-slate-200 dark:border-white/5 hover:border-indigo-500/20 hover:bg-white dark:hover:bg-slate-950 transition-all duration-500 hover:shadow-soft-xl">
            {editingId === member.id ? (
              <div className="flex flex-col gap-3">
                <input 
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-2 text-sm bg-white dark:bg-slate-950 border-2 border-indigo-500 rounded-xl text-slate-800 dark:text-white font-bold shadow-inner"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button onClick={() => saveEdit(member.id)} className="flex-1 bg-emerald-500 text-white text-[10px] font-black uppercase py-2 rounded-lg shadow-md shadow-emerald-500/20">Save</button>
                  <button onClick={() => setEditingId(null)} className="flex-1 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase py-2 rounded-lg">Back</button>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4 md:gap-5">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-base md:text-lg transition-transform group-hover:scale-110 shadow-inner">
                    {member.name.charAt(0)}
                  </div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-base md:text-lg tracking-tight truncate max-w-[120px] md:max-w-none">{member.name}</span>
                </div>
                <button type="button" onClick={() => { setEditingId(member.id); setEditName(member.name); }} className="p-2 md:p-3 text-slate-300 hover:text-indigo-600 dark:hover:text-white hover:bg-indigo-50 dark:hover:bg-indigo-600 rounded-xl md:rounded-2xl transition-all duration-300 border border-transparent hover:border-indigo-500/10">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      {members.length === 0 && (
        <div className="p-20 md:p-32 text-center border-2 border-dashed border-slate-100 dark:border-white/5 rounded-3xl md:rounded-5xl">
          <p className="text-slate-300 dark:text-slate-700 font-black uppercase tracking-widest text-[10px] md:text-xs italic">Awaiting Personnel</p>
        </div>
      )}
    </div>
  );
};

export default MemberManager;