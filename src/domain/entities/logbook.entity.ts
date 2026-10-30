/**
 * SIMAPRES 110 - DOMAIN ENTITY: LOGBOOK ACTIVITY & DUAL-LOCATION AUDIT
 * Lapisan: Domain (Pure TypeScript, Zero Framework Dependency)
 */

export type JenisAksiLogbook = 'PATROLI' | 'TPTKP' | 'SAMBANG' | 'PENGAMANAN' | (string & {});
export type StatusValidasiLogbook = 'BELUM_DIVALIDASI' | 'VALID' | 'FLAGGED_AUDIT' | (string & {});

export interface LogbookOfficerData {
  id?: bigint | number;
  nrp?: string | null;
  rank_pangkat?: string | null;
  jabatan?: string | null;
  user?: {
    full_name?: string | null;
    [key: string]: unknown;
  } | null;
  [key: string]: unknown;
}

export interface LogbookProps {
  id?: bigint;
  officerId: bigint;
  complaintId?: bigint | null;
  jenisAksi: JenisAksiLogbook;
  lokasiKlaimAlamat: string;
  lokasiKlaimLat: number;
  lokasiKlaimLng: number;
  lokasiGpsAktualLat: number;
  lokasiGpsAktualLng: number;
  deviasiMeter: number;
  isDeviasiFlagged: boolean;
  jamMulai: string;
  jamSelesai: string;
  fotoBuktiUrl?: string | null;
  fotoExifLat?: number | null;
  fotoExifLng?: number | null;
  deskripsiKegiatan: string;
  statusValidasi: StatusValidasiLogbook;
  createdAt?: Date;
  officer?: LogbookOfficerData | null;
}

export class LogbookEntity {
  private props: LogbookProps;

  constructor(props: LogbookProps) {
    // Audit deviasi batas toleransi integritas lokasi kepolisian: >= 500 meter = Flagged
    const isFlagged = props.deviasiMeter >= 500;
    this.props = {
      ...props,
      isDeviasiFlagged: isFlagged,
      statusValidasi: props.statusValidasi || (isFlagged ? 'FLAGGED_AUDIT' : 'BELUM_DIVALIDASI'),
      createdAt: props.createdAt || new Date(),
    };
  }

  get id(): bigint | undefined {
    return this.props.id;
  }

  get officerId(): bigint {
    return this.props.officerId;
  }

  get jenisAksi(): JenisAksiLogbook {
    return this.props.jenisAksi;
  }

  get lokasiKlaimAlamat(): string {
    return this.props.lokasiKlaimAlamat;
  }

  get deviasiMeter(): number {
    return this.props.deviasiMeter;
  }

  get isDeviasiFlagged(): boolean {
    return this.props.isDeviasiFlagged;
  }

  get statusValidasi(): StatusValidasiLogbook {
    return this.props.statusValidasi;
  }

  get officer(): LogbookOfficerData | null | undefined {
    return this.props.officer;
  }

  public setValidasi(status: StatusValidasiLogbook): void {
    this.props.statusValidasi = status;
  }

  public toJSON(): LogbookProps {
    return { ...this.props };
  }
}

