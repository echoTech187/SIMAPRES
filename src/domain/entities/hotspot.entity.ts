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
  ikonEmoji?: string | null;
  lat: number;
  lng: number;
  jadwalMulai?: string | null;
  jadwalSelesai?: string | null;
  jadwalDisplay?: string | null;
  unitTerdekat?: string | null;
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
      ikonEmoji: props.ikonEmoji || '',
      jadwalMulai: props.jadwalMulai ?? '',
      jadwalSelesai: props.jadwalSelesai ?? '',
      jadwalDisplay: props.jadwalDisplay ?? (props.jadwalMulai && props.jadwalSelesai ? `${props.jadwalMulai} - ${props.jadwalSelesai} WIB` : ''),
      unitTerdekat: props.unitTerdekat ?? '',
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
    return this.props.jadwalDisplay as string;
  }

  public toJSON(): HotspotProps {
    return { ...this.props };
  }
}
