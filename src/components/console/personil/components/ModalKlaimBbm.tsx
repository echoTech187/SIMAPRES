'use client';

import React, { useState, useRef, useMemo } from 'react';
import {
  X,
  Fuel,
  Camera,
  CheckCircle2,
  AlertCircle,
  FileText,
  Gauge,
  Sparkles,
  Loader2,
  Calendar,
  Clock,
  Check,
  ShieldCheck,
  ShieldAlert,
  Ban,
  Wallet,
  Ticket,
  Route,
  Car,
} from 'lucide-react';
import { submitFuelClaimAction } from '@/app/actions/master.actions';
import { scanReceiptSpbuAction, type ScannedReceiptData } from '@/app/actions/ocr-receipt.actions';
import { compressAndSanitizeImageClient } from '@/lib/client-image-compressor';
import { FundingSource, getDistanceFromLatLonInMeters, type OfficerProfile, type ComplaintData } from '../types';

interface ModalKlaimBbmProps {
  isOpen: boolean;
  onClose: () => void;
  officer: OfficerProfile;
  activeComplaint?: ComplaintData | null;
  complaints?: ComplaintData[];
  logbooks?: any[];
  currentOdometerKm?: string | number;
  onSuccess?: (msg: string) => void;
}

export default function ModalKlaimBbm({
  isOpen,
  onClose,
  officer,
  activeComplaint,
  complaints = [],
  logbooks = [],
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

  const [fundingSource, setFundingSource] = useState<FundingSource>(FundingSource.REIMBURSE);
  const [vehicleLambung, setVehicleLambung] = useState<string>(
    officer.kendaraan || 'R4-SAMAPTA-01'
  );
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

  // Status AI Scanner & Forensik Keaslian Struk
  const [isScanning, setIsScanning] = useState(false);
  const [authenticityData, setAuthenticityData] = useState<ScannedReceiptData | null>(null);
  const [scanNotice, setScanNotice] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const strukInputRef = useRef<HTMLInputElement>(null);
  const spidometerInputRef = useRef<HTMLInputElement>(null);

  // ============================================================================
  // KALKULASI ADIL: AKUMULASI KM GIAT HARI INI + ESTIMASI WAJAR LITER BBM
  // ============================================================================
  const dailyTelemetryStats = useMemo(() => {
    const todayStr = new Date().toDateString();
    let patrolCount = 0;
    let ticketCount = 0;
    let totalKm = 0;

    // 1. Hitung KM dari Giat Patroli/Sambang/Pengamanan Mandiri hari ini
    if (Array.isArray(logbooks)) {
      logbooks.forEach((l: any) => {
        const createdDate = l.createdAt || l.created_at ? new Date(l.createdAt || l.created_at).toDateString() : todayStr;
        if (createdDate !== todayStr) return;

        const desc = String(l.deskripsiKegiatan || l.activity_description || '');
        if (desc.startsWith('[KLAIM BBM')) return; // Abaikan log klaim BBM

        patrolCount++;
        const kmMatch = desc.match(/Total Jarak Tempuh:\s*([\d.]+)\s*KM/i);
        if (kmMatch && kmMatch[1]) {
          totalKm += parseFloat(kmMatch[1]) || 0;
        } else {
          const devMeters = Number(l.deviasiMeter || l.deviation_meters || 0);
          if (devMeters > 100) {
            totalKm += devMeters / 1000;
          } else {
            // Estimasi konservatif jika giat sedang berjalan / baru disahkan (rata-rata keliling beat 6 KM)
            totalKm += 6.0;
          }
        }
      });
    }

    // 2. Hitung KM dari Penanganan Tiket TKP (PP Mako <-> TKP * 1.3 faktor jalan berbelok)
    const makoLat = Number(officer.stationLat || -7.0246);
    const makoLng = Number(officer.stationLng || 109.5882);

    const processedTicketIds = new Set<string>();
    const allCandidateTickets = [
      ...(activeComplaint ? [activeComplaint] : []),
      ...(Array.isArray(complaints) ? complaints : []),
    ];

    allCandidateTickets.forEach((c: any) => {
      if (!c || processedTicketIds.has(String(c.id))) return;
      const disps = Array.isArray(c.dispatches) ? c.dispatches : [];
      const normNrp = String(officer.nrp || '').trim();
      const involved = disps.some((d: any) => {
        const pNrps = String(d.crew_partner_nrp || '').split('|').map((s) => s.trim());
        return (
          String(d.officer_id) === String(officer.id) ||
          d.officer?.nrp === normNrp ||
          d.crew_leader_nrp === normNrp ||
          pNrps.includes(normNrp)
        );
      });

      if (!involved && (!activeComplaint || String(activeComplaint.id) !== String(c.id))) return;
      processedTicketIds.add(String(c.id));
      ticketCount++;

      const dispWithKm = disps.find((d: any) => d.round_trip_km && Number(d.round_trip_km) > 0);
      if (dispWithKm) {
        totalKm += Number(dispWithKm.round_trip_km);
      } else if (c.tkpLatitude && c.tkpLongitude) {
        const oneWayMeters = getDistanceFromLatLonInMeters(
          makoLat,
          makoLng,
          Number(c.tkpLatitude),
          Number(c.tkpLongitude)
        );
        if (oneWayMeters < 100000) {
          const roundTripRoadKm = (oneWayMeters / 1000) * 2 * 1.3;
          totalKm += Math.max(roundTripRoadKm, 4.0);
        } else {
          totalKm += 8.0;
        }
      } else {
        totalKm += 8.0;
      }
    });

    // Tambahkan odometer aktif saat ini jika belum masuk ke logbook
    const activeOdo = parseFloat(String(currentOdometerKm || 0));
    if (activeOdo > 0 && totalKm === 0) {
      totalKm += activeOdo;
    }

    // Jika personil baru mulai piket tapi belum ada KM tercatat, beri baseline keliling pos 5 KM
    const effectiveKm = Number(Math.max(totalKm, patrolCount + ticketCount > 0 ? totalKm : 5.0).toFixed(1));

    const isRoda2 = vehicleLambung.toUpperCase().startsWith('R2');
    const ratioKmPerLiter = isRoda2 ? 32 : 8.5; // R2: 32 km/L, R4: 8.5 km/L
    const idleAllowanceLiters = (patrolCount + ticketCount) * (isRoda2 ? 0.2 : 0.6); // Toleransi mesin menyala / rotator di TKP
    const fairLiters = Number(
      Math.max(isRoda2 ? 1.5 : 3.5, effectiveKm / ratioKmPerLiter + idleAllowanceLiters).toFixed(1)
    );

    return {
      patrolCount,
      ticketCount,
      effectiveKm,
      isRoda2,
      ratioKmPerLiter,
      fairLiters,
    };
  }, [logbooks, complaints, activeComplaint, officer, currentOdometerKm, vehicleLambung]);

  if (!isOpen) return null;

  // Evaluasi apakah struk terindikasi penipuan / rekayasa / bukan struk fisik sah
  const isFraudDetected = Boolean(
    authenticityData &&
      (authenticityData.isValidSpbuReceipt === false ||
        authenticityData.authenticityStatus === 'REKAYASA_DIGITAL' ||
        authenticityData.authenticityStatus === 'BUKAN_STRUK_SPBU' ||
        authenticityData.isScreenPhoto === true ||
        (authenticityData.authenticityScore !== undefined && authenticityData.authenticityScore < 60))
  );

  const numLitersInput = parseFloat(liters) || 0;
  const maxGreenLaneLiters = Number(Math.max(dailyTelemetryStats.fairLiters * 1.25, 3.0).toFixed(1));
  const isOverFairQuota = numLitersInput > maxGreenLaneLiters;

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string | null) => void,
    isReceipt: boolean = false
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await compressAndSanitizeImageClient(file, {
        maxDimension: 1080,
        quality: 0.75,
        maxSizeKB: 450,
      });

      if (!result.success || !result.dataUrl) {
        setErrorMsg(result.error || 'Berkas foto tidak lolos verifikasi keamanan.');
        return;
      }

      setErrorMsg(null);
      setter(result.dataUrl);

      if (isReceipt) {
        setAuthenticityData(null);
        setScanNotice({
          type: 'info',
          text: `Foto struk lolos verifikasi integritas & terkompresi (${result.sizeKB} KB). Klik tombol "Pindai & Audit Keaslian Struk" untuk analisis forensik fisik.`,
        });
      }
    } catch (err: any) {
      setErrorMsg('Gagal memproses gambar: ' + (err?.message || 'Format tidak didukung.'));
    }
  };

  /**
   * Eksekusi Pemindaian & Audit Forensik Keaslian Struk SPBU dengan AI Vision
   */
  const handleScanReceipt = async () => {
    if (!strukPhoto) {
      setErrorMsg('Silakan unggah atau foto struk SPBU terlebih dahulu.');
      return;
    }

    setIsScanning(true);
    setErrorMsg(null);
    setScanNotice(null);
    setAuthenticityData(null);

    try {
      const res = await scanReceiptSpbuAction(strukPhoto);
      if (res.success && res.data) {
        const d: ScannedReceiptData = res.data;
        setAuthenticityData(d);
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

        const isFraud =
          d.isValidSpbuReceipt === false ||
          d.authenticityStatus === 'REKAYASA_DIGITAL' ||
          d.authenticityStatus === 'BUKAN_STRUK_SPBU' ||
          d.isScreenPhoto === true ||
          (d.authenticityScore !== undefined && d.authenticityScore < 60);

        if (isFraud) {
          setErrorMsg(
            `⛔ Audit AI Mendeteksi Kejanggalan: ${
              d.authenticityStatus === 'REKAYASA_DIGITAL' || d.isScreenPhoto
                ? 'Foto terdeteksi sebagai rekayasa digital atau foto dari layar monitor/HP lain.'
                : d.authenticityStatus === 'BUKAN_STRUK_SPBU'
                ? 'Gambar bukan struk resmi pembelian bahan bakar SPBU.'
                : 'Struk tidak memenuhi standar validitas fisik asli.'
            } Pengajuan klaim dikunci untuk mencegah penyalahgunaan anggaran DIPA.`
          );
        } else {
          setScanNotice({
            type: 'success',
            text: `Audit AI Berhasil! Struk Terverifikasi Asli Fisik [${scannedItems.join(' • ')}].`,
          });
        }
      } else {
        setScanNotice({
          type: 'error',
          text: (!res.success ? res.error : '') || 'Gagal mengenali teks struk SPBU. Anda dapat mengisi form secara manual.',
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

    if (isFraudDetected) {
      setErrorMsg(
        `⛔ Pengajuan Klaim Ditolak: ${
          authenticityData?.authenticityStatus === 'REKAYASA_DIGITAL' || authenticityData?.isScreenPhoto
            ? 'Struk terdeteksi sebagai rekayasa digital atau foto dari layar HP/monitor.'
            : authenticityData?.authenticityStatus === 'BUKAN_STRUK_SPBU'
            ? 'Berkas foto bukan struk resmi pengisian BBM SPBU.'
            : 'Struk terindikasi tidak valid oleh sistem audit AI.'
        } Harap foto ulang lembaran fisik struk asli SPBU sebelum mengajukan.`
      );
      return;
    }

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

    if (!receiptNumber.trim() || receiptNumber.trim().length < 3) {
      setErrorMsg('Nomor Struk / Nota Transaksi SPBU wajib diisi (minimal 3 karakter) untuk verifikasi Anti-Double Struk.');
      return;
    }

    if (isOverFairQuota && !notes.trim()) {
      setErrorMsg(
        `Jumlah pengisian (${numLiters} L) melebihi kuota wajar akumulasi KM hari ini (${maxGreenLaneLiters} L). Mohon isi alasan di kolom Catatan Petugas (misal: "Pengisian Full Tank untuk stok piket besok").`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const auditTag = authenticityData
        ? `[Audit AI: ${authenticityData.authenticityStatus || 'VALID'} (${authenticityData.authenticityScore ?? 95}%)] `
        : '';
      const finalNotes = `${auditTag}${notes.trim()}`.trim();

      const res = await submitFuelClaimAction({
        complaintId: activeComplaint?.id,
        officerId: officer.id,
        odometerKm: isNaN(numOdo) ? dailyTelemetryStats.effectiveKm : numOdo,
        liters: numLiters,
        costRupiah: numCost,
        spbuName: spbuName.trim(),
        receiptNumber: receiptNumber.trim(),
        purchaseDate: purchaseDate.trim() || undefined,
        purchaseTime: purchaseTime.trim() || undefined,
        fuelType: fuelType.trim() || undefined,
        fundingSource: fundingSource,
        vehicleLambung: vehicleLambung.trim(),
        accumulatedDailyKm: dailyTelemetryStats.effectiveKm,
        estimatedFairLiters: dailyTelemetryStats.fairLiters,
        strukPhotoUrl: strukPhoto || undefined,
        spidometerPhotoUrl: spidometerPhoto || undefined,
        notes: finalNotes || undefined,
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
        className="relative w-full h-[100dvh] sm:h-auto max-w-none sm:max-w-xl min-h-[100dvh] sm:min-h-0 sm:max-h-[92vh] rounded-none sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl text-slate-100 border-0 sm:border border-amber-500/40 animate-in zoom-in-95 duration-200"
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
                <h3 className="text-sm font-black text-white">Klaim BBM &amp; Pertanggungjawaban SPBU</h3>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-1">
                Personel: {officer.fullName} • {officer.stationName || 'Polres Pekalongan'}
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
                <span className="leading-relaxed">{errorMsg}</span>
              </div>
            )}

            {/* PILAR 1: KARTU AKUMULASI KM GIAT HARI INI & KUOTA WAJAR BBM */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-[#0B0E17] to-sky-500/10 border border-amber-500/30 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <Route size={14} className="text-amber-400" />
                  <span>Kalkulasi Hak BBM Giat Hari Ini (GPS + Idle TKP)</span>
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  Rasio ~{dailyTelemetryStats.ratioKmPerLiter} KM/L
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-0.5">
                <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-center">
                  <div className="text-[10px] text-slate-400">Total Giat</div>
                  <div className="text-sm font-black text-white mt-0.5">
                    {dailyTelemetryStats.patrolCount + dailyTelemetryStats.ticketCount} Giat
                  </div>
                  <div className="text-[9.5px] text-slate-400">
                    {dailyTelemetryStats.patrolCount} Patroli • {dailyTelemetryStats.ticketCount} TPTKP
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-center">
                  <div className="text-[10px] text-slate-400">Akumulasi Jarak</div>
                  <div className="text-sm font-black text-sky-300 font-mono mt-0.5">
                    {dailyTelemetryStats.effectiveKm} KM
                  </div>
                  <div className="text-[9.5px] text-slate-400">Termasuk kelokan 1.3x</div>
                </div>

                <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-center">
                  <div className="text-[10px] text-amber-200 font-semibold">Plafon Jalur Hijau</div>
                  <div className="text-sm font-black text-amber-300 font-mono mt-0.5">
                    s/d {maxGreenLaneLiters} L
                  </div>
                  <div className="text-[9.5px] text-amber-200/80">Auto-Approve Baglog</div>
                </div>
              </div>

              {numLitersInput > 0 && (
                <div
                  className={`px-3 py-2 rounded-xl text-[11px] flex items-center justify-between border ${
                    !isOverFairQuota
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-200'
                      : 'bg-amber-500/15 border-amber-500/40 text-amber-200'
                  }`}
                >
                  <span>
                    {!isOverFairQuota
                      ? `🟢 Jalur Hijau: Klaim ${numLitersInput} L sesuai akumulasi giat (Otomatis Disetujui tanpa antre Pawas).`
                      : `🟡 Jalur Kuning: Klaim ${numLitersInput} L melebihi estimasi giat (${maxGreenLaneLiters} L). Wajib isi alasan di Catatan untuk diverifikasi Pawas/Baglog.`}
                  </span>
                </div>
              )}
            </div>

            {/* PILAR 2: PEMBEDAAN REIMBURSE DANA PRIBADI VS LPJ KUPON BBM DINAS */}
            <div className="space-y-1.5">
              <label className="block text-[11.5px] font-bold text-slate-300">
                💳 Pilih Skema Sumber Dana Pengisian BBM:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setFundingSource(FundingSource.REIMBURSE)}
                  className={`p-3 rounded-2xl border text-left transition-all flex items-start gap-2.5 ${
                    fundingSource === FundingSource.REIMBURSE
                      ? 'bg-amber-500/20 border-amber-400 text-white shadow-md shadow-amber-500/10'
                      : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      fundingSource === FundingSource.REIMBURSE
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <Wallet size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-black flex items-center gap-1.5">
                      <span>Reimburse Uang Pribadi</span>
                    </div>
                    <p className="text-[10px] leading-snug text-slate-400 mt-0.5">
                      Personil talangi dulu di SPBU, diganti/dicairkan oleh Sikeu / Baglog.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFundingSource(FundingSource.KUPON)}
                  className={`p-3 rounded-2xl border text-left transition-all flex items-start gap-2.5 ${
                    fundingSource === FundingSource.KUPON
                      ? 'bg-sky-500/20 border-sky-400 text-white shadow-md shadow-sky-500/10'
                      : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      fundingSource === FundingSource.KUPON
                        ? 'bg-sky-400 text-slate-950'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <Ticket size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-black flex items-center gap-1.5">
                      <span>Kupon / Ranjen BBM Dinas</span>
                    </div>
                    <p className="text-[10px] leading-snug text-slate-400 mt-0.5">
                      Pakai voucher/kupon SPBU rekanan Polres (Setor struk sebagai LPJ).
                    </p>
                  </div>
                </button>
              </div>
            </div>

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
                        setAuthenticityData(null);
                        setErrorMsg(null);
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
                      <span>Memverifikasi Keaslian Struk dengan Gemini AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} className="text-amber-400 animate-pulse" />
                      <span>⚡ Pindai &amp; Audit Keaslian Struk (AI Forensik)</span>
                    </>
                  )}
                </button>

                {/* Kartu Hasil Evaluasi Keaslian Struk BBM (Anti-Fraud) */}
                {authenticityData && (
                  <div
                    className={`p-3 rounded-2xl border text-xs flex items-start gap-2.5 animate-in fade-in zoom-in-95 duration-200 ${
                      !isFraudDetected
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                        : authenticityData.authenticityStatus === 'REKAYASA_DIGITAL' || authenticityData.isScreenPhoto
                        ? 'bg-rose-500/15 border-rose-500/40 text-rose-200'
                        : authenticityData.authenticityStatus === 'BUKAN_STRUK_SPBU'
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-200'
                        : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-200'
                    }`}
                  >
                    {!isFraudDetected ? (
                      <ShieldCheck size={20} className="text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <ShieldAlert size={20} className="text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-black text-[12px] flex items-center gap-1.5">
                          {!isFraudDetected && (
                            <span className="text-emerald-300">🛡️ Struk Terverifikasi Asli Fisik</span>
                          )}
                          {authenticityData.authenticityStatus === 'REKAYASA_DIGITAL' && (
                            <span className="text-rose-300">🚨 Terindikasi Rekayasa / Foto Layar</span>
                          )}
                          {authenticityData.authenticityStatus === 'BUKAN_STRUK_SPBU' && (
                            <span className="text-amber-300">⚠️ Gambar Bukan Struk SPBU</span>
                          )}
                          {authenticityData.authenticityStatus === 'MERAGUKAN' && (
                            <span className="text-yellow-300">⚠️ Kualitas Struk Meragukan</span>
                          )}
                        </span>
                        <span
                          className={`text-[9.5px] font-mono font-black px-2 py-0.5 rounded-full border ${
                            !isFraudDetected
                              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                              : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                          }`}
                        >
                          Skor: {authenticityData.authenticityScore ?? 90}%
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed opacity-90">
                        {authenticityData.authenticityReason ||
                          'Struk fisik terverifikasi dengan detail pencetakan kertas thermal resmi.'}
                      </p>
                    </div>
                  </div>
                )}

                {scanNotice && !authenticityData && (
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

            {/* Tanggal, Waktu & Nomor Lambung Randis */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-[11.5px] font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Car size={13} className="text-emerald-400" />
                  <span>No. Lambung Randis:</span>
                </label>
                <input
                  type="text"
                  value={vehicleLambung}
                  onChange={(e) => setVehicleLambung(e.target.value)}
                  placeholder="R4-SAMAPTA-01"
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div>
                <label className="block text-[11.5px] font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Calendar size={13} className="text-amber-400" />
                  <span>Tanggal Struk:</span>
                </label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-400 font-mono"
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
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-400 font-mono"
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
                  Jumlah Pengisian (Liter) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={liters}
                    onChange={(e) => setLiters(e.target.value)}
                    placeholder={`Wajar s/d ${maxGreenLaneLiters} L`}
                    className="w-full px-3 py-2 pl-9 rounded-xl text-xs bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
                    required
                  />
                  <Fuel size={15} className="absolute left-3 top-2.5 text-amber-400" />
                </div>
              </div>

              <div>
                <label className="block text-[11.5px] font-bold text-slate-300 mb-1">
                  Total Biaya Struk (Rp) *
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

            {/* PILAR 3: Grid Lokasi SPBU & No. Struk Wajib (Anti-Double Claim) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11.5px] font-bold text-slate-300 mb-1">
                  Lokasi / Nama SPBU *
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
                <label className="block text-[11.5px] font-bold text-amber-300 mb-1 flex items-center justify-between">
                  <span>No. Struk / Nota SPBU *</span>
                  <span className="text-[9.5px] text-emerald-400 font-mono">Anti-Duplikat</span>
                </label>
                <input
                  type="text"
                  value={receiptNumber}
                  onChange={(e) => setReceiptNumber(e.target.value)}
                  placeholder="Wajib diisi (mis: TR-948103)"
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-900 border border-amber-500/40 text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11.5px] font-bold text-slate-300 mb-1">
                Catatan Petugas {isOverFairQuota ? <span className="text-amber-400">* (Wajib karena melebihi plafon harian)</span> : '(Opsional)'}:
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  isOverFairQuota
                    ? 'Jelaskan alasan pengisian melebihi kuota harian (mis: Sekalian isi Full Tank untuk cadangan regu piket besok)...'
                    : 'Contoh: Pengisian BBM dinas setelah patroli respon cepat wilayah Kajen.'
                }
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-900 border border-slate-700 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                required={isOverFairQuota}
              />
            </div>
          </div>

          {/* Sticky Modal Footer */}
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
              disabled={isSubmitting || isScanning || isFraudDetected}
              className={`flex-1 py-3 rounded-xl font-black text-xs active:scale-95 transition-all shadow-lg flex items-center justify-center gap-1.5 disabled:opacity-50 ${
                isFraudDetected
                  ? 'bg-rose-900/60 text-rose-200 border border-rose-500/50 cursor-not-allowed'
                  : 'text-slate-950'
              }`}
              style={
                isFraudDetected
                  ? {}
                  : {
                      background:
                        fundingSource === FundingSource.KUPON
                          ? 'linear-gradient(135deg, #38BDF8 0%, #0284C7 100%)'
                          : 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                      boxShadow:
                        fundingSource === FundingSource.KUPON
                          ? '0 4px 14px rgba(56, 189, 248, 0.35)'
                          : '0 4px 14px rgba(245, 158, 11, 0.35)',
                    }
              }
            >
              {isSubmitting ? (
                <span>Memproses...</span>
              ) : isFraudDetected ? (
                <>
                  <Ban size={16} className="text-rose-300" />
                  <span>Struk Tidak Valid</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>
                    {fundingSource === FundingSource.KUPON
                      ? 'Ajukan Kupon BBM'
                      : 'Ajukan Reimburse BBM'}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
