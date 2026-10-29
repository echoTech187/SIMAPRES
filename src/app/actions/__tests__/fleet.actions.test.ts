import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPatrolFleetUnitsAction } from '../fleet.actions';
import { prisma } from '@/infrastructure/db/prisma.client';

describe('Server Action Integration: fleet.actions (Patrol Fleet & Telemetry)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getPatrolFleetUnitsAction: queries active officers and returns mapped fleet units', async () => {
    const mockRawOfficer = {
      officer_id: BigInt(88),
      nrp: '88010088',
      rank_pangkat: 'Aipda',
      jabatan: 'Unit Turjawali Sat Lantas',
      assigned_patrol_vehicle: 'Sedan Lantas 110',
      current_gps_lat: -7.0267,
      current_gps_lng: 109.593,
      avatar_url: 'https://avatar.png',
      duty_status: 'DINAS_PATROLI',
      last_gps_heartbeat_at: new Date('2026-10-30T02:00:00Z'),
      device_id: 'DEV-88',
      station_id: 1,
      unit_id: 1,
      full_name: 'Aipda Agus',
      unit_name: 'Satuan Lalu Lintas',
      unit_key: 'lantas',
      station_name: 'Polsek Kajen',
      mako_lat: -7.025,
      mako_lng: 109.592,
      station_address: 'Jl. Manduro',
      lb_lat: null,
      lb_lng: null,
      lb_address: null,
      lb_activity: null,
      dispatch_id: null,
      nomor_tiket: null,
      jenis_kejadian: null,
      tkp_alamat_teks: null,
      tkp_lat: null,
      tkp_lng: null,
      nama_armada: 'Sedan Patroli',
      has_scanned_qr: 1,
      has_vehicle_usage: 1,
    };

    vi.spyOn(prisma, '$queryRaw').mockResolvedValue([mockRawOfficer] as any);

    const result = await getPatrolFleetUnitsAction();

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data.length).toBe(1);
    expect(result.data[0].nrp).toBe('88010088');
    expect(result.data[0].namaLengkap).toBe('Aipda Agus');
    expect(result.data[0].hasScannedQr).toBe(true);
    expect(result.data[0].assignedVehicle).toBe('Sedan Lantas 110');
  });
});
