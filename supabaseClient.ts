import { createClient } from '@supabase/supabase-js';

// --- BAGIAN INI WAJIB DIISI ---
// Silakan copy-paste dari Dashboard Supabase Anda (Settings -> API)
// Contoh: const HARDCODED_URL = "https://xyz.supabase.co";
const HARDCODED_URL = "https://sjkwbycteetashdbpvvs.supabase.co"; 

// Contoh: const HARDCODED_KEY = "eyJhbGciOiJIUzI1NiIsInR5...";
const HARDCODED_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqa3dieWN0ZWV0YXNoZGJwdnZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5NzgyMjAsImV4cCI6MjA4NjU1NDIyMH0.mVRWNM3-FZpjj5G_pTErniEkZfVF7KuvP5LmaTlfaBE";
// ------------------------------

// Helper function to safely access environment variables
const getEnv = (key: string) => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      // @ts-ignore
      return import.meta.env[key];
    }
  } catch (e) {}
  
  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      // @ts-ignore
      return process.env[key];
    }
  } catch (e) {}

  return '';
};

const supabaseUrl = HARDCODED_URL || getEnv('VITE_SUPABASE_URL');
const supabaseKey = HARDCODED_KEY || getEnv('VITE_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseKey) {
  console.warn("PENTING: Supabase URL atau Key belum diisi! Silakan isi variabel HARDCODED_URL dan HARDCODED_KEY di file supabaseClient.ts");
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseKey || 'placeholder'
);