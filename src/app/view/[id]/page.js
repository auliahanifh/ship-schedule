'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function DetailPage() {
  const params = useParams();
  const { id } = params;
  
  const [ship, setShip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showOpenGate, setShowOpenGate] = useState(true);

  useEffect(() => {
    const fetchShipData = async () => {
      try {
        const response = await fetch('/api/'); 
        const data = await response.json();
        const foundShip = data.find(item => item.VOYAGE_NO === id);
        
        if (foundShip) {
          setShip(foundShip);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching ship:', error);
        setLoading(false);
      }
    };

    fetchShipData();
    
    const interval = setInterval(fetchShipData, 60000); 
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const blink = setInterval(() => setShowOpenGate(prev => !prev), 600);
    return () => {
      clearInterval(timer);
      clearInterval(blink);
    };
  }, []);

  const formatTime = (date) => date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const formatDate = (date) => date.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  if (loading) return <div className="min-h-screen bg-blue-950 flex items-center justify-center text-white text-3xl">Memuat Data...</div>;
  if (!ship) return <div className="min-h-screen bg-blue-950 flex items-center justify-center text-red-400 text-2xl font-bold">Data Kapal Tidak Ditemukan atau Sudah Berangkat</div>;

  return (
    <div className="min-h-screen bg-blue-950 p-3 flex flex-col items-center justify-center relative overflow-hidden font-sans">
      <div className="w-full max-w-full relative z-10">
          <div className="text-center hidden md:block p-3">
            <div className="text-5xl font-black text-white">{formatTime(currentTime)}</div>
              <div className="text-white font-medium">{formatDate(currentTime)}</div>
            </div>
        <div className="rounded-[2.5rem] overflow-hidden mt-16 md:mt-0">
          {/* Bagian Operator */}
          <div className="bg-black p-6 px-8 flex justify-between items-center min-h-[140px]">
            <div className="h-28 w-40 rounded-xl flex items-center justify-center overflow-hidden p-2 relative">
              {ship.LOGO_OPERATOR ? (
                <img src={ship.LOGO_OPERATOR} alt="Logo" className="w-full h-full rounded-lg"/>
              ) : (
                <span className="text-xs font-bold text-white">LOGO OPERATOR</span>
              )}
            </div>
            <div className="flex-1 px-4 text-center">
              <div className="text-white text-sm font-bold tracking-[0.3em] uppercase mb-2">OPERATED BY</div>
              <div className="text-blue-300 font-black text-2xl md:text-5xl tracking-tight leading-none break-words">
                {ship.NM_OPERATOR}
              </div>
            </div>
            <div className="h-28 w-40 flex items-center justify-center rounded-xl">
               <img src="/assets/logo_pelindo.png" alt="Pelindo" className="h-20 object-contain" onError={(e) => e.target.style.display='none'} />
            </div>
          </div>
          {/* Tujuan & Nama Kapal */}
          <div className="p-20 text-center bg-blue-900 relative">
            <div className="inline-flex items-center gap-3 px-8 py-3 rounded-4xl mb-10">
              <span className="text-7xl">🚢</span>
              <span className="text-8xl md:text-8xl font-bold text-blue-50">{ship.NAMA_KAPAL}</span>
            </div>
              <h3 className="text-green-300 text-2xl font-bold tracking-[0.3em] uppercase">Tujuan</h3>
              <div className="w-full overflow-hidden mb-6 py-2">
                <div className="text-6xl md:text-6xl font-black text-purple-200">{ship.NM_PORT_NEXT}</div>
            </div>
          </div>
          {/* Footer Status */}
          <div className="py-5 text-center transition-all duration-300 bg-amber-300">
            <h2 className="text-6xl font-black uppercase tracking-tight text-blue-900">
              {showOpenGate ? 'SILAKAN MASUK' : 'OPEN BOARDING'}
            </h2>
          </div>
        </div>
      </div>
    </div>
  );
}