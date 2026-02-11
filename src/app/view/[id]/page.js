'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';

export default function DetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { id } = params;
  const idLoket = searchParams.get('id_loket');
  
  const [ship, setShip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showOpenGate, setShowOpenGate] = useState(true);

  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (ship && idLoket) {
      document.title = `LOKET ${idLoket}`;
    } else {
      document.title = "Jadwal";
    }
  }, [ship, idLoket]);

  // --- LOGIKA FETCH DATA ---
  useEffect(() => {
    if (!id) return;
    
    const fetchShipData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/?v=${Date.now()}`, { 
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
        }); 
        const data = await response.json();

        if (!Array.isArray(data)) {
           console.error("Error API: Data bukan array", data);
           return;
        }

        const decodedId = decodeURIComponent(id).trim();

        if (idLoket) {
          const currentShipForLoket = data.find(item => String(item.id_loket) === String(idLoket));
          
          if (currentShipForLoket && String(currentShipForLoket.VOYAGE_NO).trim() !== decodedId) {
            console.log("Jadwal berubah! Redirecting ke jadwal baru...");
            setIsRedirecting(true); 
            window.location.replace(`/api/loket/${idLoket}`); 
            return; 
          }
        }

        const foundShip = data.find(item => String(item.VOYAGE_NO).trim() === decodedId);
        
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
  }, [id, idLoket]);

  useEffect(() => {
    if (isRedirecting) return;
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const blink = setInterval(() => setShowOpenGate(prev => !prev), 1500);
    return () => {
      clearInterval(timer);
      clearInterval(blink);
    };
  }, [isRedirecting]);

  const formatTime = (date) => date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const formatDate = (date) => date.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  if (isRedirecting) return (
    <div className="min-h-screen bg-blue-950 flex flex-col items-center justify-center text-white font-sans">
        <span className="text-8xl mb-6 animate-spin">🔄</span>
    </div>
  );

  if (loading) return <div className="min-h-screen bg-blue-950 flex items-center justify-center text-white text-3xl">Memuat Data...</div>;
  if (!ship) return <div className="min-h-screen bg-blue-950 flex items-center justify-center text-red-400 text-2xl font-bold">Kapal tidak ditemukan atau sudah berangkat.</div>;

  return (
    <div className="min-h-screen bg-blue-950 p-3 flex flex-col items-center justify-center relative overflow-hidden font-sans">
      <div className="w-full max-w-full relative z-10">
          <div className="text-center hidden md:block p-3">
            <div className="text-7xl font-black text-white">{formatTime(currentTime)}</div>
              <div className="text-3xl text-white font-medium uppercase">{formatDate(currentTime)}</div>
            </div>
        <div className="rounded-[2.5rem] overflow-hidden mt-16 md:mt-0">
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
              <div className="text-blue-300 font-black text-2xl md:text-6xl tracking-tight leading-none break-words">
                {ship.NM_OPERATOR}
              </div>
            </div>
            <div className="h-28 w-40 flex items-center justify-center rounded-xl">
               <img src="/assets/logo_pelindo.png" alt="Pelindo" className="h-28 object-contain" onError={(e) => e.target.style.display='none'} />
            </div>
          </div>
          <div className="p-20 text-center bg-blue-900 relative">
            <div className="inline-flex items-center gap-3 px-8 py-3 rounded-4xl mb-10">
              <span className="text-7xl">🚢</span>
              <span className="text-9xl md:text-[10rem] font-bold text-blue-50">{ship.NAMA_KAPAL}</span>
            </div>
              <h3 className="text-green-300 text-3xl font-bold tracking-[0.3em] uppercase">Tujuan</h3>
              <div className="w-full overflow-hidden mb-6 py-2">
                <div className="text-7xl md:text-9xl font-black text-purple-300">{ship.NM_PORT_NEXT}</div>
            </div>
          </div>
          <div className="py-5 text-center transition-all duration-500 bg-amber-300">
            <h2 className="text-6xl font-black uppercase tracking-tight text-blue-900">
              {showOpenGate ? 'SIAPKAN TIKET DAN IDENTITAS' : 'OPEN BOARDING'}
            </h2>
          </div>
        </div>
      </div>
    </div>
  );
}