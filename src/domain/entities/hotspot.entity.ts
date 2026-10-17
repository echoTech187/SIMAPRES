/**
 * SIMAPRES 110 - DOMAIN ENTITY: HOTSPOT LOCATION
 * Lapisan: Domain (Pure TypeScript, Zero Framework Dependency)
 */

export interface HotspotProps {
  id?: bigint;
  key: string;
  title: string;
  wilayahPolsek: string;
  kategori: string;
  statusBahaya: string;
  ikonEmoji: string;
  lat: number;
  lng: number;
  jadwalMulai: string; // "23:00"
  jadwalSelesai: string; // "04:30"
  jadwalDisplay: string; // "23:00 - 04:30 WIB"
  unitTerdekat: string;
  unitId?: number | null;
  createdBy?: bigint | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class HotspotEntity {
  private props: HotspotProps;

  constructor(props: HotspotProps) {
    this.props = {
      ...props,
      ikonEmoji: props.ikonEmoji || '🔴',
      jadwalMulai: props.jadwalMulai || '23:00',
      jadwalSelesai: props.jadwalSelesai || '04:30',
      jadwalDisplay: props.jadwalDisplay || `${props.jadwalMulai || '23:00'} - ${props.jadwalSelesai || '04:30'} WIB`,
      unitTerdekat: props.unitTerdekat || 'Patroli Samapta 110-A',
      createdAt: props.createdAt || new Date(),
    };
  }

  get id(): bigint | undefined {
    return this.props.id;
  }

  get key(): string {
    return this.props.key;
  }

  get title(): string {
    return this.props.title;
  }

  get wilayahPolsek(): string {
    return this.props.wilayahPolsek;
  }

  get kategori(): string {
    return this.props.kategori;
  }

  get statusBahaya(): string {
    return this.props.statusBahaya;
  }

  get lat(): number {
    return this.props.lat;
  }

  get lng(): number {
    return this.props.lng;
  }

  get jadwalDisplay(): string {
    return this.props.jadwalDisplay;
  }

  public toJSON(): HotspotProps {
    return { ...this.props };
  }
}
