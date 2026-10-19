'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

export interface LiveCameraWatermarkCaptureProps {
  personilNama: string;
  personilPangkat?: string;
  personilNrp?: string;
  lokasiPersonil?: string; // Lokasi terkini personel
  alamatTkp?: string; // fallback / backwards compatibility
  gpsLat?: number;
  gpsLng?: number;
  onPhotoCaptured: (dataUrl: string) => void;
  onCancel?: () => void;
  label?: string;
  required?: boolean;
}

export default function LiveCameraWatermarkCapture({
  personilNama,
  personilPangkat = 'Bripka',
  personilNrp = '-',
  lokasiPersonil,
  alamatTkp = 'Kawasan Hukum Presisi',
  gpsLat = 0,
  gpsLng = 0,
  onPhotoCaptured,
  onCancel,
  label = 'Dokumentasi Visual Autentik di TKP',
  required = true,
}: LiveCameraWatermarkCaptureProps) {
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isVideoReady, setIsVideoReady] = useState<boolean>(false);

  // Lokasi & Koordinat Terkini Personil (Bukan Alamat Pengaduan Pelapor)
  const [liveGps, setLiveGps] = useState<{ lat: number; lng: number }>({
    lat: gpsLat || 0,
    lng: gpsLng || 0,
  });
  const [liveAddress, setLiveAddress] = useState<string>(
    lokasiPersonil || (alamatTkp && !alamatTkp.includes('TKP') ? alamatTkp : '') || ''
  );
  const [isResolvingAddress, setIsResolvingAddress] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Reverse Geocoding untuk mendapatkan nama jalan/kelurahan/kota riil personil
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    if (!lat || !lng || (lat === 0 && lng === 0)) return;
    try {
      setIsResolvingAddress(true);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'id' } }
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.display_name) {
          const a = data.address || {};
          const road = a.road || a.pedestrian || a.street || '';
          const suburb = a.suburb || a.village || a.neighbourhood || '';
          const city = a.city || a.town || a.county || a.city_district || '';
          const state = a.state || '';
          const parts = [road, suburb, city, state].filter(Boolean);
          const formatted = parts.length > 0 ? parts.join(', ') : data.display_name;
          if (formatted) {
            setLiveAddress(formatted);
          }
        }
      }
    } catch (err) {
      console.warn('Reverse geocode error:', err);
    } finally {
      setIsResolvingAddress(false);
    }
  }, []);

  // Ambil lokasi GPS terkini dari perangkat personil
  const acquireCurrentLocation = useCallback(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = Number(pos.coords.latitude.toFixed(6));
          const lng = Number(pos.coords.longitude.toFixed(6));
          setLiveGps({ lat, lng });
          reverseGeocode(lat, lng);
        },
        (err) => {
          console.warn('Gagal membaca GPS perangkat:', err);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }, [reverseGeocode]);

  // Sinkronisasi koordinat & lokasi awal dari props
  useEffect(() => {
    if (gpsLat && gpsLng && (gpsLat !== 0 || gpsLng !== 0)) {
      setLiveGps({ lat: gpsLat, lng: gpsLng });
      if (!liveAddress && !lokasiPersonil) {
        reverseGeocode(gpsLat, gpsLng);
      }
    }
  }, [gpsLat, gpsLng, reverseGeocode, liveAddress, lokasiPersonil]);

  useEffect(() => {
    if (lokasiPersonil) {
      setLiveAddress(lokasiPersonil);
    }
  }, [lokasiPersonil]);

  // Matikan stream saat unmount atau berhenti
  const stopCameraStream = useCallback(() => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch (_) {}
        });
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    } catch (e) {
      console.warn('stopCameraStream error:', e);
    } finally {
      setIsCameraActive(false);
      setIsVideoReady(false);
      if (onCancel) onCancel();
    }
  }, [onCancel]);

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, [stopCameraStream]);

  // Callback ref untuk elemen video agar stream langsung terhubung tanpa delay
  const setVideoNode = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node;
    if (node && streamRef.current) {
      try {
        node.muted = true;
        node.defaultMuted = true;
        node.playsInline = true;
        if (node.srcObject !== streamRef.current) {
          node.srcObject = streamRef.current;
        }
        node
          .play()
          .then(() => setIsVideoReady(true))
          .catch((err) => {
            console.warn('Autoplay callback error, retrying muted play:', err);
            node.muted = true;
            node.play().then(() => setIsVideoReady(true)).catch(console.warn);
          });
      } catch (err) {
        console.warn('setVideoNode error:', err);
      }
    }
  }, []);

  // Buka kamera stream (WebRTC getUserMedia MURNI - DILARANG DARI GALERI)
  const startCamera = async (targetFacing?: 'environment' | 'user') => {
    setCameraError(null);
    setIsProcessing(true);
    setIsVideoReady(false);
    const mode = targetFacing || facingMode;

    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error('Perangkat atau browser tidak mendukung akses langsung kamera (WebRTC).');
      }

      // Hentikan stream aktif terlebih dahulu jika ada
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => {
          try { t.stop(); } catch (_) {}
        });
        streamRef.current = null;
      }

      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch (errEnvironment) {
        console.warn('Kamera mode ideal tidak tersedia, mencoba kamera default:', errEnvironment);
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;

      // Update state kamera aktif
      setIsCameraActive(true);

      // Pasang langsung ke elemen video jika sudah ter-mount
      if (videoRef.current) {
        videoRef.current.muted = true;
        videoRef.current.defaultMuted = true;
        videoRef.current.playsInline = true;
        videoRef.current.srcObject = stream;
        videoRef.current
          .play()
          .then(() => setIsVideoReady(true))
          .catch((err) => console.warn('Video play immediate error:', err));
      }

      // Ambil GPS dan lokasi terkini personil secara real-time
      acquireCurrentLocation();
    } catch (err: any) {
      console.warn('Live camera stream error:', err);
      setCameraError(
        err.message || 'Izin kamera belum diberikan. Mohon periksa izin browser untuk mengakses kamera langsung.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Toggle beralih antara kamera Depan & Belakang
  const toggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Fungsi Stamping Watermark Otomatis ke Canvas
  const stampWatermarkOnCanvas = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    // 1. Overlay strip gelap di bagian bawah
    const bannerHeight = Math.max(90, Math.round(height * 0.22));
    const gradient = ctx.createLinearGradient(0, height - bannerHeight, 0, height);
    gradient.addColorStop(0, 'rgba(15, 23, 42, 0.88)');
    gradient.addColorStop(1, 'rgba(15, 23, 42, 0.98)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, height - bannerHeight, width, bannerHeight);

    // Garis aksen emas di atas banner
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(0, height - bannerHeight, width, 3);

    // 2. Format Waktu Indonesia Barat
    const nowStr =
      new Date().toLocaleString('id-ID', {
        timeZone: 'Asia/Jakarta',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }) + ' WIB';

    // 3. Tulis teks watermark
    const fontSize = Math.max(12, Math.round(width * 0.024));
    const startX = 20;
    let currentY = height - bannerHeight + fontSize + 8;

    // Header Tag
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.fillStyle = '#FBBF24';
    ctx.fillText('🛡️ POLRI PRESISI 110 • DOKUMENTASI VISUAL RESMI PENANGANAN', startX, currentY);

    // Baris 1: Identitas Personel
    currentY += fontSize + 6;
    ctx.font = `bold ${Math.max(11, fontSize - 2)}px sans-serif`;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`👮 PETUGAS: ${personilPangkat} ${personilNama} (NRP: ${personilNrp})`, startX, currentY);

    // Baris 2: Lokasi Terkini Personil (Alamat Riil Personil)
    currentY += fontSize + 5;
    ctx.font = `normal ${Math.max(10, fontSize - 3)}px sans-serif`;
    ctx.fillStyle = '#E2E8F0';
    const displayAddress =
      liveAddress || lokasiPersonil || 'Lokasi Terkini Personel (Satelit Presisi)';
    const cleanAlamat =
      displayAddress.length > 70 ? displayAddress.substring(0, 67) + '...' : displayAddress;
    ctx.fillText(`📍 LOKASI PERSONEL: ${cleanAlamat}`, startX, currentY);

    // Baris 3: Koordinat GPS Terkini Personel & Timestamp
    currentY += fontSize + 5;
    ctx.font = `bold ${Math.max(10, fontSize - 3)}px monospace`;
    ctx.fillStyle = '#38BDF8';
    const finalLat = liveGps.lat || gpsLat || 0;
    const finalLng = liveGps.lng || gpsLng || 0;
    const latStr = finalLat ? finalLat.toFixed(6) : '0.000000';
    const lngStr = finalLng ? finalLng.toFixed(6) : '0.000000';
    ctx.fillText(`🌐 GPS PERSONEL: Lat ${latStr}, Lng ${lngStr} • ⏱️ ${nowStr}`, startX, currentY);
  };

  // Ambil snapshot dari video element (Live Sensor Kamera Saja)
  const takeSnapshot = () => {
    try {
      const video = videoRef.current;
      if (!video) {
        alert('Lensa kamera belum siap. Silakan klik tombol Batalkan lalu buka kembali.');
        return;
      }

      // Pastikan video jalan jika paused
      if (video.paused) {
        video.muted = true;
        video.play().catch(console.warn);
      }

      const width = video.videoWidth > 0 ? video.videoWidth : 1280;
      const height = video.videoHeight > 0 ? video.videoHeight : 720;

      const canvas = canvasRef.current || document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Render frame video asli dari kamera
      try {
        ctx.drawImage(video, 0, 0, width, height);
      } catch (drawErr) {
        console.warn('Gagal menggambar frame video:', drawErr);
      }

      // Sematkan watermark lokasi & koordinat terkini personel
      stampWatermarkOnCanvas(ctx, width, height);

      const watermarkedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
      setCapturedImage(watermarkedDataUrl);
      stopCameraStream();
      onPhotoCaptured(watermarkedDataUrl);
    } catch (err) {
      console.error('Error saat mengambil snapshot:', err);
      alert('Terjadi kendala saat mengambil foto. Silakan coba kembali.');
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1.5px solid #CBD5E1',
        borderRadius: '10px',
        padding: '14px',
        margin: '10px 0',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontWeight: 800, fontSize: '13px', color: '#153E75', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>📷</span> {label} {required && <span style={{ color: '#DC2626' }}>*</span>}
        </span>
        <span
          style={{
            fontSize: '10.5px',
            background: '#FEF3C7',
            color: '#92400E',
            fontWeight: 800,
            padding: '2px 8px',
            borderRadius: '6px',
            border: '1px solid #FDE68A',
          }}
        >
          🔒 Kamera Langsung • Anti-Galeri
        </span>
      </div>

      <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '12px', lineHeight: 1.4 }}>
        Wajib mengambil foto langsung dari lensa kamera aktif (Anti-Galeri). Sistem secara otomatis menyematkan watermark nama personel,{' '}
        <strong>lokasi terkini personel</strong>, dan <strong>koordinat satelit GPS riil</strong> secara permanen.
      </div>

      {/* Hidden Canvas untuk Watermarking */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* TAMPILAN 1: BELUM MENGAMBIL FOTO & KAMERA BELUM AKTIF */}
      {!isCameraActive && !capturedImage && (
        <div style={{ textAlign: 'center', padding: '16px', background: '#F8FAFC', border: '1.5px dashed #94A3B8', borderRadius: '8px' }}>
          <div style={{ fontSize: '32px', marginBottom: '6px' }}>📸</div>
          <div style={{ fontWeight: 700, fontSize: '12.5px', color: '#1E293B', marginBottom: '4px' }}>
            Kamera Belum Diaktifkan
          </div>
          <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '12px' }}>
            Tekan tombol di bawah untuk membuka lensa kamera dan membidik situasi secara langsung.
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button
              type="button"
              id="btn-buka-kamera-live"
              onClick={() => startCamera()}
              disabled={isProcessing}
              style={{
                padding: '10px 22px',
                background: 'linear-gradient(135deg, #153E75 0%, #1E40AF 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '12.5px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 6px rgba(21,62,117,0.3)',
              }}
            >
              <span>📷</span> {isProcessing ? 'Mengakses Kamera...' : 'Aktifkan Kamera Live'}
            </button>
          </div>
        </div>
      )}

      {/* TAMPILAN 2: STREAM KAMERA AKTIF (VIEWFINDER LIVE) */}
      {isCameraActive && !capturedImage && (
        <div>
          {/* KOTAK VIEWFINDER KAMERA (HANYA BERISI VIDEO & WATERMARK OVERLAY) */}
          <div
            style={{
              position: 'relative',
              borderRadius: '8px',
              overflow: 'hidden',
              background: '#0F172A',
              border: '2px solid #153E75',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            }}
          >
            {/* Elemen Video Viewfinder */}
            <video
              ref={setVideoNode}
              autoPlay
              playsInline
              muted
              onLoadedMetadata={(e) => {
                const vid = e.currentTarget;
                vid.muted = true;
                vid.play().then(() => setIsVideoReady(true)).catch(console.warn);
              }}
              onCanPlay={() => setIsVideoReady(true)}
              style={{
                width: '100%',
                minHeight: '260px',
                maxHeight: '360px',
                objectFit: 'cover',
                display: 'block',
                backgroundColor: '#000000',
              }}
            />

            {/* Header Bar Viewfinder */}
            <div
              style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                right: '10px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                zIndex: 4,
              }}
            >
              <div
                style={{
                  background: 'rgba(220, 38, 38, 0.92)',
                  color: 'white',
                  fontSize: '10px',
                  fontWeight: 800,
                  padding: '3px 8px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  pointerEvents: 'none',
                }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'white' }}></span>
                LIVE KAMERA PERSONEL
              </div>

              <button
                type="button"
                onClick={toggleFacingMode}
                title="Ganti Kamera Depan / Belakang"
                style={{
                  background: 'rgba(15, 23, 42, 0.85)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.35)',
                  padding: '5px 11px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  pointerEvents: 'auto',
                }}
              >
                <span>🔄</span> {facingMode === 'environment' ? 'Kamera Depan' : 'Kamera Belakang'}
              </button>
            </div>

            {/* Preview Teks Watermark di Layar Kamera (pointerEvents: none agar tidak memblokir apapun) */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'linear-gradient(transparent, rgba(15,23,42,0.92))',
                padding: '16px 14px 10px',
                color: 'white',
                fontSize: '10.5px',
                lineHeight: 1.4,
                zIndex: 3,
                pointerEvents: 'none',
              }}
            >
              <div style={{ color: '#FBBF24', fontWeight: 800 }}>
                👮 {personilPangkat} {personilNama} (NRP: {personilNrp})
              </div>
              <div style={{ color: '#E2E8F0', marginTop: '2px' }}>
                📍 {isResolvingAddress ? 'Mencari alamat satelit...' : liveAddress || lokasiPersonil || 'Lokasi Terkini Personel'}
              </div>
              <div style={{ color: '#38BDF8', fontFamily: 'monospace', marginTop: '2px' }}>
                🌐 Lat: {(liveGps.lat || gpsLat || 0).toFixed(6)}, Lng: {(liveGps.lng || gpsLng || 0).toFixed(6)}
              </div>
            </div>
          </div>

          {/* BAR TOMBOL KONTROL DI LUAR KOTAK VIEWFINDER (TERPISAH, BEBAS INTERFERENSI, 100% BISA DIKLIK) */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '12px',
              marginTop: '12px',
              padding: '6px 0',
              position: 'relative',
              zIndex: 10,
            }}
          >
            <button
              type="button"
              id="btn-batal-kamera"
              onClick={stopCameraStream}
              style={{
                padding: '10px 18px',
                background: '#475569',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
              }}
            >
              ✕ Batalkan
            </button>
            <button
              type="button"
              id="btn-bidik-foto"
              onClick={takeSnapshot}
              style={{
                padding: '11px 26px',
                background: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '30px',
                fontSize: '13px',
                fontWeight: 900,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(220, 38, 38, 0.45)',
              }}
            >
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'white' }}></span>
              BIDIK FOTO BUKTI
            </button>
          </div>
        </div>
      )}

      {/* TAMPILAN 3: FOTO BERHASIL DIAMBIL DENGAN WATERMARK */}
      {capturedImage && (
        <div>
          <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1.5px solid #10B981' }}>
            <img
              src={capturedImage}
              alt="Bukti Visual Berwatermark"
              style={{ width: '100%', maxHeight: '340px', objectFit: 'cover', display: 'block' }}
            />
            <div
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: '#059669',
                color: 'white',
                fontSize: '11px',
                fontWeight: 800,
                padding: '4px 10px',
                borderRadius: '6px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              }}
            >
              ✓ Terverifikasi Watermark Lokasi Personel
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
            <span style={{ fontSize: '11px', color: '#059669', fontWeight: 700 }}>
              ✓ Bukti visual tersimpan dengan watermark lokasi terkini personel.
            </span>
            <button
              type="button"
              id="btn-ambil-ulang-foto"
              onClick={handleRetake}
              style={{
                padding: '6px 12px',
                background: '#F1F5F9',
                color: '#153E75',
                border: '1px solid #CBD5E1',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              🔄 Ambil Ulang Foto
            </button>
          </div>
        </div>
      )}

      {cameraError && (
        <div
          style={{
            marginTop: '8px',
            padding: '8px 12px',
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: '6px',
            color: '#DC2626',
            fontSize: '11px',
          }}
        >
          ℹ️ {cameraError}
        </div>
      )}
    </div>
  );
}
