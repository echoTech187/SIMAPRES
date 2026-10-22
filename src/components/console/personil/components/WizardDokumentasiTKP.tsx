'use client';

import React, { useState } from 'react';
import {
  Camera,
  Upload,
  FileText,
  Video,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Shield,
  X,
  Eye,
} from 'lucide-react';
import LiveCameraWatermarkCapture from '@/components/LiveCameraWatermarkCapture';
import { uploadEvidenceMediaAction } from '@/app/actions/upload.actions';
import { fieldStepAction } from '@/app/actions/complaint.actions';
import type { ComplaintData, OfficerProfile } from '../types';

interface WizardDokumentasiTKPProps {
  complaint: ComplaintData;
  officer: OfficerProfile;
  currentGps: { lat: number; lng: number };
  resolutionLocations?: any[];
  resolutionDocuments?: any[];
  onClose?: () => void;
  onSuccess?: () => void;
}

export default function WizardDokumentasiTKP({
  complaint,
  officer,
  currentGps,
  resolutionLocations = [],
  resolutionDocuments = [],
  onClose,
  onSuccess,
}: WizardDokumentasiTKPProps) {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [catatan, setCatatan] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Photos & Media
  const [photosStep1, setPhotosStep1] = useState<Array<{ id: string; dataUrl: string; metadata?: any }>>([]);
  const [photosStep2, setPhotosStep2] = useState<Array<{ id: string; dataUrl: string; metadata?: any }>>([]);
  const [mediaStep3, setMediaStep3] = useState<
    Array<{
      id: string;
      fileUrl: string;
      fileName: string;
      fileType: 'KAMERA' | 'DOKUMEN' | 'VIDEO' | 'GAMBAR';
      caption?: string;
    }>
  >([]);

  // Resolution selections
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(null);

  // Active Camera Capture state
  const [activeCameraStep, setActiveCameraStep] = useState<number | null>(null);
  const [cameraLabel, setCameraLabel] = useState('');

  // Open live camera with watermark
  const handleOpenCamera = (step: number, label: string) => {
    setActiveCameraStep(step);
    setCameraLabel(label);
  };

  const handleCapturePhoto = (dataUrl: string, metadata: any) => {
    const item = { id: `photo-${Date.now()}`, dataUrl, metadata };
    if (activeCameraStep === 1) {
      setPhotosStep1((prev) => [...prev, item]);
    } else if (activeCameraStep === 2) {
      setPhotosStep2((prev) => [...prev, item]);
    } else if (activeCameraStep === 3) {
      setMediaStep3((prev) => [
        ...prev,
        {
          id: item.id,
          fileUrl: dataUrl,
          fileName: `Foto_Penyelesaian_${Date.now()}.jpg`,
          fileType: 'KAMERA',
          caption: cameraLabel,
        },
      ]);
    }
    setActiveCameraStep(null);
  };

  // Submit Step Handler
  const handleSaveStep = async (stepKey: 'meluncur' | 'tiba_tkp' | 'tindakan_tkp' | 'selesai') => {
    setIsSubmitting(true);
    try {
      const selectedLoc = resolutionLocations.find((l) => l.id === selectedLocationId);
      const selectedDoc = resolutionDocuments.find((d) => d.id === selectedDocumentId);

      const res = await fieldStepAction({
        complaintId: String(complaint.id),
        step: stepKey,
        officerId: officer.id || '3',
        catatan,
        lat: currentGps.lat,
        lng: currentGps.lng,
        resolutionLocationId: selectedLocationId,
        resolutionLocationKey: selectedLoc?.key || null,
        resolutionLocationName: selectedLoc?.name || null,
        resolutionDocumentId: selectedDocumentId,
        resolutionDocumentKey: selectedDoc?.key || null,
        resolutionDocumentName: selectedDoc?.name || null,
      });

      if (res.success) {
        alert(`✓ Langkah berhasil dicatat ke server.`);
        if (onSuccess) onSuccess();
      } else {
        alert(res.error || 'Gagal menyimpan langkah wizard.');
      }
    } catch (e: any) {
      alert(e.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto rounded-3xl overflow-hidden p-4 sm:p-6 text-slate-100"
      style={{
        background: 'linear-gradient(180deg, #131620 0%, #0A0C11 100%)',
        border: '1.5px solid rgba(236, 196, 115, 0.3)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(236, 196, 115, 0.1)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-amber-500/20 mb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-slate-900"
            style={{
              background: 'linear-gradient(135deg, #ECC473 0%, #D4A346 100%)',
            }}
          >
            <Shield size={20} />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white">
              Wizard Dokumentasi & Penanganan TKP
            </h2>
            <div className="text-xs text-amber-300 font-mono">
              #{complaint.nomorTiket} • {complaint.jenisKejadian}
            </div>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Stepper Tabs */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        {[
          { num: 1, title: 'Respon Cepat', desc: 'Meluncur ke TKP', key: 'meluncur' },
          { num: 2, title: 'Tindakan TKP', desc: 'Foto & TPTKP', key: 'tindakan_tkp' },
          { num: 3, title: 'Penyelesaian', desc: 'BAP / Mediasi', key: 'selesai' },
        ].map((s) => {
          const isActive = activeStep === s.num;
          return (
            <button
              key={s.num}
              type="button"
              onClick={() => setActiveStep(s.num)}
              className={`p-3 rounded-2xl text-left transition-all ${
                isActive
                  ? 'bg-amber-500/15 border-2 border-amber-400 text-amber-300 shadow-[0_0_15px_rgba(236,196,115,0.2)]'
                  : 'bg-white/5 border border-white/10 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="text-[10px] font-black uppercase tracking-wider mb-0.5">
                Langkah 0{s.num}
              </div>
              <div className="text-xs sm:text-sm font-bold text-white leading-tight">
                {s.title}
              </div>
              <div className="text-[10px] opacity-75 hidden sm:block mt-0.5">
                {s.desc}
              </div>
            </button>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="space-y-6">
        {activeStep === 1 && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <h3 className="text-sm font-bold text-amber-300 mb-1">
                Langkah 1: Respon Cepat & Keberangkatan Petugas
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Konfirmasi status regu patroli menuju ke lokasi TKP. Ambil foto persiapan atau ranmor dinas jika diperlukan.
              </p>
            </div>

            {/* Photos Step 1 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-300">
                  Dokumentasi Persiapan / Keberangkatan ({photosStep1.length})
                </span>
                <button
                  type="button"
                  onClick={() => handleOpenCamera(1, 'Foto Keberangkatan Regu')}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 hover:bg-amber-400/30 flex items-center gap-1.5 transition-colors"
                >
                  <Camera size={14} />
                  <span>Ambil Foto Langsung (Watermark)</span>
                </button>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {photosStep1.map((p) => (
                  <div key={p.id} className="relative rounded-xl overflow-hidden aspect-video border border-amber-500/30">
                    <img src={p.dataUrl} alt="Step 1" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSaveStep('meluncur')}
              className="w-full py-3 rounded-2xl font-black text-xs sm:text-sm bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
            >
              {isSubmitting ? 'Merekam Data...' : 'Konfirmasi Meluncur ke TKP ➔'}
            </button>
          </div>
        )}

        {activeStep === 2 && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <h3 className="text-sm font-bold text-amber-300 mb-1">
                Langkah 2: Tindakan Pertama di Tempat Kejadian Perkara (TPTKP)
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Wajib mengambil dokumentasi foto autentik ber-watermark GPS dan tanggal langsung di lokasi kejadian.
              </p>
            </div>

            {/* Photos Step 2 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-300">
                  Foto Bukti TKP ({photosStep2.length})
                </span>
                <button
                  type="button"
                  onClick={() => handleOpenCamera(2, 'Dokumentasi Tindakan di TKP')}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 hover:bg-amber-400/30 flex items-center gap-1.5 transition-colors"
                >
                  <Camera size={14} />
                  <span>Buka Kamera Watermark</span>
                </button>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {photosStep2.map((p) => (
                  <div key={p.id} className="relative rounded-xl overflow-hidden aspect-video border border-amber-500/30">
                    <img src={p.dataUrl} alt="Step 2" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>

            {/* Catatan Tindakan */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Uraian Tindakan Kepolisian di TKP
              </label>
              <textarea
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                rows={3}
                placeholder="Deskripsikan tindakan yang telah dilakukan di TKP..."
                className="w-full bg-black/40 text-slate-100 placeholder-slate-500 text-xs sm:text-sm p-3 rounded-2xl border border-amber-500/25 focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSaveStep('tindakan_tkp')}
              className="w-full py-3 rounded-2xl font-black text-xs sm:text-sm bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
            >
              {isSubmitting ? 'Merekam Tindakan...' : 'Simpan Tindakan Kepolisian di TKP ➔'}
            </button>
          </div>
        )}

        {activeStep === 3 && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <h3 className="text-sm font-bold text-amber-300 mb-1">
                Langkah 3: Berkas Bukti & Penyelesaian Kasus
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Pilih lokasi penyelesaian (Mako / Kantor Polsek / Musyawarah TKP), lampirkan dokumen BAP atau surat kesepakatan damai.
              </p>
            </div>

            {/* Master Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Lokasi Penyelesaian Kasus
                </label>
                <select
                  value={selectedLocationId || ''}
                  onChange={(e) => setSelectedLocationId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full bg-black/40 text-slate-100 text-xs p-3 rounded-xl border border-amber-500/25 focus:outline-none focus:border-amber-400"
                >
                  <option value="">-- Pilih Lokasi Penyelesaian --</option>
                  {resolutionLocations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Dokumen Pendukung / BAP
                </label>
                <select
                  value={selectedDocumentId || ''}
                  onChange={(e) => setSelectedDocumentId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full bg-black/40 text-slate-100 text-xs p-3 rounded-xl border border-amber-500/25 focus:outline-none focus:border-amber-400"
                >
                  <option value="">-- Pilih Jenis Dokumen --</option>
                  {resolutionDocuments.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSaveStep('selesai')}
              className="w-full py-3 rounded-2xl font-black text-xs sm:text-sm bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/25 active:scale-95 transition-all"
            >
              {isSubmitting ? 'Mengirim Berkas...' : 'Kirim Laporan Akhir ke Pawas untuk Validasi ➔'}
            </button>
          </div>
        )}
      </div>

      {/* Modal Live Camera Watermark */}
      {activeCameraStep !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
            <LiveCameraWatermarkCapture
              label={cameraLabel}
              personilNama={officer.fullName}
              personilNrp={officer.nrp}
              tkpAlamat={complaint.tkpAlamatTeks}
              gpsLat={currentGps.lat}
              gpsLng={currentGps.lng}
              onPhotoCaptured={handleCapturePhoto}
              onCancel={() => setActiveCameraStep(null)}
            />
        </div>
      )}
    </div>
  );
}
