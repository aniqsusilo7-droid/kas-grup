import React, { useState, useEffect } from 'react';

const LiveClock: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="relative group animate-fade-in">
      <div className="absolute -inset-4 bg-indigo-600/10 blur-[100px] rounded-full opacity-40 group-hover:opacity-60 transition-all duration-1000"></div>
      
      <div className="bg-white/90 dark:bg-slate-900/60 backdrop-blur-[40px] p-10 md:p-14 rounded-5xl shadow-soft-xl border border-slate-200 dark:border-white/10 relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-12 group hover:shadow-2xl transition-all duration-700">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-indigo-500/5 rounded-full blur-[100px] transition-all duration-1000 group-hover:scale-150"></div>

        <div className="text-center md:text-left relative z-10">
          <div className="flex items-center justify-center md:justify-start gap-4 mb-5">
             <span className="px-4 py-1.5 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-[0.4em] rounded-full shadow-lg shadow-indigo-600/30">System Active</span>
             <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse shadow-glow"></span>
          </div>
          <div className="text-7xl md:text-8xl font-black tracking-tighter text-slate-900 dark:text-white font-mono-premium leading-none drop-shadow-sm">
            {formatTime(time)}
          </div>
        </div>

        <div className="text-center md:text-right relative z-10 md:pt-8">
          <div className="text-2xl md:text-3xl font-black text-slate-800 dark:text-slate-200 tracking-tight mb-4 leading-tight">
            {formatDate(time)}
          </div>
          <div className="flex items-center justify-center md:justify-end gap-3 text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] opacity-60">
            <div className="w-5 h-5 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            </div>
            Data Latency: Optimal
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveClock;