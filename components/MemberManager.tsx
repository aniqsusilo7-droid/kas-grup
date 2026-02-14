import React, { useState } from 'react';
import { Member } from '../types';
import * as FinanceService from '../services/financeService';

interface Props {
  members: Member[];
  onUpdate: () => Promise<void> | void; // Used for Adding/Refreshing
  onEdit: (id: string, newName: string) => Promise<void> | void; // Dedicated for Editing
}

const MemberManager: React.FC<Props> = ({ members, onUpdate, onEdit }) => {
  const [newName, setNewName] = useState('');
  const [isProcessing, setIsProcessing] = useState<string | null>(null); // Stores ID of member being processed or 'ADD'
  
  // Edit State
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
    } catch (error: any) {
      console.error("Error adding member:", error);
      if (error?.code === '42501') {
        alert("GAGAL: Izin Database Ditolak (RLS).\n\nSolusi: Buka Supabase > SQL Editor > Jalankan:\nALTER TABLE members DISABLE ROW LEVEL SECURITY;");
      } else {
        alert("Gagal menambah anggota: " + (error?.message || "Error tidak diketahui"));
      }
    } finally {
      setIsProcessing(null);
    }
  };

  const startEditing = (member: Member) => {
    setEditingId(member.id);
    setEditName(member.name);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditName('');
  };

  const saveEdit = async (id: string) => {
    if (!editName.trim()) return;
    setIsProcessing(id);
    try {
      await onEdit(id, editName);
      setEditingId(null);
    } catch (error) {
      // Error handled in parent (App.tsx), but we catch here to stop loading state if needed
      console.error("Failed to edit in Manager", error);
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <div className="animate-slide-up bg-white rounded-2xl shadow-sm p-6 border border-slate-200">
      <h3 className="text-xl font-bold text-slate-800 mb-4">Manajemen Anggota</h3>
      
      {/* Add Member Form */}
      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nama Anggota Baru..."
          disabled={isProcessing === 'ADD'}
          className="flex-1 px-4 py-3 border border-slate-300 rounded-xl bg-slate-50 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400 transition-all"
        />
        <button
          type="submit"
          disabled={isProcessing === 'ADD' || !newName.trim()}
          className="bg-indigo-600 text-white px-6 py-2 rounded-xl hover:bg-indigo-500 font-medium transition-all shadow-md shadow-indigo-500/30 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center min-w-[100px]"
        >
          {isProcessing === 'ADD' ? 'Menyimpan...' : 'Tambah'}
        </button>
      </form>

      {/* Members List */}
      <div className="grid grid-cols-1 gap-3">
        {members.map((member) => (
          <div key={member.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-indigo-200 transition-all group">
            
            {editingId === member.id ? (
              // EDIT MODE
              <div className="flex flex-1 gap-2 items-center">
                <input 
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm bg-white border border-indigo-500 rounded-lg focus:outline-none text-slate-800"
                  autoFocus
                />
                <button 
                  onClick={() => saveEdit(member.id)}
                  disabled={isProcessing === member.id}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 text-sm font-medium rounded-lg transition-colors"
                >
                  Simpan
                </button>
                <button 
                  onClick={cancelEditing}
                  disabled={isProcessing === member.id}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-2 text-sm rounded-lg transition-colors"
                >
                  Batal
                </button>
              </div>
            ) : (
              // VIEW MODE
              <>
                <span className="font-medium text-slate-700 truncate mr-2 flex-1">{member.name}</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => startEditing(member)}
                    disabled={!!isProcessing}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all rounded-lg"
                    title="Edit Nama"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
      {members.length === 0 && (
        <p className="text-center text-slate-500 py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          Belum ada anggota terdaftar.
        </p>
      )}
    </div>
  );
};

export default MemberManager;