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
    <div className="bg-gradient-to-r from-indigo-900 to-purple-900 text-white p-6 rounded-2xl shadow-xl shadow-indigo-900/20 mb-6 transform transition-all hover:scale-[1.01] border border-white/10 relative overflow-hidden animate-fade-in">
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white opacity-5 rounded-full blur-3xl"></div>
      <div className="flex flex-col md:flex-row justify-between items-center relative z-10">
        <div className="text-center md:text-left">
          <h2 className="text-xs font-semibold text-indigo-200 uppercase tracking-widest mb-1">Waktu Saat Ini</h2>
          <div className="text-4xl md:text-5xl font-bold tracking-tight font-mono text-white drop-shadow-md">
            {formatTime(time)}
          </div>
        </div>
        <div className="mt-4 md:mt-0 text-center md:text-right">
          <div className="text-lg md:text-xl font-medium text-indigo-100">
            {formatDate(time)}
          </div>
          <div className="text-xs text-indigo-300 mt-1 flex items-center justify-center md:justify-end gap-2">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            Sistem Berjalan
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveClock;