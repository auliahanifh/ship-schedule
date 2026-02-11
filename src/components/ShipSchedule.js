'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession, signIn, signOut } from "next-auth/react";

const ShipScheduleDisplay = () => {
  const { data: session, status } = useSession();
  const [schedules, setSchedules] = useState([]);
  const [selectedShip, setSelectedShip] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showOpenGate, setShowOpenGate] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); 
  
  const [username, setUsername] = useState(''); 
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');  

  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    operatorName: '',
    shipName: '',
    idLoket: '',
    logoFile: null
  });

  const [logoPreview, setLogoPreview] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const response = await fetch('/api/'); // 
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        
        setSchedules(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchSchedules();
    const interval = setInterval(fetchSchedules, 120000);
    return () => clearInterval(interval);
  }, []);

  // Time Updates
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const blink = setInterval(() => setShowOpenGate(prev => !prev), 1000);
    return () => {
      clearInterval(timer);
      clearInterval(blink);
    };
  }, []);

  const formatTime = (date) => date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const formatDate = (date) => date.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    
    if (authMode === 'register') {
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });
          const data = await res.json();
        if (res.ok) {
          alert('Akun berhasil dibuat! Silakan login.');
          setAuthMode('login');
        } else {
          setAuthError(data.message || 'Gagal registrasi');
        }
      } catch (err) {
        setAuthError('Terjadi kesalahan koneksi');
      }

    } else {
      // Logic Login (NextAuth)
      const result = await signIn("credentials", {
        redirect: false, username, password
      });

      if (result?.error) {
        setAuthError("Username atau kata sandi salah!");
      } else {
        // Berhasil login
        setShowAuthModal(false);
        setPassword('');
        setUsername('');
      }
    }
  };

  const handleShipClick = (ship) => {
    setSelectedShip(ship);
  };

  const handleBack = () => {
    setSelectedShip(null);
  };

  const handleLogout = () => {
    signOut({ redirect: false }); 
  };

  const handleEditClick = () => {
    if (!selectedShip) return;
    setEditFormData({
      operatorName: selectedShip.NM_OPERATOR || '',
      shipName: selectedShip.NAMA_KAPAL || '',
      idLoket: selectedShip.id_loket || '',
      logoFile: null
    });
    setLogoPreview(selectedShip.LOGO_OPERATOR || null);
    setShowEditModal(true);
  };

  const handleDownloadShortcut = () => {
    if (!editFormData.idLoket){
      alert("Pilih nomor loket terlebih dahulu!");
      return;
    }
    
    // URL Backend Redirector
    const baseUrl = window.location.origin;
    const dynamicUrl = `${baseUrl}/api/loket/${editFormData.idLoket}`;

    const fileContent = `[InternetShortcut]
    URL=${dynamicUrl}
    IconIndex=0
    IconFile=${baseUrl}/favicon.ico`;

  const blob = new Blob([fileContent], { type: 'text/plain' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `LOKET ${editFormData.idLoket}.url`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Ukuran file terlalu besar (Maks 2MB)");
        return;
      }
      setEditFormData(prev => ({ ...prev, logoFile: file }));
      const objectUrl = URL.createObjectURL(file);
      setLogoPreview(objectUrl);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
        const formData = new FormData();
        formData.append('id_kapal', selectedShip.VOYAGE_NO); 
        formData.append('operator', editFormData.operatorName);
        formData.append('kapal', editFormData.shipName);
        if (editFormData.logoFile) {
             formData.append('logo', editFormData.logoFile);
        }
        formData.append('id_loket', editFormData.idLoket);
        const response = await fetch('/api/update', { method: 'POST', body: formData });
        const data = await response.json();
    } catch(err){
      console.error("An error occurred:", err.message);
    }
    const updatedShipData = {
      ...selectedShip,
      NM_OPERATOR: editFormData.operatorName,
      NAMA_KAPAL: editFormData.shipName,
      id_loket: editFormData.idLoket,
      LOGO_OPERATOR: logoPreview 
    };
    setSelectedShip(updatedShipData);
    setSchedules(prevSchedules => 
      prevSchedules.map(ship => 
        (ship.VOYAGE_NO === selectedShip.VOYAGE_NO) ? updatedShipData : ship
      )
    );
    setShowEditModal(false);
    setLogoPreview(null);
    if(fileInputRef.current) fileInputRef.current.value = "";
    };

  if (error) return <div className="text-white bg-red-900 p-10 text-center">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-blue-950 font-sans text-slate-800 relative">
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">🔐</div>
              <h2 className="text-3xl font-bold">
                {authMode === 'login' ? 'Login' : 'Tambah Akun'}
              </h2>
            </div>
            
            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2 text-gray-700">Username</label>
                <input
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 text-black"
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
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 text-black"
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
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors shadow-lg hover:shadow-xl"
              >
                {status === 'loading' ? 'Memproses...' : (authMode === 'login' ? 'Masuk' : 'Daftar')}
              </button>
            </form>
            
            <div className="mt-4 text-center">
              <button
                type="button" 
                onClick={() => {
                  setAuthMode(authMode === 'login' ? 'register' : 'login');
                  setAuthError('');
                }}
                className="w-full h-11 text-blue-600 border-2 border-blue-600 rounded-lg hover:text-blue-800 font-semibold hover:underline"
              >
                {authMode === 'login' ? 'Buat Akun' : 'Sudah punya akun?'}
              </button>
            </div>
            
            <button
              type="button"
              onClick={() => {
                setShowAuthModal(false);
                setAuthError('');
              }}
              className="mt-4 w-full text-red-600 border-2 border-red-500 rounded-lg hover:text-red-800 font-semibold py-2"
            >Batal
            </button>
          </div>
        </div>
      )}

      {showEditModal && selectedShip && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-start pt-10 justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl relative">
            <div className="text-center mb-6">
               <h2 className="text-2xl font-bold text-black">Edit Data</h2>
               <p className="text-gray-500 text-sm">VOYAGE_NO: {selectedShip.VOYAGE_NO}</p>
            </div>
            <form onSubmit={handleSaveEdit} className="space-y-5">
            {/* Upload Logo */}
            <div>
              <label className="block text-sm font-bold mb-2 text-gray-700">Upload Logo Operator</label>
                <div className="flex items-center gap-4">
                  {/* Preview Gambar */}
                  <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center overflow-hidden bg-gray-50 relative">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Preview" className="w-full h-full object-contain p-1" />
                    ) : (
                      <span className="text-gray-400 text-xs">No Logo</span>
                    )}
                  </div>
                  {/* Input File */}
                  <div className="flex-1">
                    <input 
                      type="file" 
                      accept="image/png, image/jpeg, image/jpg, image/webp"
                      onChange={handleLogoChange}
                      ref={fileInputRef}
                      className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <p className="mt-1 text-xs text-gray-500">PNG, JPG, JPEG, webp (Max. 2MB)</p>
                  </div>
                </div>
              </div>
              {/* Edit Nama Operator */}
              <div>
                <label className="block text-sm font-bold mb-2 text-gray-700">Nama Operator</label>
                <input
                  type="text"
                  name="operatorName"
                  value={editFormData.operatorName}
                  onChange={handleEditFormChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 text-black font-semibold"
                  required
                />
              </div>
              {/* Edit Nama Kapal */}
              <div>
                <label className="block text-sm font-bold mb-2 text-gray-700">Nama Kapal</label>
                <input
                  type="text"
                  name="shipName"
                  value={editFormData.shipName}
                  onChange={handleEditFormChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 text-black font-semibold"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2 text-gray-700">Pilih loket</label>
                <select
                  name="idLoket"
                  value={editFormData.idLoket}
                  onChange={handleEditFormChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 text-black font-semibold">
                <option value="">Pilih Nomor Loket</option>
                {[...Array(20)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}
                    </option>))}
                </select>
                <p className="text-xs text-gray-700">
                  Jadwal ini akan tampil di <b>Loket {editFormData.idLoket || '...'}</b>.
                </p>
              </div>
              <div className="flex gap-3 pt-0.4 mb-2">
                <button type="button" onClick= {handleDownloadShortcut} className="flex-1 py-3 border-2 border bg-black text-white font-semibold rounded-xl hover:bg-gray-600 transition-colors">
                  Download shortcut
                </button>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => {setShowEditModal(false); setLogoPreview(null);}} className="flex-1 py-3 border-2 border-red-500 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-colors">
                  Batal
                </button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-md">
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- DETAIL VIEW --- */}
      {selectedShip ? (
        <div className="min-h-screen bg-blue-950 p-3 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="w-full max-w-full relative z-10">
            <div className="flex justify-between items-center mb-3">
              <button 
                onClick={() => setSelectedShip(null)}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-full text-white font-semibold transition-all flex items-center gap-2"
              >
                ← 
              </button>

              <div className="text-right hidden md:block">
                <div className="text-7xl font-black text-white">{formatTime(currentTime)}</div>
                <div className="text-3xl text-white font-medium uppercase">{formatDate(currentTime)}</div>
              </div>  

              {session && (
                 <button onClick={handleEditClick} 
                 className="px-6 py-3 bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-bold rounded-full shadow-lg flex items-center gap-2"
               >
                 Edit Jadwal
               </button>
              )}
            </div>

            <div className="rounded-[2.5rem] overflow-hidden">
              <div className="bg-black p-6 px-8 flex justify-between items-center min-h-[140px]">
                <div className="h-28 w-40 rounded-xl flex items-center justify-center overflow-hidden p-2 relative">
                  {selectedShip.LOGO_OPERATOR ? (
                    <img src={selectedShip.LOGO_OPERATOR} alt="Logo Operator" className="w-full h-full rounded-lg"/>
                  ) : (
                    <span className="text-xs font-bold text-white">LOGO OPERATOR</span>
                  )}
                </div>
                <div className="flex-1 px-4 text-center">
                  <div className="text-white text-sm font-bold tracking-[0.3em] uppercase mb-2">OPERATED BY</div>
                    <div className="text-blue-300 font-black text-2xl md:text-6xl tracking-tight leading-none break-words">
                      {selectedShip.NM_OPERATOR}
                    </div>
                </div>
                <div className="h-28 w-40 flex items-center justify-center rounded-xl">
                <img src="/assets/logo_pelindo.png" alt="Pelindo" className="h-28 object-contain" onError={(e) => e.target.style.display='none'} />
              </div>
            </div>

              <div className="p-20 text-center bg-blue-900 relative">
                <div className="inline-flex items-center gap-3 px-8 py-3 rounded-4xl mb-10">
                  <span className="text-7xl">🚢</span>
                  <span className="text-9xl md:text-[10rem] font-bold text-blue-50">{selectedShip.NAMA_KAPAL}</span>
                </div>
                <h3 className="text-green-300 text-2xl font-bold tracking-[0.3em] uppercase">Tujuan</h3>
                <div className="w-full overflow-hidden mb-6 py-2">
                  <div className="text-7xl md:text-9xl font-black text-purple-300">
                  {selectedShip.NM_PORT_NEXT}
                  </div>
                </div>
              </div>

              <div className={`py-5 text-center transition-all duration-300 bg-amber-300`}>
                <h2 className={`text-6xl font-black uppercase tracking-tight text-blue-900`}>
                  {showOpenGate ? 'SIAPKAN TIKET DAN IDENTITAS' : 'OPEN BOARDING'}
                </h2>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // --- LIST VIEW ---
        <>
          <div className="bg-blue-950 text-white">
            <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <h1 className="text-4xl font-extrabold tracking-tight drop-shadow-md">
                  JADWAL KEBERANGKATAN KAPAL
                </h1>
                <p className="text-blue-100 mt-1 font-medium opacity-90">PORT DEPARTURE INFORMATION - PELINDO TANJUNG PERAK</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="px-6 py-3 rounded-2xl text-right border border-white">
                  <div className="text-4xl font-bold tracking-widest">{formatTime(currentTime)}</div>
                  <div className="text-sm font-medium text-white uppercase">{formatDate(currentTime)}</div>
                </div>
              </div>
            </div>        
          </div>
          {/* TOMBOL LOGIN DI HEADER */}
                <div className="absolute top-1/25 right-6 -translate-y-1/2">
                {!session ? (
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="px-4 py-3 bg-white text-black font-bold rounded-xl hover:text-blue-900 shadow-lg"
                  >
                    🔐 Login
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="px-4 py-2 bg-white text-black rounded-lg font-normal text-m">
                      👤 {session.user.name || session.user.username || "Admin"}
                    </div>
                    <button
                      onClick={handleLogout}
                      className="px-4 py-2 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 text-m"
                    >
                      Logout
                    </button>
                  </div>
                )}
                </div>

          <div className="max-w-7xl mx-auto p-6 md:p-10">
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
            
            {!loading && schedules.length > 0 && (
              <div className="grid grid-cols-1 gap-5">
                {schedules.map((schedule, index) => (
                  <div key={schedule.VOYAGE_NO || index}
                    onClick={() => setSelectedShip(schedule)}
                    className="group relative bg-white rounded-2xl p-1 overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-xl">
                    <div className="absolute inset-0 bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                    <div className="relative bg-white rounded-xl p-6 h-full flex flex-col md:flex-row items-center gap-6">
                      <div className="flex-1 text-left">
                        <div className="text-3xl font-black text-black mb-2 group-hover:text-blue-600 transition-all">{schedule.NAMA_KAPAL}</div>
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
        </>
      )}
    </div>
  );
}
export default ShipScheduleDisplay;