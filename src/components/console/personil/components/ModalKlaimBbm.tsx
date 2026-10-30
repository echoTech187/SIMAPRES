'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  Fuel,
  Camera,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  Gauge,
  Sparkles,
  Loader2,
  Calendar,
  Clock,
  Check,
} from 'lucide-react';
import { submitFuelClaimAction } from '@/app/actions/master.actions';
import { scanReceiptSpbuAction, type ScannedReceiptData } from '@/app/actions/ocr-receipt.actions';
import type { OfficerProfile, ComplaintData } from '../types';

interface ModalKlaimBbmProps {
  isOpen: boolean;
  onClose: () => void;
  officer: OfficerProfile;
  activeComplaint?: ComplaintData | null;
  currentOdometerKm?: string | number;
  onSuccess?: (msg: string) => void;
}

export default function ModalKlaimBbm({
  isOpen,
  onClose,
  officer,
  activeComplaint,
  currentOdometerKm,
  onSuccess,
}: ModalKlaimBbmProps) {
  // Helper tanggal hari ini (YYYY-MM-DD) & jam sekarang (HH:mm)
  const getTodayDate = () => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const getCurrentTime = () => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    return `${hh}:${min}`;
  };

  const [odometerKm, setOdometerKm] = useState<string>(
    currentOdometerKm ? String(currentOdometerKm) : '0'
  );
  const [liters, setLiters] = useState<string>('');
  const [costRupiah, setCostRupiah] = useState<string>('');
  const [spbuName, setSpbuName] = useState<string>('SPBU Pertamina');
  const [receiptNumber, setReceiptNumber] = useState<string>('');
  const [purchaseDate, setPurchaseDate] = useState<string>(getTodayDate());
  const [purchaseTime, setPurchaseTime] = useState<string>(getCurrentTime());
  const [fuelType, setFuelType] = useState<string>('Pertalite');
  const [notes, setNotes] = useState<string>('');
  const [strukPhoto, setStrukPhoto] = useState<string | null>(null);
  const [spidometerPhoto, setSpidometerPhoto] = useState<string | null>(null);

  // Status AI Scanner
  const [isScanning, setIsScanning] = useState(false);
  const [scanNotice, setScanNotice] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const strukInputRef = useRef<HTMLInputElement>(null);
  const spidometerInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  /**
   * Kompresi gambar sisi klien agar tidak melebihi batas request payload (1MB)
   * dan mempercepat pengiriman ke server action & Gemini AI.
   */
  const compressImageClient = (file: File, maxDim = 1600, quality = 0.85): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onerror = () => resolve('');
      reader.onload = (e) => {
        const rawDataUrl = e.target?.result as string;
        if (!rawDataUrl) return resolve('');

        const img = new Image();
        img.onerror = () => resolve(rawDataUrl);
        img.onload = () => {
          try {
            let { width, height } = img;
            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              resolve(rawDataUrl);
              return;
            }
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', quality);
            resolve(compressed);
          } catch {
            resolve(rawDataUrl);
          }
        };
        img.src = rawDataUrl;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string | null) => void,
    isReceipt: boolean = false
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      setErrorMsg('Ukuran berkas maksimal 20 MB.');
      return;
    }

    try {
      const compressedDataUrl = await compressImageClient(file);
      if (compressedDataUrl) {
        setter(compressedDataUrl);
        if (isReceipt) {
          setScanNotice({
            type: 'info',
            text: 'Foto struk terpilih & dioptimalkan. Klik tombol "Pindai Otomatis AI" di bawah untuk membaca tanggal & biaya secara instan.',
          });
        }
      }
    } catch (err: any) {
      setErrorMsg('Gagal memproses gambar: ' + (err?.message || 'Format tidak didukung.'));
    }
  };

  /**
   * Eksekusi Pemindaian AI Vision untuk Struk SPBU
   */
  const handleScanReceipt = async () => {
    if (!strukPhoto) {
      setErrorMsg('Silakan unggah atau foto struk SPBU terlebih dahulu.');
      return;
    }

    setIsScanning(true);
    setErrorMsg(null);
    setScanNotice(null);

    try {
      const res = await scanReceiptSpbuAction(strukPhoto);
      if (res.success && res.data) {
        const d: ScannedReceiptData = res.data;
        const scannedItems: string[] = [];

        if (d.purchaseDate) {
          setPurchaseDate(d.purchaseDate);
          scannedItems.push(`Tgl: ${d.purchaseDate}`);
        }
        if (d.purchaseTime) {
          setPurchaseTime(d.purchaseTime);
          scannedItems.push(`Jam: ${d.purchaseTime}`);
        }
        if (d.spbuName) {
          setSpbuName(d.spbuName);
          scannedItems.push(d.spbuName);
        }
        if (d.fuelType) {
          setFuelType(d.fuelType);
          scannedItems.push(d.fuelType);
        }
        if (d.liters) {
          setLiters(String(d.liters));
          scannedItems.push(`${d.liters} L`);
        }
        if (d.totalCostRupiah) {
          setCostRupiah(Number(d.totalCostRupiah).toLocaleString('id-ID'));
          scannedItems.push(`Rp ${Number(d.totalCostRupiah).toLocaleString('id-ID')}`);
        }
        if (d.receiptNumber) {
          setReceiptNumber(d.receiptNumber);
        }

        setScanNotice({
          type: 'success',
          text: `AI Berhasil membaca struk! [${scannedItems.join(' • ')}]. Silakan periksa kembali angka di bawah.`,
        });
      } else {
        setScanNotice({
          type: 'error',
          text: res.error || 'Gagal mengenali teks struk SPBU. Anda dapat mengisi form secara manual.',
        });
      }
    } catch (err: any) {
      setScanNotice({
        type: 'error',
        text: err?.message || 'Terjadi kesalahan saat memproses gambar struk dengan AI.',
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const numLiters = parseFloat(liters);
    const numCost = parseFloat(costRupiah.replace(/[^0-9]/g, ''));
    const numOdo = parseFloat(odometerKm);

    if (!numLiters || numLiters <= 0) {
      setErrorMsg('Silakan masukkan jumlah liter pengisian BBM yang valid.');
      return;
    }

    if (!numCost || numCost <= 0) {
      setErrorMsg('Silakan masukkan total nominal biaya pembelian BBM.');
      return;
    }

    if (!spbuName.trim()) {
      setErrorMsg('Nama atau lokasi SPBU wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitFuelClaimAction({
        complaintId: activeComplaint?.id,
        officerId: officer.id,
        odometerKm: isNaN(numOdo) ? 0 : numOdo,
        liters: numLiters,
        costRupiah: numCost,
        spbuName: spbuName.trim(),
        receiptNumber: receiptNumber.trim() || undefined,
        purchaseDate: purchaseDate.trim() || undefined,
        purchaseTime: purchaseTime.trim() || undefined,
        fuelType: fuelType.trim() || undefined,
        strukPhotoUrl: strukPhoto || undefined,
        spidometerPhotoUrl: spidometerPhoto || undefined,
        notes: notes.trim() || undefined,
      });

      if (res.success) {
        if (onSuccess) {
          onSuccess(res.message || 'Klaim BBM berhasil diajukan ke Bag Log.');
        }
        onClose();
      } else {
        setErrorMsg(res.error || 'Gagal mengajukan klaim BBM.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Terjadi kesalahan sistem saat menyimpan klaim.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md overflow-hidden animate-in fade-in duration-200">
      <div
        className="relative w-full h-[100dvh] sm:h-auto max-w-none sm:max-w-xl min-h-[100dvh] sm:min-h-0 sm:max-h-[90vh] rounded-none sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl text-slate-100 border-0 sm:border border-amber-500/40 animate-in zoom-in-95 duration-200"
        style={{
          background: 'linear-gradient(180deg, #151821 0%, #0E1017 100%)',
        }}
      >
        {/* Header Modal - Sticky Top */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-3.5 sm:px-6 sm:py-4 border-b border-slate-800 bg-[#151821]/95 backdrop-blur-md flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <Fuel size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white">Pengajuan Klaim BBM &amp; Struk</h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-300 flex items-center gap-1">
                  <Sparkles size={10} className="text-amber-400" />
                  AI OCR
                </span>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-1">
                Klaim Anggaran DIPA Bag Log • Personel: {officer.fullName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors shrink-0"
            title="Tutup Modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="flex flex-col h-full sm:h-auto min-h-0 flex-1">
          {/* Scrollable Body Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 min-h-0 overscroll-contain">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle size={16} className="flex-shrink-0 text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Mission Reference Banner */}
            {activeComplaint && (
              <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/25 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <FileText size={15} className="text-sky-400 flex-shrink-0" />
                  <div>
                    <span className="font-bold text-sky-200">
                      Tiket #{activeComplaint.nomorTiket || activeComplaint.id}
                    </span>
                    <div className="text-[10.5px] text-slate-400 truncate max-w-[220px]">
                      {activeComplaint.jenisKejadian || 'Tugas Patroli 110'}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-sky-400/20 text-sky-300 border border-sky-400/30">
                  Terkait Misi
                </span>
              </div>
            )}

            {/* Upload Foto Struk & Foto Spidometer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Foto Struk */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-300">
                  📸 Foto Struk Fisik SPBU:
                </label>
                <input
                  type="file"
                  ref={strukInputRef}
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => handleFileChange(e, setStrukPhoto, true)}
                  className="hidden"
                />
                {strukPhoto ? (
                  <div className="relative rounded-xl overflow-hidden border border-emerald-500/40 bg-slate-900 h-28 flex items-center justify-center group">
                    <img src={strukPhoto} alt="Struk SPBU" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setStrukPhoto(null);
                        setScanNotice(null);
                      }}
                      className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/70 text-white hover:bg-red-600 transition-colors"
                      title="Hapus foto"
                    >
                      <X size={14} />
                    </button>
                    <span className="absolute bottom-1 left-2 text-[9px] font-bold text-emerald-400 bg-black/80 px-1.5 py-0.5 rounded">
                      ✓ Struk Terlampir
                    </span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => strukInputRef.current?.click()}
                    className="w-full h-28 rounded-xl border border-dashed border-slate-700 bg-slate-900/60 hover:bg-slate-800/80 flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:text-white transition-all text-center p-2"
                  >
                    <Camera size={20} className="text-amber-400" />
                    <span className="text-[11px] font-semibold">Foto / Unggah Struk</span>
                    <span className="text-[9.5px] text-slate-500">Kamera HP atau Galeri</span>
                  </button>
                )}
              </div>

              {/* Foto Spidometer */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-300">
                  🚗 Foto Spidometer Randis:
                </label>
                <input
                  type="file"
                  ref={spidometerInputRef}
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => handleFileChange(e, setSpidometerPhoto, false)}
                  className="hidden"
                />
                {spidometerPhoto ? (
                  <div className="relative rounded-xl overflow-hidden border border-emerald-500/40 bg-slate-900 h-28 flex items-center justify-center">
                    <img src={spidometerPhoto} alt="Spidometer" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setSpidometerPhoto(null)}
                      className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/70 text-white hover:bg-red-600 transition-colors"
                      title="Hapus foto"
                    >
                      <X size={14} />
                    </button>
                    <span className="absolute bottom-1 left-2 text-[9px] font-bold text-emerald-400 bg-black/80 px-1.5 py-0.5 rounded">
                      ✓ Spidometer Terlampir
                    </span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => spidometerInputRef.current?.click()}
                    className="w-full h-28 rounded-xl border border-dashed border-slate-700 bg-slate-900/60 hover:bg-slate-800/80 flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:text-white transition-all text-center p-2"
                  >
                    <Gauge size={20} className="text-sky-400" />
                    <span className="text-[11px] font-semibold">Foto Spidometer</span>
                    <span className="text-[9.5px] text-slate-500">Angka KM Odometer</span>
                  </button>
                )}
              </div>
            </div>

            {/* AI Receipt Scanner Trigger Button */}
            {strukPhoto && (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleScanReceipt}
                  disabled={isScanning}
                  className="w-full py-2.5 px-3 rounded-xl border border-amber-500/50 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-200 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50"
                >
                  {isScanning ? (
                    <>
                      <Loader2 size={16} className="animate-spin text-amber-400" />
                      <span>Membaca Struk &amp; Tanggal dengan Gemini AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} className="text-amber-400 animate-pulse" />
                      <span>⚡ Pindai Otomatis dengan AI Vision (Tanggal &amp; Biaya)</span>
                    </>
                  )}
                </button>

                {scanNotice && (
                  <div
                    className={`p-2.5 rounded-xl border text-[11px] flex items-start gap-2 ${
                      scanNotice.type === 'success'
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                        : scanNotice.type === 'info'
                        ? 'bg-sky-500/15 border-sky-500/30 text-sky-300'
                        : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                    }`}
                  >
                    {scanNotice.type === 'success' ? (
                      <Check size={14} className="flex-shrink-0 text-emerald-400 mt-0.5" />
                    ) : scanNotice.type === 'info' ? (
                      <Sparkles size={14} className="flex-shrink-0 text-sky-400 mt-0.5" />
                    ) : (
                      <AlertCircle size={14} className="flex-shrink-0 text-rose-400 mt-0.5" />
                    )}
                    <span>{scanNotice.text}</span>
                  </div>
                )}
              </div>
            )}

            {/* Tanggal & Waktu Pembelian */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11.5px] font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Calendar size={13} className="text-amber-400" />
                  <span>Tanggal Pembelian BBM:</span>
                </label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-[11.5px] font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Clock size={13} className="text-amber-400" />
                  <span>Jam Transaksi:</span>
                </label>
                <input
                  type="time"
                  value={purchaseTime}
                  onChange={(e) => setPurchaseTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>
            </div>

            {/* Grid Jenis BBM & Odometer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11.5px] font-bold text-slate-300 mb-1">
                  Jenis Bahan Bakar:
                </label>
                <select
                  value={fuelType}
                  onChange={(e) => setFuelType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="Pertalite">Pertalite (RON 90)</option>
                  <option value="Pertamax">Pertamax (RON 92)</option>
                  <option value="Pertamax Turbo">Pertamax Turbo (RON 98)</option>
                  <option value="Biosolar">Biosolar B35 (Dinas)</option>
                  <option value="Dexlite">Dexlite (CN 51)</option>
                  <option value="Pertamina Dex">Pertamina Dex (CN 53)</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-[11.5px] font-bold text-slate-300 mb-1">
                  Angka Spidometer (KM):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={odometerKm}
                    onChange={(e) => setOdometerKm(e.target.value)}
                    placeholder="0.0"
                    className="w-full px-3 py-2 pl-9 rounded-xl text-xs bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
                    required
                  />
                  <Gauge size={15} className="absolute left-3 top-2.5 text-slate-400" />
                </div>
              </div>
            </div>

            {/* Grid Liter & Biaya Struk */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11.5px] font-bold text-slate-300 mb-1">
                  Jumlah Pengisian (Liter):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={liters}
                    onChange={(e) => setLiters(e.target.value)}
                    placeholder="Contoh: 15.00"
                    className="w-full px-3 py-2 pl-9 rounded-xl text-xs bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
                    required
                  />
                  <Fuel size={15} className="absolute left-3 top-2.5 text-amber-400" />
                </div>
              </div>

              <div>
                <label className="block text-[11.5px] font-bold text-slate-300 mb-1">
                  Total Biaya Struk (Rp):
                </label>
                <input
                  type="text"
                  value={costRupiah}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setCostRupiah(val ? Number(val).toLocaleString('id-ID') : '');
                  }}
                  placeholder="Contoh: 150.000"
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-900 border border-slate-700 text-amber-300 font-bold placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
                  required
                />
              </div>
            </div>

            {/* Grid Lokasi SPBU & No. Struk */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11.5px] font-bold text-slate-300 mb-1">
                  Lokasi / Nama SPBU:
                </label>
                <input
                  type="text"
                  value={spbuName}
                  onChange={(e) => setSpbuName(e.target.value)}
                  placeholder="Contoh: SPBU 44.511 Kajen"
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div>
                <label className="block text-[11.5px] font-bold text-slate-300 mb-1">
                  Nomor Struk Transaksi:
                </label>
                <input
                  type="text"
                  value={receiptNumber}
                  onChange={(e) => setReceiptNumber(e.target.value)}
                  placeholder="Contoh: TR-948103"
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11.5px] font-bold text-slate-300 mb-1">
                Catatan Petugas (Opsional):
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Pengisian BBM dinas setelah patroli respon cepat wilayah Kajen."
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-900 border border-slate-700 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Sticky Modal Footer - Always visible on top of bottom bar */}
          <div
            className="sticky bottom-0 z-20 px-4 py-3 sm:px-6 bg-[#151821]/95 backdrop-blur-md border-t border-slate-800 flex items-center gap-2.5 flex-shrink-0 shadow-2xl"
            style={{
              paddingBottom: 'max(14px, env(safe-area-inset-bottom, 14px))',
            }}
          >
            <button
              type="button"
              disabled={isSubmitting || isScanning}
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-bold text-xs bg-slate-800 text-slate-300 hover:bg-slate-700 active:scale-95 transition-all disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isScanning}
              className="flex-1 py-3 rounded-xl font-black text-xs text-slate-950 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-1.5 disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)',
              }}
            >
              {isSubmitting ? (
                <span>Mengirim Klaim...</span>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Ajukan ke Logistik</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
