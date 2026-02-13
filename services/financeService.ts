import { Transaction, Member, TransactionType } from '../types';
import { supabase } from '../supabaseClient';

// --- MEMBERS SERVICE ---

export const getMembers = async (): Promise<Member[]> => {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching members:', error);
    return [];
  }
  return data || [];
};

export const addMember = async (name: string): Promise<Member> => {
  const { data, error } = await supabase
    .from('members')
    .insert([{ name }])
    .select()
    .single();

  if (error) {
    console.error('Error adding member:', error);
    throw error;
  }
  return data;
};

export const updateMember = async (id: string, newName: string): Promise<void> => {
  const { error } = await supabase
    .from('members')
    .update({ name: newName })
    .eq('id', id);

  if (error) {
    console.error('Error updating member:', error);
    throw error;
  }
};

export const removeMember = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('members')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting member:', error);
    throw error;
  }
  return true;
};

// --- TRANSACTIONS SERVICE ---

export const getTransactions = async (): Promise<Transaction[]> => {
  // Join with members table to get the name
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      members (
        name
      )
    `)
    .order('date', { ascending: true }); // Order by date initially

  if (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }

  // Map Supabase result to our Frontend Transaction Type
  return (data || []).map((t: any) => ({
    id: t.id,
    date: t.date,
    type: t.type as TransactionType,
    amount: t.amount,
    description: t.description,
    memberId: t.member_id,
    // Flatten the joined data: members.name -> memberName
    memberName: t.members?.name, 
    createdAt: new Date(t.created_at).getTime(),
  }));
};

export const saveTransaction = async (transaction: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> => {
  const payload = {
    date: transaction.date,
    type: transaction.type,
    amount: transaction.amount,
    description: transaction.description,
    member_id: transaction.memberId || null,
  };

  const { data, error } = await supabase
    .from('transactions')
    .insert([payload])
    .select(`
      *,
      members (
        name
      )
    `)
    .single();

  if (error) {
    console.error('Error saving transaction:', error);
    throw error;
  }

  return {
    id: data.id,
    date: data.date,
    type: data.type as TransactionType,
    amount: data.amount,
    description: data.description,
    memberId: data.member_id,
    memberName: data.members?.name,
    createdAt: new Date(data.created_at).getTime(),
  };
};

export const updateTransaction = async (id: string, updates: Partial<Transaction>): Promise<void> => {
  // Convert frontend fields to database columns
  const payload: any = {};
  if (updates.amount !== undefined) payload.amount = updates.amount;
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.date !== undefined) payload.date = updates.date;
  if (updates.memberId !== undefined) payload.member_id = updates.memberId;

  const { error } = await supabase
    .from('transactions')
    .update(payload)
    .eq('id', id);

  if (error) {
    console.error('Error updating transaction:', error);
    throw error;
  }
};

export const deleteTransaction = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting transaction:', error);
    throw error;
  }
};