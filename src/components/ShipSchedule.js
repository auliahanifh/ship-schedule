'use client';

import React, { useState, useEffect } from 'react';

const ShipScheduleDisplay = () => {
  const [schedules, setSchedules] = useState([]);
  const [selectedShip, setSelectedShip] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showOpenGate, setShowOpenGate] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Auth states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');  

  // Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      const storedUser = localStorage.getItem('shipapp_user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          const userExists = await window.storage.get(`user:${userData.username}`);
          if (userExists) {
            setIsAuthenticated(true);
            setUsername(userData.username);
          } else {
            localStorage.removeItem('shipapp_user');
          }
        } catch (error) {
          localStorage.removeItem('shipapp_user');
        }
      }
    };
    checkAuth();
  }, []);

  // Fetch schedules with custom data
  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const response = await fetch('/api');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        
        // Load custom data from storage
        const schedulesWithCustom = await Promise.all(
          data.map(async (schedule) => {
            try {
              const customDataResult = await window.storage.get(`schedule:${schedule.VOYAGE_NO}`);
              if (customDataResult) {
                const customData = JSON.parse(customDataResult.value);
                return {
                  ...schedule,
                  NM_OPERATOR: customData.nmOperator || schedule.NM_OPERATOR,
                  LOGO_URL: customData.logoUrl || null,
                  hasCustomData: true
                };
              }
            } catch (err) {
              // No custom data for this schedule
            }
            return schedule;
          })
        );
        
        setSchedules(schedulesWithCustom);
        setLoading(false);
        setError(null);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.message);
        setLoading(false);
      }
    };
    fetchSchedules();
    const interval = setInterval(fetchSchedules, 120000);
    return () => clearInterval(interval);
  }, []);

  // Time updates
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Blink animation
  useEffect(() => {
    const blinkInterval = setInterval(() => setShowOpenGate(prev => !prev), 600);
    return () => clearInterval(blinkInterval);
  }, []);

  const formatTime = (date) => date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const formatDate = (date) => date.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // Auth handlers
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    
    try {
      if (authMode === 'register') {
        // Check if user exists
        try {
          const existingUser = await window.storage.get(`user:${username}`);
          if (existingUser) {
            setAuthError('Username sudah terdaftar');
            return;
          }
        } catch (err) {
          // User doesn't exist, continue
        }
        
        // Register new user
        const userData = {
          username,
          password,
          createdAt: new Date().toISOString()
        };
        
        await window.storage.set(`user:${username}`, JSON.stringify(userData));
        
        setIsAuthenticated(true);
        localStorage.setItem('shipapp_user', JSON.stringify({ username }));
        setShowAuthModal(false);
        setPassword('');
        alert('Akun berhasil dibuat!');
        
      } else {
        // Login
        try {
          const userResult = await window.storage.get(`user:${username}`);
          if (!userResult) {
            setAuthError('Username tidak ditemukan');
            return;
          }
          
          const userData = JSON.parse(userResult.value);
          
          if (userData.password !== password) {
            setAuthError('Kata sandi salah');
            return;
          }
          
          setIsAuthenticated(true);
          localStorage.setItem('shipapp_user', JSON.stringify({ username }));
          setShowAuthModal(false);
          setPassword('');
          
        } catch (err) {
          setAuthError('Username tidak ditemukan');
        }
      }
    } catch (error) {
      setAuthError('Terjadi kesalahan: ' + error.message);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUsername('');
    localStorage.removeItem('shipapp_user');
  };

  const handleShipClick = (ship) => {
    setSelectedShip(ship);
  };

  const handleBack = () => {
    setSelectedShip(null);
  };

  // AUTH MODAL
  const AuthModal = () => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
        <div className="text-center mb-6">
          <div className="text-5xl mb-4">🔐</div>
          <h2 className="text-3xl font-bold">
            {authMode === 'login' ? 'Login' : 'Daftar Akun'}
          </h2>
        </div>
        
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-700">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
              placeholder="Masukkan username"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-700">Kata Sandi</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
              placeholder="Masukkan kata sandi"
              required
            />
          </div>
          
          {authError && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl font-semibold">
              ⚠️ {authError}
            </div>
          )}
          
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-colors shadow-lg hover:shadow-xl"
          >
            {authMode === 'login' ? 'Login' : ' Daftar'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setAuthMode(authMode === 'login' ? 'register' : 'login');
              setAuthError('');
            }}
            className="text-blue-600 hover:text-blue-800 font-semibold hover:underline"
          >
            {authMode === 'login' 
              ? 'Belum memiliki akun? Daftarkan' 
              : 'Akun terdaftar? Login'}
          </button>
        </div>
        
        <button
          onClick={() => {
            setShowAuthModal(false);
            setAuthError('');
            setPassword('');
          }}
          className="mt-4 w-full text-red-600 hover:text-red-800 font-semibold py-2"
        >
          Batal
        </button>
      </div>
    </div>
  );

  // ERROR SCREEN
  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg border border-red-500/50 p-8 rounded-2xl text-center max-w-lg">
          <div className="text-6xl mb-4">🚨</div>
          <div className="text-2xl font-bold text-red-400 mb-2">Oops! Ada Masalah</div>
          <div className="text-gray-300 mb-4">{error}</div>
        </div>
      </div>
    );
  }

  // DETAIL VIEW
  if (selectedShip) {
    return (
      <div className="min-h-screen bg-blue-950 p-3 flex flex-col items-center justify-center relative overflow-hidden">
        {showAuthModal && <AuthModal />}
        
        <div className="w-full max-w-full relative z-10">
          {/* Top Navigation */}
          <div className="flex justify-between items-center mb-3">
            <div className="flex gap-2 flex-wrap">
              <button 
                onClick={handleBack}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-full text-white font-semibold transition-all flex items-center gap-2"
              >
                ← 
              </button>
            </div>
            
            <div className="text-right">
              <div className="text-5xl font-black text-white">
                {formatTime(currentTime)}
              </div>
              <div className="text-white font-medium">{formatDate(currentTime)}</div>
            </div>
          </div>

          {/* Main Card */}
          <div className="rounded-[2.5rem] overflow-hidden">
            
            {/* HEADER */}
            <div className="bg-black p-6 px-8 flex justify-between items-center min-h-[140px]">
              
              {/* Logo Operator */}
              <div className="h-28 w-40 rounded-xl shadow-sm border border-blue-200 flex items-center justify-center overflow-hidden p-2 bg-white">
                <span className="text-xs text-center font-bold text-gray-400">LOGO<br/>OPERATOR</span>
              </div>

              {/* Nama Operator */}
              <div className="flex-1 px-4 text-center">
                <div className="text-white text-sm font-bold tracking-[0.3em] uppercase mb-2">OPERATED BY</div>
                  <div className="text-blue-300 font-black text-2xl md:text-5xl tracking-tight leading-none">
                    {selectedShip.NM_OPERATOR}
                  </div>
              </div>

              {/* Logo Pelindo */}
              <div className="h-28 w-40 flex items-center justify-center rounded-xl">
                <img src="/assets/logo_pelindo.png" alt="Pelindo" className="h-20 object-contain" onError={(e) => e.target.style.display='none'} />
              </div>
            </div>

            {/* BODY */}
            <div className="p-20 text-center bg-blue-900 relative">
              <h3 className="text-slate-200 text-3xl font-bold tracking-[0.3em] uppercase mb-4">Tujuan</h3>
              
              <div className="w-full overflow-hidden mb-6 py-2">
                <div className="text-7xl md:text-8xl font-black text-purple-200 mb-6 leading-tight py-2">
                {selectedShip.NM_PORT_NEXT}
                </div>
              </div>
              
              <div className="inline-flex items-center gap-3 bg-blue-50 px-8 py-3 rounded-full border border-blue-100">
                <span className="text-3xl">🚢</span>
                <span className="text-2xl md:text-3xl font-bold text-slate-700">{selectedShip.NAMA_KAPAL}</span>
              </div>
            </div>

            {/* FOOTER */}
            <div className={`py-5 text-center transition-all duration-300 bg-amber-300`}>
              <h2 className={`text-6xl font-black uppercase tracking-tight text-blue-900`}>
                {showOpenGate ? 'SILAKAN MASUK' : 'OPEN CHECK-IN'}
              </h2>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // LIST VIEW
  return (
    <div className="min-h-screen bg-blue-950 font-sans text-slate-800">
      {showAuthModal && <AuthModal />}
      
      {/* Header */}
      <div className="bg-blue-950 text-white">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight drop-shadow-md">
              JADWAL KEBERANGKATAN KAPAL
            </h1>
            <p className="text-blue-100 mt-1 font-medium opacity-90">PORT DEPARTURE INFORMATION - PELINDO TANJUNG PERAK</p>
          </div>
          
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <div className="px-6 py-3 rounded-2xl text-right border border-white">
              <div className="text-4xl font-bold tracking-widest">{formatTime(currentTime)}</div>
              <div className="text-sm font-medium text-white uppercase">{formatDate(currentTime)}</div>
            </div>
          </div>
        </div>
        <div className="absolute top-1/14 right-6 -translate-y-1/2">
        {!isAuthenticated ? (
          <button
            onClick={() => setShowAuthModal(true)}
            className="px-4 py-3 bg-white text-black font-bold rounded-xl hover:text-blue-900"
          >
            🔐 Login
          </button>
          ) : (
          <div className="flex items-center gap-2">
            <div className="px-4 py-2 bg-green-500 text-white rounded-lg font-semibold">
              👤 {username}
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600"
            >
              🚪 Logout
            </button>
          </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 md:p-10">
        {/* Status Bar */}
        <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-xl shadow-sm border border-blue-100">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-gray-500 font-medium">Live System Updates</span>
          </div>
          <div className="font-bold text-black bg-blue-100 px-4 py-1 rounded-lg">
            {schedules.length} Kapal Tersedia
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-3xl p-20 text-center">
            <div className="text-4xl mb-4">⏳</div>
            <div className="text-xl font-semibold">Memuat data...</div>
          </div>
        ) : schedules.length === 0 ? (
          <div className="bg-white rounded-3xl p-20 text-center shadow-xl border border-blue-50 flex flex-col items-center">
            <div className="bg-blue-50 p-6 rounded-full mb-6">
              <span className="text-6xl">🌊</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-700">Tidak Ada Jadwal</h2>
            <p className="text-slate-400">Saat ini belum ada kapal yang membuka check-in.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5">
            {schedules.map((schedule, index) => (
              <div
                key={schedule.VOYAGE_NO || index}
                onClick={() => handleShipClick(schedule)}
                className="group relative bg-white rounded-2xl p-1 overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-xl"
              >
                <div className="absolute inset-0 bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className="relative bg-white rounded-xl p-6 h-full flex flex-col md:flex-row items-center gap-6">
                  
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-md">
                        {schedule.NM_OPERATOR}
                      </div>
                      {schedule.hasCustomData && (
                        <div className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
                          ✏️ Custom
                        </div>
                      )}
                    </div>
                    <div className="text-3xl font-black text-black mb-2 group-hover:text-blue-600 transition-all">
                      {schedule.NAMA_KAPAL}
                    </div>
                    <div className="flex gap-4 text-sm font-medium text-slate-500">
                      <div className="flex items-center gap-1">
                        <span className="text-blue-400">⬇</span> Tiba: {schedule.ETA || '-'}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-green-600">⬆</span> Berangkat: {schedule.ETD || '-'}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end min-w-[220px]">
                    <div className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">Tujuan</div>
                    <div className="text-3xl font-extrabold text-green-600 mb-3">
                      {schedule.NM_PORT_NEXT}
                    </div>
                    
                    <div className="bg-blue-500 text-white font-bold py-2 px-6 rounded-lg flex items-center gap-2 group-hover:bg-blue-600 transition-colors">
                      <span className="animate-pulse">●</span> CEK DETAIL
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShipScheduleDisplay;