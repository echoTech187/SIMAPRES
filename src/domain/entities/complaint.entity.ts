/**
 * SIMAPRES 110 - DOMAIN ENTITY: COMPLAINT
 * Lapisan: Domain (Pure TypeScript, Zero Framework Dependency)
 */

export type UrgensiLevel = 'DARURAT' | 'SEDANG' | 'NORMAL';

export type ComplaintStatus =
  | 'MENUNGGU'
  | 'DISPOSISI'
  | 'MENUJU_TKP'
  | 'TIBA_DI_TKP'
  | 'MENUNGGU_PENGESAHAN'
  | 'SELESAI'
  | 'DITOLAK'
  // Backward compatibility:
  | 'BELUM_DITANGANI'
  | 'PENANGANAN_TKP'
  | 'DIPROSES'
  | 'DIBATALKAN'
  | string;

export interface TimelineStep {
  tahapKe: number;
  tahapTitle: string;
  catatan?: string | null;
  fotoBuktiUrl?: string | null;
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
  kategoriRel?: any | null;
  subcategoryId?: number | null;
  subcategory?: any | null;
  platformId?: number | null;
  platformKey?: string | null;
  platformRel?: any | null;
  timelines?: TimelineStep[];
  dispatches?: any[];
  complaintLogs?: any[];
  evidences?: any[];
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
  citizenReviewRel?: any | null;
  createdAt?: Date;
  updatedAt?: Date;
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

  // --- LOGIKA BISNIS & STATE TRANSITIONS (SOP POLRI) ---

  /**
   * Disposisi oleh Pawas / Pimpinan (Fase 2)
   */
  public disposisiKePetugas(officerId: bigint, pawasId: bigint): void {
    if (this.props.status !== 'BELUM_DITANGANI' && this.props.status !== 'MENUNGGU') {
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
    if (this.props.status !== 'DIPROSES' && this.props.status !== 'DISPOSISI' && this.props.status !== 'SEDANG_DITANGANI') {
      throw new Error(`Tiket ${this.props.nomorTiket} belum didisposisikan.`);
    }
    this.props.status = 'MENUJU_TKP';
    this.props.tahap = 3;
    if (fotoBuktiUrl) {
      this.props.fotoPersiapan = fotoBuktiUrl;
    }
    this.props.timelines?.push({
      tahapKe: 1,
      tahapTitle: 'Personel Meluncur ke TKP',
      catatan: catatan || null,
      fotoBuktiUrl,
      gpsLat: lat,
      gpsLng: lng,
      createdAt: new Date(),
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
    photoAddress?: string
  ): void {
    const formattedTitle = isDiscrepancy
      ? 'Tindakan di TKP [ANOMALI LOKASI]'
      : 'Tindakan di Tempat Kejadian (TKP)';

    const combinedNotes = [
      warningMessage,
      catatan ? `Catatan: ${catatan}` : null,
    ].filter(Boolean).join('\n\n') || catatan || null;

    if (this.props.status === 'TIBA_DI_TKP') {
      // Jika personel sudah tercatat tiba di TKP (timestamp kedatangan sudah terkunci),
      // perbarui foto bukti tindakan & catatan laporan dan majukan ke tahap 5 / PENANGANAN_TKP
      if (fotoBuktiUrl) {
        this.props.fotoTindakan = fotoBuktiUrl;
        if (!this.props.fotoTiba) this.props.fotoTiba = fotoBuktiUrl;
      }
      if (catatan) {
        this.props.catatanTindakan = catatan;
      }
      this.props.status = 'PENANGANAN_TKP';
      this.props.tahap = 5;
      this.props.timelines?.push({
        tahapKe: 2,
        tahapTitle: formattedTitle,
        catatan: combinedNotes,
        fotoBuktiUrl,
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

    if (
      this.props.status !== 'MENUJU_TKP' &&
      this.props.status !== 'DIPROSES' &&
      this.props.status !== 'DISPOSISI' &&
      this.props.status !== 'SEDANG_DITANGANI'
    ) {
      throw new Error(`Tiket ${this.props.nomorTiket} tidak dalam status perjalanan ke TKP.`);
    }
    const now = new Date();
    this.props.status = 'TIBA_DI_TKP';
    this.props.tahap = 4;
    this.props.responTibaTkpAt = now;
    if (fotoBuktiUrl) {
      this.props.fotoTiba = fotoBuktiUrl;
      this.props.fotoTindakan = fotoBuktiUrl;
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
      tahapTitle: initialTitle,
      catatan: combinedNotes,
      fotoBuktiUrl,
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
    photoAddress?: string
  ): void {
    const formattedTitle = isDiscrepancy
      ? 'Tindakan di TKP [ANOMALI LOKASI]'
      : 'Tindakan di Tempat Kejadian (TKP)';

    const combinedNotes = [
      warningMessage,
      catatan ? `Catatan: ${catatan}` : null,
    ].filter(Boolean).join('\n\n') || catatan || null;

    this.props.status = 'PENANGANAN_TKP';
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
      tahapTitle: formattedTitle,
      catatan: combinedNotes,
      fotoBuktiUrl,
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
   * Penanganan di TKP Selesai & Terbitkan BAP (Fase 3 - Step 3 Menunggu Pengesahan Pawas)
   */
  public ajukanPengesahanBap(catatan?: string, fotoBuktiUrl?: string): void {
    if (
      this.props.status !== 'TIBA_DI_TKP' &&
      this.props.status !== 'PENANGANAN_TKP' &&
      this.props.status !== 'MENUJU_TKP' &&
      this.props.status !== 'DIPROSES' &&
      this.props.status !== 'DISPOSISI' &&
      this.props.status !== 'SEDANG_DITANGANI'
    ) {
      throw new Error(`Tiket ${this.props.nomorTiket} tidak dalam penanganan TKP.`);
    }
    this.props.status = 'MENUNGGU_PENGESAHAN';
    this.props.tahap = 4;
    if (fotoBuktiUrl) {
      this.props.fotoTindakan = fotoBuktiUrl;
    }
    this.props.timelines?.push({
      tahapKe: 3,
      tahapTitle: 'Penanganan Lapangan Rampung & BAP Diterbitkan',
      catatan: catatan || null,
      fotoBuktiUrl,
      createdAt: new Date(),
    });
  }

  /**
   * Penanganan Tuntas & Pengesahan Kasus oleh Pawas (Fase 4 Selesai)
   */
  public selesaikanKasus(catatan?: string, fotoBuktiUrl?: string): void {
    this.props.status = 'SELESAI';
    this.props.tahap = 5;
    this.props.selesaiAt = new Date();
    if (fotoBuktiUrl) {
      this.props.fotoSelesai = fotoBuktiUrl;
    }
    this.props.timelines?.push({
      tahapKe: 4,
      tahapTitle: 'Kasus Tuntas Selesai Ditangani & Berita Acara Disahkan Pawas',
      catatan: catatan || null,
      fotoBuktiUrl,
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
