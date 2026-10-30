/**
 * SIMAPRES 110 - DOMAIN ENTITY: COMPLAINT
 * Lapisan: Domain (Pure TypeScript, Zero Framework Dependency)
 */

export type UrgensiLevel = 'DARURAT' | 'SEDANG' | 'NORMAL';

export type ComplaintStatus =
  | 'MENUNGGU'
  | 'DIPROSES'
  | 'MENUNGGU_PENGESAHAN'
  | 'SELESAI'
  | 'DITOLAK'
  | string;

export interface EvidenceInputItem {
  fileUrl?: string;
  file_url?: string;
  caption?: string;
  watermarkText?: string | null;
  watermark_text?: string | null;
  lat?: number | null;
  lng?: number | null;
  fileType?: string;
  file_type?: string;
  fileName?: string | null;
  file_name?: string | null;
  [key: string]: unknown;
}

export interface TimelineStep {
  tahapKe: number;
  actionKey?: string;
  tahapTitle: string;
  catatan?: string | null;
  fotoBuktiUrl?: string | null;
  evidences?: EvidenceInputItem[];
  gpsLat?: number | null;
  gpsLng?: number | null;
  isDiscrepancy?: boolean;
  deviationMeters?: number;
  warningMessage?: string;
  photoAddress?: string;
  createdAt: Date;
}

export interface AssignedOfficerData {
  id: bigint;
  nrp: string;
  rankPangkat: string;
  jabatan: string;
  assignedPatrolVehicle?: string | null;
  currentGpsLat?: number | null;
  currentGpsLng?: number | null;
  namaLengkap?: string;
  avatarUrl?: string | null;
  phoneNumber?: string | null;
  unitName?: string | null;
}

export interface UserSummaryData {
  id: bigint;
  namaLengkap: string;
  identifier: string;
}

export interface ComplaintProps {
  id?: bigint;
  nomorTiket: string;
  pelaporNama: string;
  pelaporHp: string;
  jenisKejadian: string;
  urgensi: UrgensiLevel | string;
  tkpAlamatTeks: string;
  tkpLat: number;
  tkpLng: number;
  ringkasanKeterangan: string;
  status: ComplaintStatus;
  tahap?: number;
  alasanTolak?: string | null;
  operatorId?: bigint | null;
  pawasValidasiId?: bigint | null;
  assignedOfficerId?: bigint | null;
  assignedOfficer?: AssignedOfficerData | null;
  pawas?: UserSummaryData | null;
  operator?: UserSummaryData | null;
  disposisiAt?: Date | null;
  responTibaTkpAt?: Date | null;
  selesaiAt?: Date | null;
  responseTimeMinutes?: number | null;
  citizenRating?: number | null;
  citizenReview?: string | null;
  citizenTags?: string | null;
  kategoriId?: number | null;
  kategoriKey?: string | null;
  kategoriRel?: Record<string, unknown> | null;
  subcategoryId?: number | null;
  subcategory?: Record<string, unknown> | null;
  platformId?: number | null;
  platformKey?: string | null;
  platformRel?: Record<string, unknown> | null;
  stationId?: number | null;
  station?: Record<string, unknown> | null;
  timelines?: TimelineStep[];
  dispatches?: Record<string, unknown>[];
  complaintLogs?: Record<string, unknown>[];
  evidences?: Record<string, unknown>[];
  fotoBuktiUrl?: string | null;
  fotoPersiapan?: string | null;
  fotoTiba?: string | null;
  fotoTindakan?: string | null;
  fotoSelesai?: string | null;
  catatanTindakan?: string | null;
  waktuMeluncur?: string | null;
  koordinatGps?: string | null;
  waktuTiba?: string | null;
  waktuSelesai?: string | null;
  waktuSelesaiDate?: Date | string | null;
  catatanSelesai?: string | null;
  resolutionLocationId?: number | null;
  resolutionLocationKey?: string | null;
  resolutionLocationName?: string | null;
  resolutionLocationRel?: any | null;
  resolutionDocumentId?: number | null;
  resolutionDocumentKey?: string | null;
  resolutionDocumentName?: string | null;
  resolutionDocumentRel?: any | null;
  citizenReviewRel?: any | null;
  createdAt?: Date;
  updatedAt?: Date;
  created_at?: Date | string;
  updated_at?: Date | string;
}

export class ComplaintEntity {
  private props: ComplaintProps;

  constructor(props: ComplaintProps) {
    this.props = {
      ...props,
      status: props.status || 'MENUNGGU',
      urgensi: props.urgensi || 'SEDANG',
      createdAt: props.createdAt || new Date(),
      timelines: props.timelines || [],
      dispatches: props.dispatches || [],
      complaintLogs: props.complaintLogs || [],
      evidences: props.evidences || [],
    };
  }

  get id(): bigint | undefined {
    return this.props.id;
  }

  get nomorTiket(): string {
    return this.props.nomorTiket;
  }

  get pelaporNama(): string {
    return this.props.pelaporNama;
  }

  get pelaporHp(): string {
    return this.props.pelaporHp;
  }

  get maskedPelaporHp(): string {
    // UU No. 27 Tahun 2022 (UU PDP) - Sensor 4 digit tengah
    const hp = this.props.pelaporHp || '';
    if (hp.length < 8) return '****';
    return hp.slice(0, 4) + '****' + hp.slice(-4);
  }

  get jenisKejadian(): string {
    return this.props.jenisKejadian;
  }

  get urgensi(): UrgensiLevel | string {
    return this.props.urgensi;
  }

  get tkpAlamatTeks(): string {
    return this.props.tkpAlamatTeks;
  }

  get tkpLat(): number {
    return this.props.tkpLat;
  }

  get tkpLng(): number {
    return this.props.tkpLng;
  }

  get ringkasanKeterangan(): string {
    return this.props.ringkasanKeterangan;
  }

  get status(): ComplaintStatus {
    return this.props.status;
  }

  get tahap(): number | null | undefined {
    return this.props.tahap;
  }

  get assignedOfficerId(): bigint | null | undefined {
    return this.props.assignedOfficerId;
  }

  get assignedOfficer(): AssignedOfficerData | null | undefined {
    return this.props.assignedOfficer;
  }

  get pawas(): UserSummaryData | null | undefined {
    return this.props.pawas;
  }

  get operator(): UserSummaryData | null | undefined {
    return this.props.operator;
  }

  get timelines(): TimelineStep[] {
    return this.props.timelines || [];
  }

  get citizenRating(): number | null | undefined {
    return this.props.citizenRating;
  }

  get citizenReview(): string | null | undefined {
    return this.props.citizenReview;
  }

  get citizenTags(): string | null | undefined {
    return this.props.citizenTags;
  }

  get kategoriId(): number | null | undefined {
    return this.props.kategoriId;
  }

  get kategoriKey(): string | null | undefined {
    return this.props.kategoriKey;
  }

  get subcategoryId(): number | null | undefined {
    return this.props.subcategoryId;
  }

  get subcategory(): any | null | undefined {
    return this.props.subcategory;
  }

  get platformId(): number | null | undefined {
    return this.props.platformId;
  }

  get platformKey(): string | null | undefined {
    return this.props.platformKey;
  }

  get responseTimeMinutes(): number | null | undefined {
    return this.props.responseTimeMinutes;
  }

  get fotoBuktiUrl(): string | null | undefined {
    return this.props.fotoBuktiUrl;
  }

  get fotoPersiapan(): string | null | undefined {
    return this.props.fotoPersiapan;
  }

  get fotoTiba(): string | null | undefined {
    return this.props.fotoTiba;
  }

  get fotoTindakan(): string | null | undefined {
    return this.props.fotoTindakan;
  }

  get catatanTindakan(): string | null | undefined {
    return this.props.catatanTindakan;
  }

  get fotoSelesai(): string | null | undefined {
    return this.props.fotoSelesai;
  }

  get waktuMeluncur(): string | null | undefined {
    return this.props.waktuMeluncur;
  }

  get koordinatGps(): string | null | undefined {
    return this.props.koordinatGps;
  }

  get waktuTiba(): string | null | undefined {
    return this.props.waktuTiba;
  }

  get waktuSelesai(): string | null | undefined {
    return this.props.waktuSelesai;
  }

  get waktuSelesaiDate(): Date | string | null | undefined {
    return this.props.waktuSelesaiDate;
  }

  get catatanSelesai(): string | null | undefined {
    return this.props.catatanSelesai;
  }

  get created_at(): Date | string | undefined {
    return this.props.created_at || this.props.createdAt;
  }

  get updated_at(): Date | string | undefined {
    return this.props.updated_at || this.props.updatedAt;
  }

  get resolutionLocationId(): number | null | undefined {
    return this.props.resolutionLocationId;
  }

  get resolutionLocationKey(): string | null | undefined {
    return this.props.resolutionLocationKey;
  }

  get resolutionLocationName(): string | null | undefined {
    return this.props.resolutionLocationName;
  }

  get resolutionDocumentId(): number | null | undefined {
    return this.props.resolutionDocumentId;
  }

  get resolutionDocumentKey(): string | null | undefined {
    return this.props.resolutionDocumentKey;
  }

  get resolutionDocumentName(): string | null | undefined {
    return this.props.resolutionDocumentName;
  }

  // --- LOGIKA BISNIS & STATE TRANSITIONS (SOP POLRI) ---

  /**
   * Disposisi oleh Pawas / Pimpinan (Fase 2)
   */
  public disposisiKePetugas(officerId: bigint, pawasId: bigint): void {
    if (this.props.status !== 'MENUNGGU' && (this.props.status as string) !== 'BELUM_DITANGANI') {
      throw new Error(`Tiket ${this.props.nomorTiket} tidak dalam status antrean verifikasi.`);
    }
    this.props.status = 'DIPROSES';
    this.props.assignedOfficerId = officerId;
    this.props.pawasValidasiId = pawasId;
    this.props.disposisiAt = new Date();
  }

  /**
   * Personel Mengkonfirmasi Meluncur ke TKP (Fase 3 - Step 1)
   */
  public personilMeluncur(catatan?: string, fotoBuktiUrl?: string, lat?: number, lng?: number): void {
    if (this.props.status !== 'DIPROSES') {
      throw new Error(`Tiket ${this.props.nomorTiket} belum didisposisikan.`);
    }
    const now = new Date();
    this.props.status = 'DIPROSES';
    this.props.tahap = 3;
    this.props.waktuMeluncur = now.toISOString();
    if (fotoBuktiUrl) {
      this.props.fotoPersiapan = fotoBuktiUrl;
    }
    if (this.props.dispatches && this.props.dispatches.length > 0) {
      for (const d of this.props.dispatches) {
        if (!d.dispatch_status || d.dispatch_status === 'DISPATCHED') {
          d.dispatch_status = 'DEPARTED';
          d.departed_at = now;
        }
      }
    }
    this.props.timelines?.push({
      tahapKe: 1,
      actionKey: 'OFFICER_DEPARTED',
      tahapTitle: 'Personel Meluncur ke TKP',
      catatan: catatan || null,
      fotoBuktiUrl,
      gpsLat: lat,
      gpsLng: lng,
      createdAt: now,
    });
  }

  /**
   * Personel Tiba di Lokasi & Amankan TKP (Fase 3 - Step 2)
   */
  public tibaDiTkp(
    catatan?: string,
    fotoBuktiUrl?: string,
    lat?: number,
    lng?: number,
    isDiscrepancy?: boolean,
    deviationMeters?: number,
    warningMessage?: string,
    photoAddress?: string,
    evidencesList?: EvidenceInputItem[]
  ): void {
    const formattedTitle = isDiscrepancy
      ? 'Tindakan di TKP [ANOMALI LOKASI]'
      : 'Tindakan di Tempat Kejadian (TKP)';

    const combinedNotes = [
      warningMessage,
      catatan ? `Catatan: ${catatan}` : null,
    ].filter(Boolean).join('\n\n') || catatan || null;

    if (evidencesList && evidencesList.length > 0) {
      if (!this.props.evidences) this.props.evidences = [];
      for (const ev of evidencesList) {
        this.props.evidences.push({
          incident_phase: 'TIBA_TKP',
          file_url: ev.fileUrl || (ev as any).file_url || '',
          caption: ev.caption || (ev as any).caption || ev.fileName || (ev as any).file_name || 'Foto Bukti Kamera TKP',
          watermark_text: ev.watermarkText || (ev as any).watermark_text || null,
          exif_lat: ev.lat ?? (ev as any).exif_lat ?? lat ?? null,
          exif_lng: ev.lng ?? (ev as any).exif_lng ?? lng ?? null,
          file_type: ev.fileType || (ev as any).file_type || 'KAMERA',
          file_name: ev.fileName || (ev as any).file_name || null,
          uploaded_at: new Date(),
        });
      }
    }

    if (this.props.status === 'DIPROSES' && (this.props.tahap ?? 0) >= 4) {
      // Jika personel sudah tercatat tiba di TKP (timestamp kedatangan sudah terkunci),
      // perbarui foto bukti tindakan & catatan laporan dan majukan ke tahap 5 / PENANGANAN_TKP
      if (fotoBuktiUrl) {
        this.props.fotoTindakan = fotoBuktiUrl;
        if (!this.props.fotoTiba) this.props.fotoTiba = fotoBuktiUrl;
      }
      if (catatan) {
        this.props.catatanTindakan = catatan;
      }
      this.props.status = 'DIPROSES';
      this.props.tahap = 5;
      this.props.timelines?.push({
        tahapKe: 2,
        actionKey: 'OFFICER_ARRIVED',
        tahapTitle: formattedTitle,
        catatan: combinedNotes,
        fotoBuktiUrl,
        evidences: evidencesList,
        gpsLat: lat,
        gpsLng: lng,
        isDiscrepancy,
        deviationMeters,
        warningMessage,
        photoAddress,
        createdAt: new Date(),
      });
      return;
    }

    if (this.props.status !== 'DIPROSES') {
      throw new Error(`Tiket ${this.props.nomorTiket} tidak dalam status penanganan perjalanan ke TKP.`);
    }
    const now = new Date();
    this.props.status = 'DIPROSES';
    this.props.tahap = 4;
    this.props.responTibaTkpAt = now;
    if (fotoBuktiUrl) {
      this.props.fotoTiba = fotoBuktiUrl;
      this.props.fotoTindakan = fotoBuktiUrl;
    }
    if (this.props.dispatches && this.props.dispatches.length > 0) {
      for (const d of this.props.dispatches) {
        if (!d.dispatch_status || d.dispatch_status === 'DEPARTED' || d.dispatch_status === 'DISPATCHED') {
          d.dispatch_status = 'ARRIVED';
          d.arrived_at = now;
        }
      }
    }

    if (this.props.disposisiAt) {
      const diffMs = now.getTime() - this.props.disposisiAt.getTime();
      this.props.responseTimeMinutes = Math.max(1, Math.round(diffMs / (1000 * 60)));
    }

    const initialTitle = isDiscrepancy
      ? 'Tiba di Lokasi TKP [ANOMALI LOKASI]'
      : 'Tiba di Tempat Kejadian (TKP)';

    this.props.timelines?.push({
      tahapKe: 2,
      actionKey: isDiscrepancy ? 'DOKUMENTASI_TKP_FLAGGED' : 'OFFICER_ARRIVED',
      tahapTitle: initialTitle,
      catatan: combinedNotes,
      fotoBuktiUrl,
      evidences: evidencesList,
      gpsLat: lat,
      gpsLng: lng,
      isDiscrepancy,
      deviationMeters,
      warningMessage,
      photoAddress,
      createdAt: now,
    });
  }

  /**
   * Personel Melaporkan Tindakan & Dokumentasi di TKP (Fase 3 - Selesai Step 2, Aktifkan Step 3)
   */
  public tindakanTkp(
    catatan?: string,
    fotoBuktiUrl?: string,
    lat?: number,
    lng?: number,
    isDiscrepancy?: boolean,
    deviationMeters?: number,
    warningMessage?: string,
    photoAddress?: string,
    evidencesList?: EvidenceInputItem[]
  ): void {
    const formattedTitle = isDiscrepancy
      ? 'Tindakan di TKP [ANOMALI LOKASI]'
      : 'Tindakan di Tempat Kejadian (TKP)';

    const combinedNotes = [
      warningMessage,
      catatan ? `Catatan: ${catatan}` : null,
    ].filter(Boolean).join('\n\n') || catatan || null;

    if (evidencesList && evidencesList.length > 0) {
      if (!this.props.evidences) this.props.evidences = [];
      for (const ev of evidencesList) {
        this.props.evidences.push({
          incident_phase: 'PENANGANAN',
          file_url: ev.fileUrl || (ev as any).file_url || '',
          caption: ev.caption || (ev as any).caption || ev.fileName || (ev as any).file_name || 'Foto Bukti Tindakan TKP',
          watermark_text: ev.watermarkText || (ev as any).watermark_text || null,
          exif_lat: ev.lat ?? (ev as any).exif_lat ?? lat ?? null,
          exif_lng: ev.lng ?? (ev as any).exif_lng ?? lng ?? null,
          file_type: ev.fileType || (ev as any).file_type || 'KAMERA',
          file_name: ev.fileName || (ev as any).file_name || null,
          uploaded_at: new Date(),
        });
      }
    }

    this.props.status = 'DIPROSES';
    this.props.tahap = 5;
    if (fotoBuktiUrl) {
      this.props.fotoTindakan = fotoBuktiUrl;
      if (!this.props.fotoTiba) this.props.fotoTiba = fotoBuktiUrl;
    }
    if (catatan) {
      this.props.catatanTindakan = catatan;
    }

    this.props.timelines?.push({
      tahapKe: 2,
      actionKey: 'REPORT_SUBMITTED',
      tahapTitle: formattedTitle,
      catatan: combinedNotes,
      fotoBuktiUrl,
      evidences: evidencesList,
      gpsLat: lat,
      gpsLng: lng,
      isDiscrepancy,
      deviationMeters,
      warningMessage,
      photoAddress,
      createdAt: new Date(),
    });
  }

  /**
   * Penanganan Selesai & Terbitkan BAP (Fase 3 - Step 3 Menunggu Pengesahan Pawas)
   * Fleksibilitas Lokasi (TKP / Rumah Sakit / Kantor Polisi / RJ) & Objek Dokumentasi (Surat Damai / Rekam Medis / BB)
   */
  public ajukanPengesahanBap(
    catatan?: string,
    fotoBuktiUrl?: string,
    resolutionData?: {
      locationId?: number | null;
      locationKey?: string | null;
      locationName?: string | null;
      documentId?: number | null;
      documentKey?: string | null;
      documentName?: string | null;
    },
    evidencesList?: EvidenceInputItem[],
    lat?: number,
    lng?: number
  ): void {
    if (this.props.status !== 'DIPROSES') {
      throw new Error(`Tiket ${this.props.nomorTiket} tidak dalam status penanganan.`);
    }
    this.props.status = 'MENUNGGU_PENGESAHAN';
    this.props.tahap = 5;
    if (catatan) {
      this.props.catatanSelesai = catatan;
    }
    if (fotoBuktiUrl) {
      this.props.fotoSelesai = fotoBuktiUrl;
      if (!this.props.fotoTindakan) {
        this.props.fotoTindakan = fotoBuktiUrl;
      }
    }
    if (!this.props.waktuSelesai) {
      this.props.waktuSelesai = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }) + ' WIB';
      this.props.waktuSelesaiDate = new Date();
    }

    if (resolutionData) {
      if (resolutionData.locationId !== undefined) this.props.resolutionLocationId = resolutionData.locationId;
      if (resolutionData.locationKey !== undefined) this.props.resolutionLocationKey = resolutionData.locationKey;
      if (resolutionData.locationName !== undefined) this.props.resolutionLocationName = resolutionData.locationName;
      if (resolutionData.documentId !== undefined) this.props.resolutionDocumentId = resolutionData.documentId;
      if (resolutionData.documentKey !== undefined) this.props.resolutionDocumentKey = resolutionData.documentKey;
      if (resolutionData.documentName !== undefined) this.props.resolutionDocumentName = resolutionData.documentName;
    }

    if (evidencesList && evidencesList.length > 0) {
      if (!this.props.evidences) this.props.evidences = [];
      for (const ev of evidencesList) {
        this.props.evidences.push({
          incident_phase: 'SELESAI_KONDUSIF',
          file_url: ev.fileUrl || (ev as any).file_url || '',
          caption: ev.caption || (ev as any).caption || ev.fileName || (ev as any).file_name || 'Bukti Penyelesaian BAP',
          watermark_text: ev.watermarkText || (ev as any).watermark_text || null,
          exif_lat: ev.lat ?? (ev as any).exif_lat ?? null,
          exif_lng: ev.lng ?? (ev as any).exif_lng ?? null,
          file_type: ev.fileType || (ev as any).file_type || 'DOKUMEN',
          file_name: ev.fileName || (ev as any).file_name || null,
          uploaded_at: new Date(),
        });
      }
    }

    const titleSuffixParts: string[] = [];
    if (this.props.resolutionLocationName) {
      titleSuffixParts.push(`Lokasi: ${this.props.resolutionLocationName}`);
    }
    if (this.props.resolutionDocumentName) {
      titleSuffixParts.push(`Objek: ${this.props.resolutionDocumentName}`);
    }
    const tahapTitle = titleSuffixParts.length > 0
      ? `Pengajuan BAP (${titleSuffixParts.join(' • ')})`
      : 'Penanganan Lapangan Rampung & BAP Diterbitkan';

    this.props.timelines?.push({
      tahapKe: 3,
      actionKey: 'REPORT_SUBMITTED',
      tahapTitle,
      catatan: catatan || null,
      fotoBuktiUrl,
      evidences: evidencesList,
      gpsLat: lat ?? this.props.tkpLat ?? null,
      gpsLng: lng ?? this.props.tkpLng ?? null,
      createdAt: new Date(),
    });
  }

  /**
   * Penanganan Tuntas Langsung oleh Personel di Lapangan (SOP Langsung Selesai)
   */
  public selesaikanKasusLangsung(
    catatan?: string,
    fotoBuktiUrl?: string,
    lat?: number,
    lng?: number,
    evidencesList?: EvidenceInputItem[],
    resolutionData?: {
      locationId?: number | null;
      locationKey?: string | null;
      locationName?: string | null;
      documentId?: number | null;
      documentKey?: string | null;
      documentName?: string | null;
    }
  ): void {
    this.props.status = 'SELESAI';
    this.props.tahap = 5;
    this.props.selesaiAt = new Date();
    if (catatan) {
      this.props.catatanSelesai = catatan;
    }
    if (fotoBuktiUrl) {
      this.props.fotoSelesai = fotoBuktiUrl;
    }
    if (resolutionData) {
      if (resolutionData.locationId !== undefined) this.props.resolutionLocationId = resolutionData.locationId;
      if (resolutionData.locationKey !== undefined) this.props.resolutionLocationKey = resolutionData.locationKey;
      if (resolutionData.locationName !== undefined) this.props.resolutionLocationName = resolutionData.locationName;
      if (resolutionData.documentId !== undefined) this.props.resolutionDocumentId = resolutionData.documentId;
      if (resolutionData.documentKey !== undefined) this.props.resolutionDocumentKey = resolutionData.documentKey;
      if (resolutionData.documentName !== undefined) this.props.resolutionDocumentName = resolutionData.documentName;
    }
    if (evidencesList && evidencesList.length > 0) {
      if (!this.props.evidences) this.props.evidences = [];
      for (const ev of evidencesList) {
        this.props.evidences.push({
          incident_phase: 'SELESAI',
          file_url: ev.fileUrl || (ev as any).file_url || '',
          caption: ev.caption || (ev as any).caption || ev.fileName || (ev as any).file_name || 'Foto Bukti Penyelesaian Tugas TKP',
          watermark_text: ev.watermarkText || (ev as any).watermark_text || null,
          exif_lat: ev.lat ?? (ev as any).exif_lat ?? lat ?? null,
          exif_lng: ev.lng ?? (ev as any).exif_lng ?? lng ?? null,
          file_type: ev.fileType || (ev as any).file_type || 'KAMERA',
          file_name: ev.fileName || (ev as any).file_name || null,
          uploaded_at: new Date(),
        });
      }
    }
    if (!this.props.waktuSelesai) {
      this.props.waktuSelesai =
        new Date().toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Asia/Jakarta',
        }) + ' WIB';
      this.props.waktuSelesaiDate = new Date();
    }
    this.props.timelines?.push({
      tahapKe: 4,
      actionKey: 'REPORT_SUBMITTED',
      tahapTitle: 'Kasus Tuntas Selesai Ditangani Personil di Lapangan',
      catatan: catatan || null,
      fotoBuktiUrl,
      gpsLat: lat,
      gpsLng: lng,
      createdAt: new Date(),
    });
  }

  /**
   * Penanganan Tuntas & Pengesahan Kasus oleh Pawas (Fase 4 Selesai)
   */
  public selesaikanKasus(catatan?: string, fotoBuktiUrl?: string, lat?: number, lng?: number): void {
    this.props.status = 'SELESAI';
    this.props.tahap = 5;
    this.props.selesaiAt = new Date();
    if (fotoBuktiUrl) {
      this.props.fotoSelesai = fotoBuktiUrl;
    }
    this.props.timelines?.push({
      tahapKe: 4,
      actionKey: 'COMPLAINT_COMPLETED',
      tahapTitle: 'Kasus Tuntas Selesai Ditangani & Berita Acara Disahkan Pawas',
      catatan: catatan || null,
      fotoBuktiUrl,
      gpsLat: lat,
      gpsLng: lng,
      createdAt: new Date(),
    });
  }

  /**
   * Input Rating & Evaluasi Kepuasan Warga (IKM)
   */
  public berikanRatingWarga(rating: number, review?: string, tags?: string): void {
    if (this.props.status !== 'SELESAI' && this.props.status !== 'MENUNGGU_PENGESAHAN') {
      throw new Error('Rating hanya dapat diberikan pada pengaduan yang telah tuntas selesai.');
    }
    if (rating < 1 || rating > 5) {
      throw new Error('Skor rating harus berada dalam rentang 1 hingga 5 bintang.');
    }
    this.props.citizenRating = rating;
    this.props.citizenReview = review;
    this.props.citizenTags = tags;
  }

  public toJSON(): ComplaintProps {
    return { ...this.props };
  }
}
