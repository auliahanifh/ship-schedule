'use client';

import React, { useState, useEffect } from 'react';

const ShipScheduleDisplay = () => {
  const [schedules, setSchedules] = useState([]);
  const [selectedShip, setSelectedShip] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showOpenGate, setShowOpenGate] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data from API
  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const response = await fetch('/api/schedules');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Total data dari API:', data.length);
        console.log('Data:', data);
        
        setSchedules(data);
        setLoading(false);
        setError(null);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    fetchSchedules();
    // Refresh data every 2 minutes
    const interval = setInterval(fetchSchedules, 120000);
    return () => clearInterval(interval);
  }, []);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Blinking animation
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setShowOpenGate(prev => !prev);
    }, 500);
    return () => clearInterval(blinkInterval);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: false 
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('id-ID', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
  };

  const handleShipClick = (ship) => {
    setSelectedShip(ship);
  };

  const handleBack = () => {
    setSelectedShip(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-3xl font-semibold text-white">Memuat data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-3xl font-semibold text-red-500 mb-4">Error: {error}</div>
          <div className="text-gray-400">Pastikan API route sudah dibuat di app/api/schedules/route.js</div>
        </div>
      </div>
    );
  }

  // DETAIL VIEW
  if (selectedShip) {
    return (
      <div className="min-h-screen bg-blue-100 p-5">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <button
            onClick={handleBack}
            className="mb-6 px-6 py-3 bg-blue-400 hover:bg-blue-500 text-black text-xl rounded-lg flex items-center gap-2 transition-colors"
          ><span>←</span></button>

          {/* Main Display Card */}
          <div className="bg-blue p-3">
            {/* Header Section */}
            <div className="grid grid-cols-12 gap-4 mb-6">
              {/* Logo NM_Operator */}
              <div className="col-span-2 border-2 border-gray-700 h-32 flex items-center justify-center bg-gray-50">
                <span className="text-xs text-center px-2">NM_Operator</span>
              </div>
              {/* Nama Operator */}
              <div className="col-span-8 h-32 flex items-center justify-center bg-blue-300">
                <span className="text-3xl font-bold text-center px-4">{selectedShip.NM_OPERATOR}</span>
              </div>
              {/* Logo Pelindo */}
              <div className="col-span-2 h-32 flex items-center justify-center bg-white-50">
                <img src="assets/logo_pelindo.png" alt="Pelindo Logo" className="h-16" />
              </div>
            </div>

            {/* Port Next Section */}
            <div className="h-64 flex items-center justify-center bg-green-100 mb-6">
              <div className="text-center">
                <div className="text-5xl font-bold mb-2">{selectedShip.NM_PORT_NEXT}</div>
                <div className="text-2xl text-gray-600">{selectedShip.NAMA_KAPAL}</div>
              </div>
            </div>

            {/* Status Section */}
            <div className="h-32 flex items-center justify-center bg-yellow-100">
              <div className="text-center">
                <div className="text-4xl font-bold">
                  <span style={{ visibility: showOpenGate ? 'visible' : 'hidden' }} className="text-green-600">
                    OPEN CHECK-IN
                  </span>
                </div>
                <div className="text-2xl mt-2">
                  {formatDate(currentTime)} - {formatTime(currentTime)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // LIST VIEW
  return (
    <div className="min-h-screen bg-blue-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white p-8 mb-8">
          <h1 className="text-5xl font-bold text-center mb-4">JADWAL KEBERANGKATAN KAPAL</h1>
          <div className="text-center text-2xl text-gray-600">
            {formatDate(currentTime)} - {formatTime(currentTime)}
          </div>
          <div className="text-center text-xl text-blue-600 font-semibold mt-4">
            Total: {schedules.length} Kapal dengan Check-in Terbuka
          </div>
        </div>

        {schedules.length === 0 ? (
          <div className="bg-white p-12">
            <div className="text-center text-2xl text-gray-600">
              Tidak ada jadwal kapal yang tersedia saat ini
            </div>
          </div>
        ) : (
          /* List of Ships */
          <div className="space-y-4">
            {schedules.map((schedule, index) => (
              <div
                key={schedule.VOYAGE_NO || index}
                onClick={() => handleShipClick(schedule)}
                className="bg-white p-7 cursor-pointer hover:bg-blue-50 hover:border-blue-600 transition-all transform hover:scale-[1.02]"
              >
                <div className="grid grid-cols-2 gap-6 items-center">
                  {/* Info Kapal */}
                  <div className="col-span-6">
                    <div className="text-3xl font-bold text-gray-800 mb-2">{schedule.NAMA_KAPAL}</div>
                    <div className="text-xl text-gray-600">{schedule.NM_OPERATOR}</div>
                  </div>

                  {/* Tujuan */}
                  <div className="col-span-4">
                    <div className="text-sm text-gray-500 mb-1">Tujuan:</div>
                    <div className="text-2xl font-bold text-green-700">{schedule.NM_PORT_NEXT}</div>
                    <div className="text-sm text-gray-600 mt-2">
                      <div>Waktu Tiba: {schedule.ETA || '-'}</div>
                      <div>Waktu Berangkat: {schedule.ETD || '-'}</div>
                    </div>
                  </div>

                  {/* Status & Arrow */}
                  <div className="col-span-1 text-center">
                    <div className="bg-green-500 text-white px-3 py-2 rounded-lg text-sm font-bold mb-2">
                      OPEN CHECK-IN
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