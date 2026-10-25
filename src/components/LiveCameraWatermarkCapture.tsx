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
  requiresStrictTkp?: boolean;
  locationTypeName?: string;
  documentTypeName?: string;
  allowMultiple?: boolean;
  maxPhotos?: number;
  onPhotosChange?: (photos: Array<{ id: string; dataUrl: string; metadata?: any }>) => void;
  initialPhotos?: Array<{ id: string; dataUrl: string; metadata?: any }>;
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
  isSimulationMode = true,
  gpsLat = 0,
  gpsLng = 0,
  onPhotoCaptured,
  onCancel,
  label = 'Dokumentasi Visual Autentik di TKP',
  required = true,
  requiresStrictTkp = true,
  locationTypeName,
  documentTypeName,
  allowMultiple = false,
  maxPhotos = 5,
  onPhotosChange,
  initialPhotos = [],
}: LiveCameraWatermarkCaptureProps) {
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedPhotos, setCapturedPhotos] = useState<Array<{ id: string; dataUrl: string; metadata?: any }>>(initialPhotos);
  const [previewPhoto, setPreviewPhoto] = useState<{ dataUrl: string; metadata?: any } | null>(null);
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

  // Target TKP Resmi (Fallback ke Mampang Prapatan jika belum ada koordinat dari backend)
  const targetTkpLat = tkpLat && Number(tkpLat) !== 0 ? Number(tkpLat) : -6.257210;
  const targetTkpLng = tkpLng && Number(tkpLng) !== 0 ? Number(tkpLng) : 106.818450;
  const resolvedTkpAlamat =
    tkpAlamat && !tkpAlamat.toLowerCase().includes('kawasan hukum')
      ? tkpAlamat
      : (alamatTkp && !alamatTkp.includes('TKP') && !alamatTkp.toLowerCase().includes('kawasan hukum')
          ? alamatTkp
          : 'Jl. Bangka II D No. 12, Mampang Prapatan, Jakarta Selatan');
  const hasTkpTarget = true;

  // Nama ringkas distrik TKP untuk label saklar (cth: "Mampang Prapatan")
  const tkpDistrictName = resolvedTkpAlamat.toLowerCase().includes('mampang')
    ? 'Mampang Prapatan'
    : (resolvedTkpAlamat.split(',')[0].slice(0, 24) || 'Mampang Prapatan');

  // Fallback koordinat riil perangkat laptop personel (Tangerang Selatan, ~15.2 km dari TKP)
  const fallbackRealLat = -6.295896;
  const fallbackRealLng = 106.690349;
  const fallbackRealAddress = 'Lengkong Gudang Timur, Serpong, Tangerang Selatan';

  // Lokasi & Koordinat Terkini Personil (Bukan Alamat Pengaduan Pelapor)
  const [liveGps, setLiveGps] = useState<{ lat: number; lng: number }>({
    lat: gpsLat || 0,
    lng: gpsLng || 0,
  });
  const [liveAddress, setLiveAddress] = useState<string>(
    lokasiPersonil && lokasiPersonil !== 'Lokasi tidak Valid' && !lokasiPersonil.includes('Mampang')
      ? lokasiPersonil
      : fallbackRealAddress
  );
  const [isResolvingAddress, setIsResolvingAddress] = useState<boolean>(false);

  // Koordinat & alamat aktif yang akan distamp ke foto
  const activeLat = useSimulatedCoords
    ? targetTkpLat
    : (liveGps.lat && liveGps.lat !== 0 ? liveGps.lat : (gpsLat && gpsLat !== 0 ? gpsLat : fallbackRealLat));

  const activeLng = useSimulatedCoords
    ? targetTkpLng
    : (liveGps.lng && liveGps.lng !== 0 ? liveGps.lng : (gpsLng && gpsLng !== 0 ? gpsLng : fallbackRealLng));

  const activeAddress = useSimulatedCoords
    ? resolvedTkpAlamat
    : (liveAddress && liveAddress !== 'Lokasi tidak Valid' && !liveAddress.includes('Mampang')
        ? liveAddress
        : (lokasiPersonil && lokasiPersonil !== 'Lokasi tidak Valid' && !lokasiPersonil.includes('Mampang')
            ? lokasiPersonil
            : fallbackRealAddress));

  // Hitung deviasi jarak terhadap TKP
  const distanceMeters = computeHaversineMeters(activeLat, activeLng, targetTkpLat, targetTkpLng);

  // Ambang batas toleransi radius penanganan TKP (100 meter) - HANYA berlaku jika requiresStrictTkp true
  const isDiscrepancy = requiresStrictTkp !== false && distanceMeters > 100;
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
    const isFlexibleLocation = requiresStrictTkp === false;

    // 1. Badge Verifikasi Satelit di Pojok Kanan Atas Foto
    const topBadgeText = isFlexibleLocation
      ? (locationTypeName ? `✓ LOKASI SAH: ${locationTypeName.slice(0, 22).toUpperCase()}` : '✓ LOKASI PENYELESAIAN SAH')
      : isDiscrepancy
        ? `⚠️ ANOMALI: DILUAR TKP (${distStr})`
        : '✓ TERVERIFIKASI SATELIT PRESISI GPS';

    const topBadgeWidth = Math.max(
      isDiscrepancy || isFlexibleLocation ? 290 : 220,
      Math.round(width * (isDiscrepancy || isFlexibleLocation ? 0.40 : 0.28))
    );
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
      ctx.fillText(topBadgeText, topBadgeX + topBadgeWidth / 2, topBadgeY + topBadgeHeight / 2);
    } else if (isFlexibleLocation) {
      ctx.fillStyle = 'rgba(16, 185, 129, 0.95)';
      ctx.fillRect(topBadgeX, topBadgeY, topBadgeWidth, topBadgeHeight);
      ctx.strokeStyle = '#6EE7B7';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(topBadgeX, topBadgeY, topBadgeWidth, topBadgeHeight);

      ctx.font = `bold ${Math.max(10, Math.round(topBadgeHeight * 0.44))}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(topBadgeText, topBadgeX + topBadgeWidth / 2, topBadgeY + topBadgeHeight / 2);
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
      ctx.fillText(topBadgeText, topBadgeX + topBadgeWidth / 2, topBadgeY + topBadgeHeight / 2);
    }
    ctx.restore();

    // 2. Banner Gelap di Bagian Bawah Foto
    const extraLines = documentTypeName ? 1 : 0;
    const bannerHeight = Math.max(
      isDiscrepancy ? 140 : 115 + extraLines * 20,
      Math.round(height * (isDiscrepancy ? 0.30 : 0.25 + extraLines * 0.035))
    );
    const startY = height - bannerHeight;

    const gradient = ctx.createLinearGradient(0, startY, 0, height);
    gradient.addColorStop(0, 'rgba(15, 23, 42, 0.88)');
    gradient.addColorStop(0.35, 'rgba(15, 23, 42, 0.95)');
    gradient.addColorStop(1, 'rgba(15, 23, 42, 0.99)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, startY, width, bannerHeight);

    // Garis aksen di atas banner (Merah jika anomali, Hijau jika fleksibel, Emas jika normal TKP)
    ctx.fillStyle = isDiscrepancy ? '#EF4444' : isFlexibleLocation ? '#10B981' : '#F59E0B';
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
    let currentY = startY + Math.round(bannerHeight * 0.18);

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    // Baris 1: Header Dokumen Resmi
    ctx.font = `bold ${Math.round(baseFontSize * 1.05)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillStyle = isDiscrepancy ? '#FCA5A5' : isFlexibleLocation ? '#6EE7B7' : '#FBBF24';
    ctx.fillText(
      isDiscrepancy
        ? '⚠️ POLRI SIMOPMAS 110 • DOKUMENTASI TERINDIKASI DILUAR LOKASI TKP'
        : isFlexibleLocation
        ? '🛡️ POLRI SIMOPMAS 110 • DOKUMENTASI PENYELESAIAN PERKARA (BAP)'
        : '🛡️ POLRI SIMOPMAS 110 • DOKUMENTASI VISUAL LAPANGAN RESMI',
      paddingX,
      currentY
    );

    // Baris 2: Identitas Personel
    currentY += Math.round(baseFontSize * 1.25);
    ctx.font = `bold ${baseFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`👮 PETUGAS: ${personilPangkat} ${personilNama} (NRP: ${personilNrp})`, paddingX, currentY);

    // Baris Tambahan: Objek Dokumentasi (jika tersedia)
    if (documentTypeName) {
      currentY += Math.round(baseFontSize * 1.20);
      ctx.font = `bold ${Math.max(11, Math.round(baseFontSize * 0.90))}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillStyle = '#FDE047';
      ctx.fillText(`📄 OBJEK BUKTI: ${documentTypeName}`, paddingX, currentY);
    }

    // Baris 3: Lokasi Terkini Personil (Alamat Riil Personil)
    currentY += Math.round(baseFontSize * 1.20);
    ctx.font = `normal ${Math.max(11, Math.round(baseFontSize * 0.88))}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillStyle = '#E2E8F0';
    const displayAddress = locationTypeName
      ? `${locationTypeName} (${activeAddress || 'Area Terverifikasi'})`
      : (activeAddress || 'Lokasi Terkini Personel (Satelit Presisi)');
    const maxChars = Math.max(45, Math.round(width / (baseFontSize * 0.58)));
    const cleanAlamat =
      displayAddress.length > maxChars ? displayAddress.substring(0, maxChars - 3) + '...' : displayAddress;
    ctx.fillText(`📍 LOKASI: ${cleanAlamat}`, paddingX, currentY);

    // Baris 4: Koordinat GPS Terkini Personel & Timestamp
    currentY += Math.round(baseFontSize * 1.20);
    ctx.font = `bold ${Math.max(11, Math.round(baseFontSize * 0.88))}px "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace`;
    ctx.fillStyle = '#38BDF8';
    const finalLat = activeLat || 0;
    const finalLng = activeLng || 0;
    const latStr = finalLat ? finalLat.toFixed(6) : '0.000000';
    const lngStr = finalLng ? finalLng.toFixed(6) : '0.000000';
    ctx.fillText(`🌐 GPS: Lat ${latStr}, Lng ${lngStr} • ⏱️ ${nowStr}`, paddingX, currentY);

    // Baris 5: Catatan Validasi / Deviasi Jarak terhadap TKP
    currentY += Math.round(baseFontSize * 1.20);
    ctx.font = `bold ${Math.max(11, Math.round(baseFontSize * 0.88))}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    if (isFlexibleLocation) {
      ctx.fillStyle = '#34D399';
      ctx.fillText(`✓ VALIDASI: Lokasi & Objek BAP Sah Terverifikasi (${locationTypeName || 'Administrasi / Faskes'})`, paddingX, currentY);
    } else if (isDiscrepancy) {
      ctx.fillStyle = '#F87171';
      ctx.fillText(`⚠️ ANOMALI: Jarak ${distStr} dari TKP (${(resolvedTkpAlamat || 'Lokasi Laporan').slice(0, 32)}...)`, paddingX, currentY);
    } else {
      ctx.fillStyle = '#34D399';
      ctx.fillText(`✓ VALIDASI: Terverifikasi di radius TKP (${distStr})`, paddingX, currentY);
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
      const meta = {
        lat: activeLat,
        lng: activeLng,
        address: activeAddress,
        distanceMeters: Math.round(distanceMeters),
        isDiscrepancy,
        warningMessage: isDiscrepancy ? warningText : undefined,
      };

      setCapturedImage(watermarkedDataUrl);
      setLastPhotoMetadata(meta);

      if (allowMultiple) {
        const newPhotoItem = {
          id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          dataUrl: watermarkedDataUrl,
          metadata: meta,
        };
        const updated = [...capturedPhotos, newPhotoItem];
        setCapturedPhotos(updated);
        if (onPhotosChange) {
          onPhotosChange(updated);
        }
      }

      stopCameraStream();
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

  const removePhoto = (id: string) => {
    const updated = capturedPhotos.filter((p) => p.id !== id);
    setCapturedPhotos(updated);
    if (onPhotosChange) {
      onPhotosChange(updated);
    }
    if (updated.length > 0) {
      const last = updated[updated.length - 1];
      setCapturedImage(last.dataUrl);
      setLastPhotoMetadata(last.metadata || null);
      onPhotoCaptured(last.dataUrl, last.metadata);
    } else {
      setCapturedImage(null);
      setLastPhotoMetadata(null);
      onPhotoCaptured('', undefined);
    }
  };

  const [previewModalItem, setPreviewModalItem] = useState<{
    id: string;
    dataUrl: string;
    metadata?: any;
    index: number;
  } | null>(null);

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

      {/* ========================================================================= */}
      {/* KONTROL LOKASI: SIMULASI TKP vs LOKASI PENYELESAIAN RESMI                 */}
      {/* ========================================================================= */}
      {requiresStrictTkp !== false ? (
        <div
          id="camera-simulation-switch-container"
          style={{
            marginBottom: '12px',
            padding: '10px 14px',
            background: useSimulatedCoords ? '#ECFDF5' : '#FEF2F2',
            border: `1.5px solid ${useSimulatedCoords ? '#10B981' : '#F87171'}`,
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
            fontSize: '11.5px',
            transition: 'all 0.25s ease',
            boxShadow: useSimulatedCoords
              ? '0 2px 8px rgba(16, 185, 129, 0.12)'
              : '0 2px 8px rgba(248, 113, 113, 0.12)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '15px' }}>{useSimulatedCoords ? '🟢' : '🔴'}</span>
            <div>
              <div style={{ fontWeight: 800, color: useSimulatedCoords ? '#065F46' : '#991B1B' }}>
                {useSimulatedCoords
                  ? `✓ Simulasi TKP Aktif: Status HIJAU (Terverifikasi di TKP)`
                  : `⚠️ Lokasi Riil Aktif: Status MERAH (Anomali di Luar TKP)`}
              </div>
              <div style={{ fontSize: '10.5px', color: useSimulatedCoords ? '#047857' : '#B91C1C', marginTop: '2px' }}>
                {useSimulatedCoords
                  ? `Kamera mencetak lokasi TKP ${tkpDistrictName} • Jarak: 0 m`
                  : `Kamera mencetak lokasi Tangerang Selatan • Jarak: ${distStr} dari TKP`}
              </div>
            </div>
          </div>

          <label
            htmlFor="chk-sim-tkp-coords"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              fontWeight: 800,
              fontSize: '12px',
              color: useSimulatedCoords ? '#065F46' : '#991B1B',
              background: useSimulatedCoords ? '#D1FAE5' : '#FEE2E2',
              border: `1.5px solid ${useSimulatedCoords ? '#059669' : '#DC2626'}`,
              padding: '5px 12px',
              borderRadius: '6px',
              userSelect: 'none',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}
          >
            <input
              type="checkbox"
              id="chk-sim-tkp-coords"
              checked={useSimulatedCoords}
              onChange={(e) => {
                const checked = e.target.checked;
                setUseSimulatedCoords(checked);
                if (checked) {
                  setLiveAddress(resolvedTkpAlamat);
                } else {
                  setLiveAddress(fallbackRealAddress);
                }
              }}
              style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#10B981' }}
            />
            <span>Gunakan Koordinat Simulasi TKP ({tkpDistrictName})</span>
          </label>
        </div>
      ) : (
        <div
          id="camera-flexible-location-container"
          style={{
            marginBottom: '12px',
            padding: '10px 14px',
            background: '#F0FDF4',
            border: '1.5px solid #10B981',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
            fontSize: '11.5px',
            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>🏛️</span>
            <div>
              <div style={{ fontWeight: 800, color: '#065F46' }}>
                Lokasi Penyelesaian Sah: {locationTypeName || 'Administrasi / Non-TKP'}
              </div>
              <div style={{ fontSize: '10.5px', color: '#047857', marginTop: '2px' }}>
                Objek Dokumentasi: <strong>{documentTypeName || 'Dokumentasi BAP'}</strong> • Fleksibilitas GPS aktif (Bukan anomali TKP)
              </div>
            </div>
          </div>
          <span
            style={{
              fontSize: '10.5px',
              fontWeight: 800,
              background: '#DCFCE7',
              color: '#15803D',
              border: '1px solid #86EFAC',
              padding: '3px 10px',
              borderRadius: '12px',
            }}
          >
            ✓ Terverifikasi Sah
          </span>
        </div>
      )}

      {/* TAMPILAN 1: BELUM MENGAMBIL FOTO & KAMERA BELUM AKTIF */}
      {!isCameraActive && (allowMultiple ? capturedPhotos.length === 0 : !capturedImage) && (
        <div style={{ textAlign: 'center', padding: '16px', background: '#F8FAFC', border: '1.5px dashed #94A3B8', borderRadius: '8px' }}>
          <div style={{ fontSize: '32px', marginBottom: '6px' }}>📸</div>
          <div style={{ fontWeight: 700, fontSize: '12.5px', color: '#1E293B', marginBottom: '4px' }}>
            Kamera Belum Diaktifkan
          </div>
          <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '12px' }}>
            {allowMultiple
              ? `Tekan tombol di bawah untuk membuka lensa kamera langsung. Anda dapat membidik hingga ${maxPhotos} foto bukti di lokasi.`
              : 'Tekan tombol di bawah untuk membuka lensa kamera dan membidik situasi secara langsung.'}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button
              type="button"
              id="btn-buka-kamera-live"
              data-testid="btn-buka-kamera-live"
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
      {isCameraActive && (
        <div>
          {/* Header Indikator Jumlah Foto Multi-Shot */}
          {allowMultiple && (
            <div
              style={{
                marginBottom: '8px',
                padding: '6px 12px',
                background: '#EFF6FF',
                border: '1px solid #BFDBFE',
                borderRadius: '6px',
                fontSize: '11.5px',
                fontWeight: 700,
                color: '#1D4ED8',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>📸 Membidik Foto #{capturedPhotos.length + 1} (Maksimal {maxPhotos} Foto)</span>
              <span style={{ fontSize: '11px', color: '#64748B' }}>
                Tersimpan: <strong>{capturedPhotos.length}</strong> foto
              </span>
            </div>
          )}

          {/* KOTAK VIEWFINDER KAMERA (HANYA BERISI VIDEO & WATERMARK OVERLAY) */}
          <div
            id="kamera-live-watermark"
            data-testid="kamera-live-watermark"
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

            {/* Preview Teks Watermark di Layar Kamera */}
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

          {/* BAR TOMBOL KONTROL */}
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
              id="btn-capture-foto"
              data-testid="btn-capture-foto"
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

      {/* TAMPILAN 3: FOTO TUNGGAL BERHASIL DIAMBIL (MODE SINGLE) */}
      {!isCameraActive && !allowMultiple && capturedImage && (
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
              data-testid="btn-ambil-ulang-foto"
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

      {/* TAMPILAN 4: GALERI MULTI-FOTO KAMERA TERVERIFIKASI (MODE allowMultiple) */}
      {!isCameraActive && allowMultiple && capturedPhotos.length > 0 && (
        <div style={{ marginTop: '8px' }}>
          {/* Header Galeri Multi-Foto */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px',
              padding: '8px 12px',
              background: '#F0FDF4',
              border: '1px solid #BBF7D0',
              borderRadius: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px' }}>📸</span>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#166534' }}>
                  Galeri Bukti Kamera Terverifikasi ({capturedPhotos.length}/{maxPhotos})
                </div>
                <div style={{ fontSize: '10.5px', color: '#15803D' }}>
                  Watermark lokasi satelit terpatri permanen pada setiap foto.
                </div>
              </div>
            </div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: '6px',
                background: '#DCFCE7',
                color: '#15803D',
                border: '1px solid #86EFAC',
              }}
            >
              {capturedPhotos.length} / {maxPhotos} Foto
            </span>
          </div>

          {/* Grid Thumbnail Foto-Foto yang Sudah Dibidik */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '12px',
              marginBottom: '12px',
            }}
          >
            {capturedPhotos.map((item, idx) => {
              const itemIsDiscrepancy = item.metadata?.isDiscrepancy;
              return (
                <div
                  key={item.id}
                  style={{
                    background: '#FFFFFF',
                    border: `1.5px solid ${itemIsDiscrepancy ? '#FCA5A5' : '#CBD5E1'}`,
                    borderRadius: '8px',
                    overflow: 'hidden',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                  }}
                >
                  {/* Thumbnail Image Container */}
                  <div
                    style={{
                      position: 'relative',
                      background: '#0B0F19',
                      height: '125px',
                      cursor: 'pointer',
                    }}
                    onClick={() => setPreviewModalItem({ ...item, index: idx })}
                    title="Klik untuk memperbesar foto berwatermark"
                  >
                    <img
                      src={item.dataUrl}
                      alt={`Bukti Foto #${idx + 1}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                    {/* Badge Nomor Foto */}
                    <span
                      style={{
                        position: 'absolute',
                        top: '6px',
                        left: '6px',
                        background: 'rgba(15, 23, 42, 0.85)',
                        color: 'white',
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        border: '1px solid rgba(255,255,255,0.25)',
                      }}
                    >
                      #{idx + 1}
                    </span>

                    {/* Badge Status GPS */}
                    <span
                      style={{
                        position: 'absolute',
                        top: '6px',
                        right: '6px',
                        background: itemIsDiscrepancy ? 'rgba(220, 38, 38, 0.9)' : 'rgba(5, 150, 105, 0.9)',
                        color: 'white',
                        fontSize: '9.5px',
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      {itemIsDiscrepancy ? '⚠️ Luar TKP' : '✓ GPS Sah'}
                    </span>
                  </div>

                  {/* Info Ringkas & Tombol Kontrol */}
                  <div style={{ padding: '8px 10px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#F8FAFC' }}>
                    <div style={{ fontSize: '10px', color: '#475569', marginBottom: '6px', lineHeight: 1.3 }}>
                      <div style={{ fontWeight: 700, color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        📍 {item.metadata?.address ? item.metadata.address.slice(0, 30) + '...' : 'Lokasi Terverifikasi'}
                      </div>
                      <div style={{ fontFamily: 'monospace', color: '#0284C7', fontSize: '9.5px' }}>
                        Lat: {item.metadata?.lat ? item.metadata.lat.toFixed(4) : '-'}, Lng: {item.metadata?.lng ? item.metadata.lng.toFixed(4) : '-'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => setPreviewModalItem({ ...item, index: idx })}
                        style={{
                          flex: 1,
                          padding: '4px 6px',
                          background: '#EFF6FF',
                          color: '#1D4ED8',
                          border: '1px solid #BFDBFE',
                          borderRadius: '5px',
                          fontSize: '10.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '3px',
                        }}
                      >
                        <span>🔍</span> Perbesar
                      </button>
                      <button
                        type="button"
                        onClick={() => removePhoto(item.id)}
                        style={{
                          padding: '4px 8px',
                          background: '#FEF2F2',
                          color: '#DC2626',
                          border: '1px solid #FECACA',
                          borderRadius: '5px',
                          fontSize: '10.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        title="Hapus foto ini"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Bar Bawah: Tambah Foto Lagi / Batas Tercapai */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '8px', paddingTop: '8px', borderTop: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '11px', color: '#64748B' }}>
              🔒 Kamera Langsung Anti-Galeri • {capturedPhotos.length} foto siap dikirim
            </div>

            {capturedPhotos.length < maxPhotos ? (
              <button
                type="button"
                id="btn-tambah-foto-lagi"
                onClick={() => startCamera()}
                style={{
                  padding: '7px 16px',
                  background: 'linear-gradient(135deg, #153E75 0%, #1E40AF 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 800,
                  fontSize: '11.5px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 4px rgba(21,62,117,0.2)',
                }}
              >
                <span>➕</span> Bidik Foto Kamera Lagi ({capturedPhotos.length}/{maxPhotos})
              </button>
            ) : (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#64748B',
                  background: '#F1F5F9',
                  padding: '5px 10px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                }}
              >
                ✓ Batas maksimal {maxPhotos} foto tercapai
              </span>
            )}
          </div>
        </div>
      )}

      {/* LIGHTBOX MODAL: PREVIEW FOTO BERWATERMARK FULL SCREEN */}
      {previewModalItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.88)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setPreviewModalItem(null)}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '92vw',
              maxHeight: '92vh',
              background: '#0B0F19',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              border: previewModalItem.metadata?.isDiscrepancy ? '2px solid #EF4444' : '2px solid #10B981',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 16px',
                background: '#0F172A',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                color: 'white',
              }}
            >
              <div style={{ fontWeight: 800, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📸</span>
                <span>Bukti Foto #{previewModalItem.index + 1} (Watermark Presisi Satelit)</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewModalItem(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94A3B8',
                  fontSize: '18px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  padding: '2px 8px',
                }}
              >
                ✕
              </button>
            </div>

            {/* Gambar Watermark Penuh */}
            <div style={{ overflow: 'auto', maxHeight: 'calc(92vh - 60px)', display: 'flex', justifyContent: 'center', background: '#000000' }}>
              <img
                src={previewModalItem.dataUrl}
                alt={`Detail Foto #${previewModalItem.index + 1}`}
                style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }}
              />
            </div>
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
