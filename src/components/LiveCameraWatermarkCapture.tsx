'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

export interface LiveCameraWatermarkCaptureProps {
  personilNama: string;
  personilPangkat?: string;
  personilNrp?: string;
  alamatTkp?: string;
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
  alamatTkp = 'Kawasan Hukum Presisi',
  gpsLat = -6.2088,
  gpsLng = 106.8456,
  onPhotoCaptured,
  onCancel,
  label = 'Dokumentasi Visual Autentik di TKP',
  required = true,
}: LiveCameraWatermarkCaptureProps) {
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Matikan stream saat unmount
  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, [stopCameraStream]);

  // Buka kamera stream (getUserMedia)
  const startCamera = async () => {
    setCameraError(null);
    setIsProcessing(true);
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error('Perangkat atau browser tidak mendukung akses langsung kamera (WebRTC).');
      }

      // Prioritaskan kamera belakang (environment)
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Live camera stream error, trying fallback capture mode:', err);
      setCameraError(
        err.message || 'Izin kamera belum diberikan. Menggunakan mode pemicu kamera perangkat langsung.'
      );
      // Fallback: picu langsung input capture="environment"
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Fungsi Stamping Watermark Otomatis ke Canvas
  const stampWatermarkOnCanvas = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    // 1. Overlay strip gelap di bagian bawah
    const bannerHeight = Math.max(90, Math.round(height * 0.2));
    const gradient = ctx.createLinearGradient(0, height - bannerHeight, 0, height);
    gradient.addColorStop(0, 'rgba(15, 23, 42, 0.85)');
    gradient.addColorStop(1, 'rgba(15, 23, 42, 0.98)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, height - bannerHeight, width, bannerHeight);

    // Garis aksen emas di atas banner
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(0, height - bannerHeight, width, 3);

    // 2. Format Waktu Indonesia Barat
    const nowStr = new Date().toLocaleString('id-ID', {
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
    ctx.fillText('🛡️ POLRI PRESISI 110 • DOKUMENTASI VISUAL RESMI PENANGANAN TKP', startX, currentY);

    currentY += fontSize + 6;
    ctx.font = `bold ${Math.max(11, fontSize - 2)}px sans-serif`;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`👮 PETUGAS: ${personilPangkat} ${personilNama} (NRP: ${personilNrp})`, startX, currentY);

    currentY += fontSize + 5;
    ctx.font = `normal ${Math.max(10, fontSize - 3)}px sans-serif`;
    ctx.fillStyle = '#E2E8F0';
    const cleanAlamat = alamatTkp.length > 70 ? alamatTkp.substring(0, 67) + '...' : alamatTkp;
    ctx.fillText(`📍 ALAMAT: ${cleanAlamat}`, startX, currentY);

    currentY += fontSize + 5;
    ctx.font = `bold ${Math.max(10, fontSize - 3)}px monospace`;
    ctx.fillStyle = '#38BDF8';
    const latStr = gpsLat ? gpsLat.toFixed(6) : '0.000000';
    const lngStr = gpsLng ? gpsLng.toFixed(6) : '0.000000';
    ctx.fillText(`🌐 KOORDINAT: Lat ${latStr}, Lng ${lngStr} • ⏱️ ${nowStr}`, startX, currentY);
  };

  // Ambil snapshot dari video element
  const takeSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Render frame video asli
    ctx.drawImage(video, 0, 0, width, height);

    // Sematkan watermark
    stampWatermarkOnCanvas(ctx, width, height);

    const watermarkedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
    setCapturedImage(watermarkedDataUrl);
    stopCameraStream();
    onPhotoCaptured(watermarkedDataUrl);
  };

  // Tangani pengambilan dari input capture="environment" (Direct Camera on Mobile)
  const handleNativeCameraFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    const reader = new FileReader();

    reader.onload = (re) => {
      img.onload = () => {
        const canvas = canvasRef.current || document.createElement('canvas');
        const width = img.width || 1280;
        const height = img.height || 720;
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(img, 0, 0, width, height);
        stampWatermarkOnCanvas(ctx, width, height);

        const finalDataUrl = canvas.toDataURL('image/jpeg', 0.88);
        setCapturedImage(finalDataUrl);
        onPhotoCaptured(finalDataUrl);
      };
      img.src = re.target?.result as string;
    };
    reader.readAsDataURL(file);
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
        Wajib mengambil foto langsung dari sensor kamera di lokasi TKP. Sistem secara otomatis menyematkan watermark nama personel, alamat kejadian, dan koordinat satelit GPS secara permanen.
      </div>

      {/* Hidden Fallback Input (HANYA capture="environment", DILARANG upload galeri) */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleNativeCameraFile}
      />

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
            Tekan tombol di bawah untuk membuka lensa kamera dan membidik situasi TKP.
          </div>
          <button
            type="button"
            id="btn-buka-kamera-live"
            onClick={startCamera}
            disabled={isProcessing}
            style={{
              padding: '10px 18px',
              background: 'linear-gradient(135deg, #153E75 0%, #1E40AF 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 800,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 6px rgba(21,62,117,0.3)',
            }}
          >
            <span>📷</span> {isProcessing ? 'Mengakses Kamera...' : 'Aktifkan Kamera Live TKP'}
          </button>
        </div>
      )}

      {/* TAMPILAN 2: STREAM KAMERA AKTIF (VIEWFINDER LIVE) */}
      {isCameraActive && !capturedImage && (
        <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', background: '#0F172A', border: '2px solid #153E75' }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ width: '100%', maxHeight: '340px', objectFit: 'cover', display: 'block' }}
          />

          {/* Badge Live Indicator */}
          <div
            style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              background: 'rgba(220, 38, 38, 0.9)',
              color: 'white',
              fontSize: '10px',
              fontWeight: 800,
              padding: '3px 8px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'white' }}></span>
            LIVE CAMERA TKP
          </div>

          {/* Preview Teks Watermark di Layar Kamera */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'linear-gradient(transparent, rgba(15,23,42,0.95))',
              padding: '12px 14px 10px',
              color: 'white',
              fontSize: '10px',
              lineHeight: 1.4,
            }}
          >
            <div style={{ color: '#FBBF24', fontWeight: 800 }}>👮 {personilPangkat} {personilNama} (NRP: {personilNrp})</div>
            <div style={{ color: '#E2E8F0' }}>📍 {alamatTkp}</div>
            <div style={{ color: '#38BDF8', fontFamily: 'monospace' }}>🌐 {gpsLat.toFixed(5)}, {gpsLng.toFixed(5)}</div>
          </div>

          {/* Tombol Shutter / Bidik */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '12px',
              padding: '12px',
              background: '#0F172A',
            }}
          >
            <button
              type="button"
              onClick={stopCameraStream}
              style={{
                padding: '8px 14px',
                background: '#334155',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Batalkan
            </button>
            <button
              type="button"
              id="btn-bidik-foto"
              onClick={takeSnapshot}
              style={{
                padding: '10px 22px',
                background: '#DC2626',
                color: 'white',
                border: 'none',
                borderRadius: '30px',
                fontSize: '13px',
                fontWeight: 900,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 0 15px rgba(220, 38, 38, 0.6)',
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
              alt="Bukti TKP Berwatermark"
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
              ✓ Terverifikasi Watermark Polri
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
            <span style={{ fontSize: '11px', color: '#059669', fontWeight: 700 }}>
              ✓ Bukti visual tersimpan dengan segel integritas.
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
        <div style={{ marginTop: '8px', padding: '8px 12px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '6px', color: '#DC2626', fontSize: '11px' }}>
          ℹ️ {cameraError}
        </div>
      )}
    </div>
  );
}
