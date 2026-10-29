'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  Clock,
  User,
  FileText,
  Send,
  Car,
  Users,
  Shield,
  Sparkles,
  Search,
  Check,
  Plus,
  Loader2,
  UserPlus,
} from 'lucide-react';
import type { OfficerProfile } from '../types';
import TacticalAlert from '@/components/ui/TacticalAlert';
import Select2CustomDropdown, { Select2Option } from '@/components/ui/Select2CustomDropdown';
import { getMasterVehiclesAction } from '@/app/actions/master.actions';
import { getAvailableStationOfficersAction } from '@/app/actions/complaint.actions';

export interface SelectedCrewPartner {
  id?: string;
  name: string;
  nrp?: string;
  pangkat?: string;
  isManual?: boolean;
}

export type QuickActionType = 'PATROLI' | 'TPTKP' | 'SAMBANG' | 'PENGAMANAN';

export interface PengajuanGiatData {
  type: QuickActionType;
  lokasiSasaran: string;
  jamMulai: string;
  jamSelesai: string;
  armada: string;
  rekanRegu: string;
  uraianRencana: string;
}

interface ModalAksiCepatProps {
  isOpen: boolean;
  type: QuickActionType | null;
  officer: OfficerProfile;
  currentGps: { lat: number; lng: number };
  fleetUnits?: any[];
  onClose: () => void;
  onSubmit: (data: PengajuanGiatData) => Promise<{ success: boolean; error?: string }>;
}

const ACTION_CONFIG: Record<
  QuickActionType,
  {
    icon: string;
    title: string;
    subtitle: string;
    colorClass: string;
    borderClass: string;
    bgBadgeClass: string;
    textColorClass: string;
    defaultArmadaSuggestion: string;
    presets: string[];
  }
> = {
  PATROLI: {
    icon: '🚔',
    title: 'PENGAJUAN GIAT PATROLI',
    subtitle: 'Rencana Blue Light Beat & Pemantauan Wilayah',
    colorClass: 'from-blue-600 to-indigo-700',
    borderClass: 'border-blue-500/40',
    bgBadgeClass: 'bg-blue-500/15 border-blue-500/30 text-blue-300',
    textColorClass: 'text-blue-400',
    defaultArmadaSuggestion: 'R4-SAMAPTA-01',
    presets: [
      'Patroli dialogis pemukiman dan sentra pertokoan antisipasi 3C',
      'Blue light beat pemantauan jalur arteri & pencegahan balap liar',
      'Patroli stasioner di simpul rawan kamtibmas & objek vital',
      'Pemeriksaan kesiapsiagaan pos ronda / pos kamling malam warga',
    ],
  },
  TPTKP: {
    icon: '🛡️',
    title: 'PENGAJUAN TINDAKAN PERTAMA DI TKP (TPTKP)',
    subtitle: 'Respon Cepat Status Quo & Penanganan Awal TKP',
    colorClass: 'from-red-600 to-rose-700',
    borderClass: 'border-red-500/40',
    bgBadgeClass: 'bg-red-500/15 border-red-500/30 text-red-300',
    textColorClass: 'text-red-400',
    defaultArmadaSuggestion: 'R4-SAMAPTA-01',
    presets: [
      'Mendatangi lokasi kejadian untuk pengamanan status quo TKP',
      'Pemasangan garis polisi (Police Line) & pencatatan saksi awal',
      'Penanganan mediasi awal keributan warga di lokasi kejadian',
      'Evakuasi korban dan pengamanan barang bukti sementara',
    ],
  },
  SAMBANG: {
    icon: '🤝',
    title: 'PENGAJUAN GIAT SAMBANG KAMTIBMAS',
    subtitle: 'Kemitraan Polisi & Masyarakat Presisi',
    colorClass: 'from-emerald-600 to-teal-700',
    borderClass: 'border-emerald-500/40',
    bgBadgeClass: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
    textColorClass: 'text-emerald-400',
    defaultArmadaSuggestion: 'R2-BHABINKAMTIBMAS-05',
    presets: [
      'Sambang silaturahmi dengan tokoh agama & tokoh masyarakat',
      'Koordinasi kamtibmas bersama perangkat desa dan ketua RT/RW',
      'Sosialisasi layanan call center darurat Polri 110 bebas pulsa',
      'Menyerap aspirasi warga terkait potensi kerawanan lingkungan',
    ],
  },
  PENGAMANAN: {
    icon: '⚠️',
    title: 'PENGAJUAN GIAT PENGAMANAN & PENJAGAAN',
    subtitle: 'Penjagaan Arus Lalin, Jalur & Titik Keramaian',
    colorClass: 'from-amber-600 to-yellow-700',
    borderClass: 'border-amber-500/40',
    bgBadgeClass: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
    textColorClass: 'text-amber-400',
    defaultArmadaSuggestion: 'R4-LANTAS-PJR',
    presets: [
      'Pengaturan arus lalu lintas di simpul titik rawan kepadatan',
      'Pengamanan kegiatan ibadah & acara keramaian masyarakat',
      'Penjagaan simpul persimpangan jalan dan penyeberangan warga',
      'Sterilisasi dan pengawasan jalur rawan laka lantas',
    ],
  },
};

export default function ModalAksiCepat({
  isOpen,
  type,
  officer,
  currentGps,
  fleetUnits,
  onClose,
  onSubmit,
}: ModalAksiCepatProps) {
  const [lokasiSasaran, setLokasiSasaran] = useState('');
  const [jamMulai, setJamMulai] = useState('');
  const [jamSelesai, setJamSelesai] = useState('');
  const [armada, setArmada] = useState('');
  const [uraianRencana, setUraianRencana] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 1. Data armada kendaraan 100% murni dari database tabel patrolVehicle (No hardcoded mock)
  const [dbVehicles, setDbVehicles] = useState<any[]>([]);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false);

  // 2. Data rekan regu multi-select (konsep identik seperti ModalTambahRekanRegu saat menyetujui tiket)
  const [selectedPartners, setSelectedPartners] = useState<SelectedCrewPartner[]>([]);
  const [availableOfficers, setAvailableOfficers] = useState<any[]>([]);
  const [isLoadingOfficers, setIsLoadingOfficers] = useState(false);
  const [officerSearchQuery, setOfficerSearchQuery] = useState('');
  const [showPartnerPicker, setShowPartnerPicker] = useState(false);
  const [manualPartnerName, setManualPartnerName] = useState('');
  const [manualPartnerNrp, setManualPartnerNrp] = useState('');

  // Ambil data master armada patroli riil langsung dari database sesuai Mako personil
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    setIsLoadingVehicles(true);
    const userStationId = officer.stationId || (officer as any).station_id || undefined;
    getMasterVehiclesAction({ stationId: userStationId })
      .then((res) => {
        if (isMounted) {
          if (res?.success && Array.isArray(res.data)) {
            // Filter ketat: Hanya armada yang station_id-nya sama dengan Mako personel, atau armada umum induk Polres (null)
            const filtered = res.data.filter((v: any) => {
              if (!userStationId) return true;
              return v.station_id == null || Number(v.station_id) === Number(userStationId);
            });
            // Prioritaskan armada khusus Mako terlebih dahulu di atas armada umum
            filtered.sort((a: any, b: any) => {
              const aStation = userStationId && Number(a.station_id) === Number(userStationId) ? 1 : 0;
              const bStation = userStationId && Number(b.station_id) === Number(userStationId) ? 1 : 0;
              return bStation - aStation;
            });
            setDbVehicles(filtered);
          }
          setIsLoadingVehicles(false);
        }
      })
      .catch((err) => {
        console.warn('Gagal memuat master armada dari database:', err);
        if (isMounted) setIsLoadingVehicles(false);
      });
    return () => {
      isMounted = false;
    };
  }, [isOpen, officer.stationId]);

  // Susun daftar pilihan armada kendaraan murni dari database tabel patrolVehicle
  const fleetOptions: Select2Option[] = React.useMemo(() => {
    const mapped: Select2Option[] = dbVehicles.map((v) => {
      const lambung = v.nomor_lambung || `ARMADA-${v.id}`;
      const nama = v.nama_armada || 'Kendaraan Dinas Presisi';
      const jenis = v.jenis_kendaraan ? v.jenis_kendaraan.replace(/_/g, ' ') : 'Ranmor Dinas';
      const plat = v.plat_nomor_polisi ? ` • Plat: ${v.plat_nomor_polisi}` : '';
      const status = v.status_operasional || 'SIAGA';

      let badge = 'R4';
      let badgeColor = status === 'SIAGA' ? '#10B981' : '#3B82F6';
      if (v.jenis_kendaraan === 'RODA_2') badge = 'R2';
      else if (v.jenis_kendaraan === 'MINIBUS') badge = 'R4+';

      const makoTag = v.station?.station_name ? ` • ${v.station.station_name}` : (v.station_id == null ? ' • Mako Induk' : '');

      return {
        value: lambung,
        label: `${lambung} • ${nama}`,
        sublabel: `${jenis}${plat}${makoTag} • Status: ${status}`,
        badge,
        badgeColor,
      };
    });

    // Jika kendaraan yang ditugaskan ke personil belum ada dalam database, sertakan
    if (officer.kendaraan && !mapped.some((opt) => opt.value === officer.kendaraan)) {
      mapped.unshift({
        value: officer.kendaraan,
        label: `${officer.kendaraan} • Kendaraan Dinas Personel`,
        sublabel: 'Kendaraan dinas yang terdaftar pada profil Anda',
        badge: officer.kendaraan.startsWith('R2') ? 'R2' : 'R4',
        badgeColor: '#10B981',
      });
    }

    // Opsi resmi jika personil berpatroli tanpa ranmor dinas
    return [
      ...mapped,
      {
        value: 'JALAN_KAKI',
        label: '🚶 Patroli Dialogis Jalan Kaki / Posko Pantau',
        sublabel: 'Giat dialogis / pemantauan pos tanpa sarana kendaraan dinas',
        badge: 'JALAN KAKI',
        badgeColor: '#64748B',
      },
    ];
  }, [dbVehicles, officer.kendaraan]);

  // Muat daftar personil dinas dari database stasiun Mako yang sama (seperti di ModalTambahRekanRegu)
  useEffect(() => {
    if (!isOpen) return;
    const userStationId = officer.stationId || (officer as any).station_id || 60001;
    let isCancelled = false;

    setIsLoadingOfficers(true);
    getAvailableStationOfficersAction(userStationId)
      .then((res) => {
        if (isCancelled) return;
        let officers: any[] = [];
        if (res?.success && Array.isArray(res.data)) {
          officers = [...res.data];
        }

        // Gabungkan juga dari fleetUnits HANYA personil yang berada di Mako yang sama
        if (Array.isArray(fleetUnits) && fleetUnits.length > 0) {
          fleetUnits.forEach((fu: any) => {
            const isSameStation = userStationId
              ? fu.stationId != null && Number(fu.stationId) === Number(userStationId)
              : true;

            if (isSameStation && fu.nrp && !officers.some((o) => o.nrp === fu.nrp)) {
              officers.push({
                id: fu.officerId || fu.id || `fu_${fu.nrp}`,
                full_name: fu.namaLengkap || fu.title,
                name: fu.namaLengkap || fu.title,
                pangkat: fu.pangkat,
                rank: fu.pangkat,
                nrp: fu.nrp,
                unit: fu.satuan,
              });
            }
          });
        }

        // Filter agar personil yang sedang login tidak memilih dirinya sendiri
        const filtered = officers.filter(
          (o) => String(o.id) !== String(officer.id) && String(o.nrp) !== String(officer.nrp)
        );

        setAvailableOfficers(filtered);
        setIsLoadingOfficers(false);
      })
      .catch((err) => {
        if (!isCancelled) {
          console.warn('Gagal memuat personil dinas:', err);
          setIsLoadingOfficers(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [isOpen, officer.stationId, officer.id, officer.nrp, fleetUnits]);

  // Filter daftar personil sesuai pencarian (nama, pangkat, nrp)
  const filteredAvailableOfficers = React.useMemo(() => {
    const q = officerSearchQuery.toLowerCase().trim();
    if (!q) return availableOfficers;
    return availableOfficers.filter((o) => {
      const name = (o.full_name || o.name || '').toLowerCase();
      const nrp = (o.nrp || '').toLowerCase();
      const rank = (o.pangkat || o.rank || '').toLowerCase();
      return name.includes(q) || nrp.includes(q) || rank.includes(q);
    });
  }, [availableOfficers, officerSearchQuery]);

  // Toggle selection personil dari daftar (seperti di ModalTambahRekanRegu)
  const togglePartner = (off: any) => {
    const offId = String(off.id);
    const exists = selectedPartners.some(
      (p) => (p.id && p.id === offId) || (p.nrp && off.nrp && p.nrp === off.nrp)
    );

    if (exists) {
      setSelectedPartners((prev) =>
        prev.filter((p) => !(p.id === offId || (p.nrp && off.nrp && p.nrp === off.nrp)))
      );
    } else {
      setSelectedPartners((prev) => [
        ...prev,
        {
          id: offId,
          name: off.full_name || off.name || '',
          nrp: off.nrp || '',
          pangkat: off.pangkat || off.rank || '',
          isManual: false,
        },
      ]);
    }
    if (errorMsg) setErrorMsg(null);
  };

  const removePartner = (identifier: string) => {
    setSelectedPartners((prev) =>
      prev.filter((p) => p.id !== identifier && p.name !== identifier && p.nrp !== identifier)
    );
  };

  const handleAddManualPartner = () => {
    const name = manualPartnerName.trim();
    if (!name) return;
    const nrp = manualPartnerNrp.trim();

    if (selectedPartners.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
      return;
    }

    setSelectedPartners((prev) => [
      ...prev,
      {
        id: `manual_${Date.now()}`,
        name,
        nrp: nrp || undefined,
        isManual: true,
      },
    ]);
    setManualPartnerName('');
    setManualPartnerNrp('');
  };

  // Inisialisasi data form saat modal dibuka
  useEffect(() => {
    if (isOpen && type) {
      const now = new Date();
      const formatTime = (d: Date) =>
        `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      
      const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);

      setLokasiSasaran(officer.stationName ? `Wilayah ${officer.stationName}` : 'Wilayah Hukum Polres Pekalongan');
      setJamMulai(formatTime(now));
      setJamSelesai(formatTime(twoHoursLater));
      setArmada(officer.kendaraan || '');
      setSelectedPartners([]);
      setShowPartnerPicker(false);
      setOfficerSearchQuery('');
      setManualPartnerName('');
      setManualPartnerNrp('');
      setUraianRencana(`Rencana pelaksanaan giat ${type} dalam rangka pemantauan kamtibmas dan pelayanan masyarakat presisi.`);
      setErrorMsg(null);
      setIsSubmitting(false);
    }
  }, [isOpen, type, officer.kendaraan, officer.stationName]);

  // Otomatis pasangkan armada jika database telah selesai dimuat dan belum dipilih
  useEffect(() => {
    if (isOpen && dbVehicles.length > 0 && !armada) {
      const matched = officer.kendaraan
        ? dbVehicles.find((v) => v.nomor_lambung === officer.kendaraan)
        : null;
      setArmada(matched?.nomor_lambung || dbVehicles[0].nomor_lambung || 'JALAN_KAKI');
    }
  }, [isOpen, dbVehicles, officer.kendaraan, armada]);

  if (!isOpen || !type) return null;

  const config = ACTION_CONFIG[type];

  const handleApplyPreset = (presetText: string) => {
    setUraianRencana((prev) => {
      const clean = prev.trim();
      if (!clean) return presetText;
      if (clean.includes(presetText)) return prev;
      return `${clean}. ${presetText}`;
    });
    if (errorMsg) setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!lokasiSasaran.trim()) {
      setErrorMsg('Rencana lokasi / rute sasaran giat wajib diisi!');
      return;
    }
    if (!jamMulai || !jamSelesai) {
      setErrorMsg('Estimasi jam mulai dan jam selesai pelaksanaan wajib diisi!');
      return;
    }
    if (!uraianRencana.trim()) {
      setErrorMsg('Uraian rencana kegiatan dan sasaran khusus wajib diisi!');
      return;
    }
    if (!armada.trim()) {
      setErrorMsg('Armada kendaraan dinas operasional wajib dipilih!');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    // Format susunan nama rekan regu lengkap dengan pangkat dan NRP
    const formattedRekanRegu = selectedPartners.length > 0
      ? selectedPartners
          .map((p) => {
            const rank = p.pangkat || '';
            const hasRankInName = rank && p.name.toLowerCase().startsWith(rank.toLowerCase());
            const fullName = !hasRankInName && rank ? `${rank} ${p.name}` : p.name;
            return p.nrp ? `${fullName} (NRP ${p.nrp})` : fullName;
          })
          .join(', ')
      : 'Patroli Mandiri (Tanpa Rekan)';

    const res = await onSubmit({
      type,
      lokasiSasaran: lokasiSasaran.trim(),
      jamMulai,
      jamSelesai,
      armada: armada || 'JALAN_KAKI',
      rekanRegu: formattedRekanRegu,
      uraianRencana: uraianRencana.trim(),
    });

    setIsSubmitting(false);

    if (!res.success) {
      setErrorMsg(res.error || 'Gagal mengirim pengajuan giat ke Pawas.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl border ${config.borderClass} bg-[#0E1017] flex flex-col max-h-[94vh] animate-in zoom-in-95 duration-200`}
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75), 0 0 35px rgba(236, 196, 115, 0.12)',
        }}
      >
        {/* Header Modal */}
        <div className="relative p-5 sm:p-6 border-b border-white/10 bg-gradient-to-r from-[#151821] via-[#10131B] to-[#151821]">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl shadow-inner shrink-0">
                {config.icon}
              </div>
              <div>
                <h3 className="text-base font-black text-white tracking-wide mt-1">
                  {config.title}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {config.subtitle}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors shrink-0 disabled:opacity-50"
              title="Tutup Modal"
            >
              <X size={18} />
            </button>
          </div>

          {/* Context Pill Bar */}
          <div className="mt-4 pt-3 border-t border-white/5 grid grid-cols-2 gap-2 text-[11px] text-slate-300">
            <div className="flex items-center gap-1.5 truncate">
              <User size={13} className="text-amber-400 shrink-0" />
              <span className="truncate">
                {officer.pangkat || (officer as any).rankPangkat || ''} {officer.fullName}
              </span>
            </div>
            <div className="flex items-center gap-1.5 justify-end text-slate-400 font-mono">
              <Clock size={13} className="text-blue-400 shrink-0" />
              <span>{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
            <div className="col-span-2 flex items-center gap-1.5 text-[10.5px] text-slate-400 font-mono truncate">
              <MapPin size={12} className="text-emerald-400 shrink-0" />
              <span className="truncate">
                {currentGps.lat !== 0 || currentGps.lng !== 0
                  ? `Posisi Terkini: ${currentGps.lat.toFixed(5)}, ${currentGps.lng.toFixed(5)} (${officer.stationName || 'Polres'})`
                  : officer.stationName || 'Wilayah Hukum Polres'}
              </span>
            </div>
          </div>
        </div>

        {/* Body Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 text-slate-200">
          {/* Field 1: Rencana Lokasi / Rute Sasaran Giat */}
          <div>
            <label className="text-xs font-bold text-amber-300 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
              <MapPin size={14} className="text-amber-400 shrink-0" />
              <span>Rencana Lokasi / Rute Sasaran Giat *</span>
            </label>
            <input
              type="text"
              value={lokasiSasaran}
              onChange={(e) => {
                setLokasiSasaran(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder="Contoh: Jl. Pantura Wiradesa - Alun-Alun Kajen - Titik 0 Km"
              className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm text-slate-100 bg-[#07090E] border border-white/10 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 outline-none transition-all shadow-inner"
              required
            />
          </div>

          {/* Field 2: Estimasi Waktu Pelaksanaan (Jam Mulai s/d Jam Selesai) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-1.5">
                <Clock size={13} className="text-blue-400 shrink-0" />
                <span>Estimasi Jam Mulai *</span>
              </label>
              <input
                type="time"
                value={jamMulai}
                onChange={(e) => setJamMulai(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm text-slate-100 bg-[#07090E] border border-white/10 focus:border-blue-400 outline-none font-mono"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-1.5">
                <Clock size={13} className="text-blue-400 shrink-0" />
                <span>Estimasi Jam Selesai *</span>
              </label>
              <input
                type="time"
                value={jamSelesai}
                onChange={(e) => setJamSelesai(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm text-slate-100 bg-[#07090E] border border-white/10 focus:border-blue-400 outline-none font-mono"
                required
              />
            </div>
          </div>

          {/* Field 3: Armada Kendaraan Dinas (100% dari Database) */}
          <div>
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-1.5">
              <Car size={13} className="text-emerald-400 shrink-0" />
              <span>Armada Kendaraan Dinas *</span>
            </label>
            <Select2CustomDropdown
              value={armada}
              onChange={(val) => {
                setArmada(val ? String(val) : '');
                if (errorMsg) setErrorMsg(null);
              }}
              options={fleetOptions}
              placeholder={isLoadingVehicles ? "-- Memuat armada dari database... --" : "-- Pilih Armada Kendaraan --"}
              searchable={true}
              allowClear={false}
              triggerStyle={{
                background: '#07090E',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '0.75rem',
                color: '#F1F5F9',
                fontSize: '12px',
                minHeight: '42px',
                padding: '8px 12px',
              }}
            />
          </div>

          {/* Field 4: Rekan Regu / Pendamping (Multi-Select seperti Modal Tambah Rekan Regu) */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-[#07090E] border border-white/10 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                  <Users size={14} />
                </div>
                <div className="min-w-0">
                  <label className="text-xs font-bold text-slate-200 block truncate">
                    Rekan Regu / Pendamping
                  </label>
                  <span className="text-[10px] text-slate-400 block truncate">
                    {selectedPartners.length > 0
                      ? `${selectedPartners.length} personil terpilih dalam regu`
                      : 'Patroli mandiri atau pilih rekan dinas'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowPartnerPicker(!showPartnerPicker)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/30 transition-all flex items-center gap-1.5 shrink-0"
              >
                <UserPlus size={13} />
                <span>{showPartnerPicker ? 'Tutup Daftar' : '+ Pilih Rekan'}</span>
              </button>
            </div>

            {/* Chips Personel Terpilih */}
            {selectedPartners.length > 0 ? (
              <div className="space-y-1.5 pt-0.5">
                <div className="flex items-center justify-between text-[10.5px] font-bold text-purple-300">
                  <span>Daftar Personil Terpilih:</span>
                  <button
                    type="button"
                    onClick={() => setSelectedPartners([])}
                    className="text-[10px] text-slate-400 hover:text-red-400 underline transition-colors"
                  >
                    Hapus Semua
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                  {selectedPartners.map((p) => {
                    const rank = p.pangkat || '';
                    const hasRankInName = rank && p.name.toLowerCase().startsWith(rank.toLowerCase());
                    const displayName = !hasRankInName && rank ? `${rank} ${p.name}` : p.name;
                    return (
                      <div
                        key={p.id || p.name}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-600/25 border border-purple-400/40 text-xs text-white shadow-sm"
                      >
                        <Shield size={12} className="text-purple-400 shrink-0" />
                        <span className="font-semibold truncate max-w-[170px]" title={displayName}>
                          {displayName}
                        </span>
                        {p.nrp && <span className="text-[10px] text-purple-300 font-mono">({p.nrp})</span>}
                        <button
                          type="button"
                          onClick={() => removePartner(p.id || p.name)}
                          className="w-4 h-4 rounded-full hover:bg-red-500/40 text-slate-300 hover:text-red-200 flex items-center justify-center transition-colors ml-0.5"
                          title="Hapus dari regu"
                        >
                          <X size={11} strokeWidth={2.5} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              !showPartnerPicker && (
                <div className="text-[11px] text-slate-500 italic py-0.5">
                  Belum ada rekan dipilih (Mode Patroli Mandiri). Klik "+ Pilih Rekan" untuk memilih dari daftar personil dinas.
                </div>
              )
            )}

            {/* Panel Pemilih Personel Dinas (Konsep seperti Modal Tambah Rekan Regu Tiket) */}
            {showPartnerPicker && (
              <div className="pt-2.5 border-t border-white/10 space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-150">
                {/* Search Input */}
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={officerSearchQuery}
                    onChange={(e) => setOfficerSearchQuery(e.target.value)}
                    placeholder="Cari nama, pangkat, atau NRP rekan dinas..."
                    className="w-full pl-9 pr-7 py-2 rounded-xl bg-[#0E1017] border border-white/10 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-400 transition-colors"
                  />
                  {officerSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setOfficerSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* List Available Officers */}
                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                  {isLoadingOfficers ? (
                    <div className="py-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                      <Loader2 size={14} className="animate-spin text-purple-400" />
                      <span>Memuat personel piket dinas...</span>
                    </div>
                  ) : filteredAvailableOfficers.length > 0 ? (
                    filteredAvailableOfficers.map((off) => {
                      const offId = String(off.id);
                      const isSelected = selectedPartners.some(
                        (p) =>
                          (p.id && p.id === offId) ||
                          (p.nrp && off.nrp && p.nrp === off.nrp) ||
                          (p.name &&
                            (off.full_name || off.name) &&
                            p.name.toLowerCase() === (off.full_name || off.name).toLowerCase())
                      );

                      return (
                        <div
                          key={off.id || off.nrp}
                          onClick={() => togglePartner(off)}
                          className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-2.5 ${
                            isSelected
                              ? 'bg-purple-600/25 border-purple-500 shadow-sm shadow-purple-500/10'
                              : 'bg-[#0E1017] border-white/5 hover:border-white/15 hover:bg-white/[0.02]'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs ${
                                isSelected ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              <Shield size={13} />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-white truncate">
                                {off.full_name || off.name}
                              </div>
                              <div className="text-[10.5px] text-slate-400">
                                {off.pangkat || off.rank || 'Personel'} • NRP: {off.nrp || '-'}
                              </div>
                            </div>
                          </div>

                          <div
                            className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-all ${
                              isSelected
                                ? 'bg-purple-500 border-purple-400 text-white'
                                : 'bg-slate-800/80 border-slate-700 text-transparent'
                            }`}
                          >
                            <Check size={12} strokeWidth={3} />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-3 text-center text-xs text-slate-500">
                      Tidak ada personel yang sesuai pencarian. Anda dapat menginput manual di bawah.
                    </div>
                  )}
                </div>

                {/* Input Tambah Manual Rekan */}
                <div className="pt-2.5 border-t border-white/10 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Tambah Manual Rekan (BKO / Satuan Luar)
                  </span>

                  {/* Tombol Tambah: Diletakkan di bawah judul dan di atas input */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-400">
                      Ketik nama & NRP rekan di bawah:
                    </span>
                    <button
                      type="button"
                      onClick={handleAddManualPartner}
                      disabled={!manualPartnerName.trim()}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:hover:bg-purple-600 text-white transition-all flex items-center gap-1.5 shrink-0 shadow-md shadow-purple-600/20"
                    >
                      <Plus size={13} />
                      <span>Tambah</span>
                    </button>
                  </div>

                  {/* Grid Input Nama & NRP (Lebar leluasa, tidak terpotong) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={manualPartnerName}
                      onChange={(e) => setManualPartnerName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddManualPartner();
                        }
                      }}
                      placeholder="Nama Rekan (mis: Briptu Dian)"
                      className="w-full px-3 py-2 rounded-xl bg-[#0E1017] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 transition-colors"
                    />
                    <input
                      type="text"
                      value={manualPartnerNrp}
                      onChange={(e) => setManualPartnerNrp(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddManualPartner();
                        }
                      }}
                      placeholder="NRP (opsional)"
                      className="w-full px-3 py-2 rounded-xl bg-[#0E1017] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 transition-colors"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Field 5: Uraian Rencana Kegiatan & Sasaran */}
          <div>
            <label className="text-xs font-bold text-amber-300 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
              <FileText size={14} className="text-amber-400 shrink-0" />
              <span>Uraian Rencana Kegiatan & Sasaran Khusus *</span>
            </label>
            <textarea
              rows={3}
              value={uraianRencana}
              onChange={(e) => {
                setUraianRencana(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder={`Jelaskan rencana sasaran kegiatan ${type.toLowerCase()} yang akan dilaksanakan...`}
              className="w-full px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm text-slate-100 bg-[#07090E] border border-white/10 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 outline-none transition-all resize-none shadow-inner leading-relaxed"
              required
            />
            <div className="flex justify-between items-center mt-1 text-[11px] text-slate-400">
              <span>Pengajuan ini akan dikirim ke antrean persetujuan Pawas.</span>
              <span className="font-mono text-amber-300/80">{uraianRencana.trim().length} karakter</span>
            </div>
          </div>

          {/* Template Cepat (Chip Presets) */}
          <div>
            <div className="text-[11px] font-bold text-slate-400 mb-1.5 flex items-center gap-1">
              <Sparkles size={12} className="text-amber-400" />
              <span>Template Rencana Cepat (Ketuk untuk Menambahkan):</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {config.presets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="px-2.5 py-1.5 rounded-xl text-[11px] font-semibold text-slate-200 bg-white/5 border border-white/10 hover:border-amber-400/40 hover:bg-amber-500/10 active:scale-95 transition-all text-left"
                >
                  + {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <TacticalAlert
              variant="error"
              message={errorMsg}
              onClose={() => setErrorMsg(null)}
            />
          )}

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-300 bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !uraianRencana.trim() || !lokasiSasaran.trim()}
              className="px-5 py-2.5 rounded-xl text-xs font-black text-slate-950 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-400 active:scale-95 transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                  <span>Mengirim Pengajuan...</span>
                </>
              ) : (
                <>
                  <Send size={13} className="text-slate-950" />
                  <span>Ajukan Giat {type} ke Pawas</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
