'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

export interface LiveCameraWatermarkCaptureProps {
  personilNama: string;
  personilPangkat?: string;
  personilNrp?: string;
  lokasiPersonil?: string; // Lokasi terkini personel
  alamatTkp?: string; // fallback / backwards compatibility
  tkpLat?: number;
  tkpLng?: number;
  tkpAlamat?: string;
  isSimulationMode?: boolean;
  gpsLat?: number;
  gpsLng?: number;
  onPhotoCaptured: (
    dataUrl: string,
    metadata?: {
      lat: number;
      lng: number;
      address: string;
      distanceMeters: number;
      isDiscrepancy: boolean;
      warningMessage?: string;
    }
  ) => void;
  onCancel?: () => void;
  label?: string;
  required?: boolean;
}

function computeHaversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371e3;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dp / 2) * Math.sin(dp / 2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function LiveCameraWatermarkCapture({
  personilNama,
  personilPangkat = 'Bripka',
  personilNrp = '-',
  lokasiPersonil,
  alamatTkp = 'Kawasan Hukum Presisi',
  tkpLat,
  tkpLng,
  tkpAlamat,
  isSimulationMode = false,
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

  // Mode simulasi koordinat TKP (opsi beralih simulasi sukses vs anomali)
  const [useSimulatedCoords, setUseSimulatedCoords] = useState<boolean>(false);
  const [lastPhotoMetadata, setLastPhotoMetadata] = useState<{
    lat: number;
    lng: number;
    address: string;
    distanceMeters: number;
    isDiscrepancy: boolean;
    warningMessage?: string;
  } | null>(null);

  // Lokasi & Koordinat Terkini Personil (Bukan Alamat Pengaduan Pelapor)
  const [liveGps, setLiveGps] = useState<{ lat: number; lng: number }>({
    lat: gpsLat || 0,
    lng: gpsLng || 0,
  });
  const [liveAddress, setLiveAddress] = useState<string>(
    lokasiPersonil || (alamatTkp && !alamatTkp.includes('TKP') ? alamatTkp : '') || ''
  );
  const [isResolvingAddress, setIsResolvingAddress] = useState<boolean>(false);

  const targetTkpLat = tkpLat ? Number(tkpLat) : 0;
  const targetTkpLng = tkpLng ? Number(tkpLng) : 0;
  const hasTkpTarget = targetTkpLat !== 0 && targetTkpLng !== 0;

  // Koordinat & alamat aktif yang akan distamp ke foto
  const activeLat = useSimulatedCoords && hasTkpTarget ? targetTkpLat : (liveGps.lat || gpsLat || 0);
  const activeLng = useSimulatedCoords && hasTkpTarget ? targetTkpLng : (liveGps.lng || gpsLng || 0);
  const activeAddress = useSimulatedCoords && hasTkpTarget
    ? (tkpAlamat || 'Lokasi TKP Insiden Presisi 110')
    : (liveAddress || lokasiPersonil || 'Lokasi Terkini Personel');

  // Hitung deviasi jarak terhadap TKP
  const distanceMeters = hasTkpTarget
    ? computeHaversineMeters(activeLat, activeLng, targetTkpLat, targetTkpLng)
    : 0;

  // Ambang batas toleransi radius penanganan TKP (100 meter)
  const isDiscrepancy = hasTkpTarget && distanceMeters > 100;
  const distStr = distanceMeters >= 1000
    ? `${(distanceMeters / 1000).toFixed(1)} km`
    : `${Math.round(distanceMeters)} meter`;

  const warningText = isDiscrepancy
    ? `⚠️ PERINGATAN KETIDAKSESUAIAN LOKASI: Foto terdeteksi diambil di ${activeAddress} (Jarak: ${distStr} dari TKP). Foto terindikasi di luar area kejadian!`
    : '';

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
      if (!useSimulatedCoords) {
        acquireCurrentLocation();
      }
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

  // Fungsi Stamping Watermark Otomatis ke Canvas (TERPATRI PERMANEN PADA PIKSEL FOTO)
  const stampWatermarkOnCanvas = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    // 1. Badge Verifikasi Satelit di Pojok Kanan Atas Foto
    const topBadgeWidth = Math.max(isDiscrepancy ? 280 : 220, Math.round(width * (isDiscrepancy ? 0.38 : 0.28)));
    const topBadgeHeight = Math.max(28, Math.round(height * 0.05));
    const topBadgeX = width - topBadgeWidth - 16;
    const topBadgeY = 16;

    ctx.save();
    if (isDiscrepancy) {
      ctx.fillStyle = 'rgba(220, 38, 38, 0.95)';
      ctx.fillRect(topBadgeX, topBadgeY, topBadgeWidth, topBadgeHeight);
      ctx.strokeStyle = '#FCA5A5';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(topBadgeX, topBadgeY, topBadgeWidth, topBadgeHeight);

      ctx.font = `bold ${Math.max(10, Math.round(topBadgeHeight * 0.44))}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`⚠️ ANOMALI: DILUAR TKP (${distStr})`, topBadgeX + topBadgeWidth / 2, topBadgeY + topBadgeHeight / 2);
    } else {
      ctx.fillStyle = 'rgba(5, 150, 105, 0.92)';
      ctx.fillRect(topBadgeX, topBadgeY, topBadgeWidth, topBadgeHeight);
      ctx.strokeStyle = '#34D399';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(topBadgeX, topBadgeY, topBadgeWidth, topBadgeHeight);

      ctx.font = `bold ${Math.max(10, Math.round(topBadgeHeight * 0.46))}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('✓ TERVERIFIKASI SATELIT PRESISI GPS', topBadgeX + topBadgeWidth / 2, topBadgeY + topBadgeHeight / 2);
    }
    ctx.restore();

    // 2. Banner Gelap di Bagian Bawah Foto
    const bannerHeight = Math.max(isDiscrepancy ? 135 : 115, Math.round(height * (isDiscrepancy ? 0.28 : 0.25)));
    const startY = height - bannerHeight;

    const gradient = ctx.createLinearGradient(0, startY, 0, height);
    gradient.addColorStop(0, 'rgba(15, 23, 42, 0.88)');
    gradient.addColorStop(0.35, 'rgba(15, 23, 42, 0.95)');
    gradient.addColorStop(1, 'rgba(15, 23, 42, 0.99)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, startY, width, bannerHeight);

    // Garis aksen di atas banner (Merah jika anomali, Emas jika normal)
    ctx.fillStyle = isDiscrepancy ? '#EF4444' : '#F59E0B';
    ctx.fillRect(0, startY, width, 4);

    // 3. Format Waktu Indonesia Barat
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

    // 4. Pengaturan Tipografi & Koordinat Teks
    const baseFontSize = Math.max(13, Math.round(width * 0.024));
    const paddingX = Math.max(18, Math.round(width * 0.025));
    let currentY = startY + Math.round(bannerHeight * 0.20);

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    // Baris 1: Header Dokumen Resmi
    ctx.font = `bold ${Math.round(baseFontSize * 1.05)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillStyle = isDiscrepancy ? '#FCA5A5' : '#FBBF24';
    ctx.fillText(
      isDiscrepancy
        ? '⚠️ POLRI PRESISI 110 • DOKUMENTASI TERINDIKASI DILUAR LOKASI TKP'
        : '🛡️ POLRI PRESISI 110 • DOKUMENTASI VISUAL LAPANGAN RESMI',
      paddingX,
      currentY
    );

    // Baris 2: Identitas Personel
    currentY += Math.round(baseFontSize * 1.30);
    ctx.font = `bold ${baseFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`👮 PETUGAS: ${personilPangkat} ${personilNama} (NRP: ${personilNrp})`, paddingX, currentY);

    // Baris 3: Lokasi Terkini Personil (Alamat Riil Personil)
    currentY += Math.round(baseFontSize * 1.25);
    ctx.font = `normal ${Math.max(11, Math.round(baseFontSize * 0.88))}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillStyle = '#E2E8F0';
    const displayAddress = activeAddress || 'Lokasi Terkini Personel (Satelit Presisi)';
    const maxChars = Math.max(45, Math.round(width / (baseFontSize * 0.58)));
    const cleanAlamat =
      displayAddress.length > maxChars ? displayAddress.substring(0, maxChars - 3) + '...' : displayAddress;
    ctx.fillText(`📍 LOKASI: ${cleanAlamat}`, paddingX, currentY);

    // Baris 4: Koordinat GPS Terkini Personel & Timestamp
    currentY += Math.round(baseFontSize * 1.25);
    ctx.font = `bold ${Math.max(11, Math.round(baseFontSize * 0.88))}px "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace`;
    ctx.fillStyle = '#38BDF8';
    const finalLat = activeLat || 0;
    const finalLng = activeLng || 0;
    const latStr = finalLat ? finalLat.toFixed(6) : '0.000000';
    const lngStr = finalLng ? finalLng.toFixed(6) : '0.000000';
    ctx.fillText(`🌐 GPS: Lat ${latStr}, Lng ${lngStr} • ⏱️ ${nowStr}`, paddingX, currentY);

    // Baris 5: Catatan Deviasi (jika ada ketidaksesuaian lokasi)
    if (isDiscrepancy) {
      currentY += Math.round(baseFontSize * 1.25);
      ctx.font = `bold ${Math.max(11, Math.round(baseFontSize * 0.88))}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillStyle = '#F87171';
      ctx.fillText(`⚠️ ANOMALI: Jarak ${distStr} dari TKP (${(tkpAlamat || 'Lokasi Laporan').slice(0, 32)}...)`, paddingX, currentY);
    }
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

      // Render frame video asli dari kamera (Mirroring horizontal jika kamera depan agar natural)
      if (facingMode === 'user') {
        ctx.save();
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
        try {
          ctx.drawImage(video, 0, 0, width, height);
        } catch (drawErr) {
          console.warn('Gagal menggambar frame video:', drawErr);
        }
        ctx.restore();
      } else {
        try {
          ctx.drawImage(video, 0, 0, width, height);
        } catch (drawErr) {
          console.warn('Gagal menggambar frame video:', drawErr);
        }
      }

      // Sematkan watermark lokasi & koordinat terkini personel langsung ke piksel kanvas
      stampWatermarkOnCanvas(ctx, width, height);

      const watermarkedDataUrl = canvas.toDataURL('image/jpeg', 0.90);
      setCapturedImage(watermarkedDataUrl);
      stopCameraStream();

      const meta = {
        lat: activeLat,
        lng: activeLng,
        address: activeAddress,
        distanceMeters: Math.round(distanceMeters),
        isDiscrepancy,
        warningMessage: isDiscrepancy ? warningText : undefined,
      };
      setLastPhotoMetadata(meta);
      onPhotoCaptured(watermarkedDataUrl, meta);
    } catch (err) {
      console.error('Error saat mengambil snapshot:', err);
      alert('Terjadi kendala saat mengambil foto. Silakan coba kembali.');
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setLastPhotoMetadata(null);
    startCamera();
  };

  const currentIsDiscrepancy = lastPhotoMetadata ? lastPhotoMetadata.isDiscrepancy : isDiscrepancy;
  const currentAddressDisplay = lastPhotoMetadata ? lastPhotoMetadata.address : activeAddress;
  const currentDistStr = lastPhotoMetadata
    ? (lastPhotoMetadata.distanceMeters >= 1000
        ? `${(lastPhotoMetadata.distanceMeters / 1000).toFixed(1)} km`
        : `${lastPhotoMetadata.distanceMeters} meter`)
    : distStr;

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

      {/* Mode Simulasi Koordinat (Khusus Uji Coba Pengembang / Konsol Simulasi) */}
      {isSimulationMode && hasTkpTarget && (
        <div
          style={{
            marginBottom: '12px',
            padding: '8px 12px',
            background: useSimulatedCoords ? '#ECFDF5' : '#FEF2F2',
            border: `1.5px dashed ${useSimulatedCoords ? '#10B981' : '#F87171'}`,
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11.5px',
            transition: 'all 0.2s',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '13px' }}>🧪</span>
            <span style={{ fontWeight: 800, color: useSimulatedCoords ? '#065F46' : '#991B1B' }}>
              Simulasi Koordinat:
            </span>
            <span style={{ fontSize: '11px', color: useSimulatedCoords ? '#047857' : '#B91C1C' }}>
              {useSimulatedCoords ? 'Titik TKP (Status Hijau Valid)' : 'Titik Riil Laptop (Status Merah Anomali)'}
            </span>
          </div>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '11.5px',
              color: useSimulatedCoords ? '#065F46' : '#991B1B',
            }}
          >
            <input
              type="checkbox"
              id="chk-sim-tkp-coords"
              checked={useSimulatedCoords}
              onChange={(e) => {
                const checked = e.target.checked;
                setUseSimulatedCoords(checked);
                if (checked && tkpAlamat) {
                  setLiveAddress(tkpAlamat);
                } else if (!checked) {
                  if (lokasiPersonil) setLiveAddress(lokasiPersonil);
                  else if (gpsLat && gpsLng) reverseGeocode(gpsLat, gpsLng);
                }
              }}
              style={{ cursor: 'pointer', width: '15px', height: '15px', accentColor: '#10B981' }}
            />
            <span>Gunakan Titik TKP ({useSimulatedCoords ? 'Hijau' : 'Klik utk Hijau'})</span>
          </label>
        </div>
      )}

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
              border: isDiscrepancy ? '2px solid #EF4444' : '2px solid #153E75',
              boxShadow: isDiscrepancy ? '0 4px 14px rgba(239, 68, 68, 0.35)' : '0 4px 12px rgba(0,0,0,0.2)',
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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
                  LIVE KAMERA
                </div>

                {hasTkpTarget && (
                  <div
                    style={{
                      background: isDiscrepancy ? 'rgba(220, 38, 38, 0.92)' : 'rgba(5, 150, 105, 0.92)',
                      color: 'white',
                      fontSize: '10px',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '4px',
                      border: isDiscrepancy ? '1px solid #F87171' : '1px solid #34D399',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      pointerEvents: 'none',
                    }}
                  >
                    <span>{isDiscrepancy ? '⚠️ DI LUAR TKP' : '✓ TKP SESUAI'}</span>
                    <span>({distStr})</span>
                  </div>
                )}
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
                📍 {isResolvingAddress ? 'Mencari alamat satelit...' : activeAddress}
              </div>
              <div style={{ color: '#38BDF8', fontFamily: 'monospace', marginTop: '2px' }}>
                🌐 Lat: {activeLat ? activeLat.toFixed(6) : '0.000000'}, Lng: {activeLng ? activeLng.toFixed(6) : '0.000000'}
              </div>
              {hasTkpTarget && isDiscrepancy && (
                <div style={{ color: '#F87171', fontWeight: 800, marginTop: '2px' }}>
                  ⚠️ Jarak ke TKP: {distStr} (Terindikasi di luar radius TKP)
                </div>
              )}
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
                background: isDiscrepancy
                  ? 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)'
                  : 'linear-gradient(135deg, #DC2626 0%, #EA580C 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '30px',
                fontSize: '13px',
                fontWeight: 900,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: isDiscrepancy
                  ? '0 4px 14px rgba(220, 38, 38, 0.55)'
                  : '0 4px 14px rgba(220, 38, 38, 0.45)',
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
          <div
            style={{
              position: 'relative',
              borderRadius: '8px',
              overflow: 'hidden',
              border: currentIsDiscrepancy ? '2px solid #EF4444' : '2px solid #10B981',
              background: '#0B0F19',
              boxShadow: currentIsDiscrepancy
                ? '0 4px 14px rgba(239, 68, 68, 0.35)'
                : '0 4px 14px rgba(16, 185, 129, 0.25)',
            }}
          >
            <img
              src={capturedImage}
              alt="Bukti Visual Berwatermark"
              style={{
                width: '100%',
                height: 'auto',
                maxHeight: '520px',
                objectFit: 'contain',
                display: 'block',
                margin: '0 auto',
              }}
            />
          </div>

          {/* Rangkuman Data Terpatri: KONDISIONAL MERAH (ANOMALI) / HIJAU (VALID) */}
          {currentIsDiscrepancy ? (
            <div
              id="photo-discrepancy-warning"
              style={{
                marginTop: '10px',
                padding: '12px 14px',
                background: '#FEF2F2',
                border: '1.5px solid #FECACA',
                borderRadius: '8px',
                fontSize: '11.5px',
                color: '#991B1B',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <div style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px', color: '#DC2626', fontSize: '12px' }}>
                <span>⚠️</span>
                <span>PERINGATAN KETIDAKSESUAIAN LOKASI (GEOTAG MISMATCH)</span>
              </div>
              <div style={{ fontSize: '11.5px', lineHeight: 1.5, color: '#991B1B' }}>
                Foto terdeteksi diambil di <strong>{currentAddressDisplay}</strong> (Jarak: <strong>{currentDistStr}</strong> dari TKP{tkpAlamat ? ` "${tkpAlamat}"` : ''}). <strong>Foto terindikasi di luar area kejadian!</strong>
              </div>
              <div style={{ fontSize: '10.5px', color: '#B91C1C', background: '#FEE2E2', padding: '6px 10px', borderRadius: '6px', border: '1px dashed #FCA5A5' }}>
                🛡️ <strong>Catatan Integritas Presisi:</strong> Temuan anomali jarak ini otomatis dicatat secara permanen pada <em>Buku Catatan Lapangan (Logbook Audit Propam)</em> dan <em>Audit Log Tiket Pengaduan</em>.
              </div>
              <div style={{ fontSize: '11px', color: '#7F1D1D', display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '2px', borderTop: '1px solid #FECACA', paddingTop: '6px' }}>
                <span>👮 {personilPangkat} {personilNama} ({personilNrp})</span>
                <span>📍 GPS Foto: {(lastPhotoMetadata?.lat ?? activeLat).toFixed(6)}, {(lastPhotoMetadata?.lng ?? activeLng).toFixed(6)}</span>
                {hasTkpTarget && <span>🎯 Target TKP: {targetTkpLat.toFixed(6)}, {targetTkpLng.toFixed(6)}</span>}
              </div>
            </div>
          ) : (
            <div
              id="photo-verified-box"
              style={{
                marginTop: '10px',
                padding: '10px 14px',
                background: '#F0FDF4',
                border: '1px solid #BBF7D0',
                borderRadius: '8px',
                fontSize: '11.5px',
                color: '#166534',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <div style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>✓</span>
                <span>Watermark identitas, lokasi satelit, dan koordinat GPS telah terpatri permanen ke dalam berkas foto di atas.</span>
              </div>
              <div style={{ fontSize: '11px', color: '#15803D', display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '2px' }}>
                <span>👮 {personilPangkat} {personilNama} ({personilNrp})</span>
                <span>📍 {currentAddressDisplay}</span>
                <span>🌐 {(lastPhotoMetadata?.lat ?? activeLat).toFixed(6)}, {(lastPhotoMetadata?.lng ?? activeLng).toFixed(6)}</span>
                {hasTkpTarget && <span style={{ fontWeight: 700 }}>🎯 Terverifikasi di Radius TKP ({currentDistStr})</span>}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: '10px' }}>
            <button
              type="button"
              id="btn-ambil-ulang-foto"
              onClick={handleRetake}
              style={{
                padding: '8px 16px',
                background: '#F1F5F9',
                color: '#153E75',
                border: '1px solid #CBD5E1',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
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
