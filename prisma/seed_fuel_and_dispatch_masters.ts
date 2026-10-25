import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Master Data Anti-Hardcode (Fuel Types, Fuel Claim Statuses, Crew Roles, Dispatch Modes)...');

  // 1. Master Fuel Types
  const fuelTypes = [
    { key: 'SOLAR_DIPA', label: 'Solar / Biosolar (Alokasi DIPA Polri)', default_price_per_liter: 6800.0, icon_emoji: '⛽', display_order: 1 },
    { key: 'PERTALITE', label: 'Pertalite Dinas', default_price_per_liter: 10000.0, icon_emoji: '⛽', display_order: 2 },
    { key: 'PERTAMAX', label: 'Pertamax 92', default_price_per_liter: 12950.0, icon_emoji: '⛽', display_order: 3 },
    { key: 'DEXLITE', label: 'Dexlite Non-Subsidi', default_price_per_liter: 13500.0, icon_emoji: '⛽', display_order: 4 },
    { key: 'PERTAMINA_DEX', label: 'Pertamina Dex Super', default_price_per_liter: 14150.0, icon_emoji: '⛽', display_order: 5 },
  ];

  for (const ft of fuelTypes) {
    await (prisma as any).masterFuelType.upsert({
      where: { key: ft.key },
      update: { label: ft.label, default_price_per_liter: ft.default_price_per_liter, icon_emoji: ft.icon_emoji, display_order: ft.display_order },
      create: ft,
    });
  }
  console.log('✅ MasterFuelType seeded.');

  // 2. Master Fuel Claim Statuses
  const claimStatuses = [
    { key: 'UNCLAIMED', label: 'Terekam GPS (Belum Diajukan)', badge_color: '#64748B', badge_bg: '#F1F5F9', keterangan: 'Jarak riil misi telah dihitung sistem otomatis dan tersimpan di database.', display_order: 1 },
    { key: 'DRAFT_POLSEK', label: 'Draf Pengajuan Polsek', badge_color: '#D97706', badge_bg: '#FEF3C7', keterangan: 'Sedang dikompilasi oleh Bamin SPKT Polsek.', display_order: 2 },
    { key: 'DIAJUKAN_BAGLOG', label: 'Diajukan ke Bag Log', badge_color: '#2563EB', badge_bg: '#EFF6FF', keterangan: 'Telah dikirim digital ke Bagian Logistik Polres untuk verifikasi GPS.', display_order: 3 },
    { key: 'DISETUJUI_BAGLOG', label: 'Disetujui Bag Log', badge_color: '#10B981', badge_bg: '#ECFDF5', keterangan: 'Jarak dan kuota liter terverifikasi sah. Siap pencairan anggaran.', display_order: 4 },
    { key: 'DICAIRKAN', label: 'Dana / Kupon BBM Diterima', badge_color: '#059669', badge_bg: '#D1FAE5', keterangan: 'Dana reimbursement atau voucher BBM telah diterima Polsek.', display_order: 5 },
    { key: 'DITOLAK', label: 'Ditolak / Perlu Revisi', badge_color: '#DC2626', badge_bg: '#FEF2F2', keterangan: 'Data rute atau bukti tindakan dinilai tidak sesuai oleh Bag Log.', display_order: 6 },
  ];

  for (const cs of claimStatuses) {
    await (prisma as any).masterFuelClaimStatus.upsert({
      where: { key: cs.key },
      update: { label: cs.label, badge_color: cs.badge_color, badge_bg: cs.badge_bg, keterangan: cs.keterangan, display_order: cs.display_order },
      create: cs,
    });
  }
  console.log('✅ MasterFuelClaimStatus seeded.');

  // 3. Master Patrol Crew Roles (Buddy System 3.A)
  const crewRoles = [
    { key: 'KATIM_REGU', label: 'Kepala Tim / Ka SPKT Lapangan', description: 'Perwira atau Bintara senior pengendali taktis di lokasi TKP', display_order: 1 },
    { key: 'DRIVER_ARMADA', label: 'Pengemudi Armada Taktis', description: 'Personel yang bertanggung jawab atas kemudi dan keselamatan kendaraan dinas', display_order: 2 },
    { key: 'BINTARA_PENINDAK', label: 'Bintara Penindak / Samapta', description: 'Personel tindakan pertama di tempat kejadian perkara (TPTKP)', display_order: 3 },
    { key: 'BINTARA_PENGAMAN', label: 'Bintara Pengaman TKP / Intel', description: 'Personel pengamanan parameter dan pengawasan situasi sekitar TKP', display_order: 4 },
    { key: 'PENYIDIK_PEMBANTU', label: 'Penyidik Pembantu / Reskrim', description: 'Personel pencatatan identitas saksi, korban, dan pengamanan barang bukti', display_order: 5 },
    { key: 'BAMIN_SIAGA', label: 'Bamin Piket / Penjaga Mako', description: 'Personel yang mutlak standby di meja SPKT menjaga markas komando', display_order: 6 },
  ];

  for (const cr of crewRoles) {
    await (prisma as any).masterPatrolCrewRole.upsert({
      where: { key: cr.key },
      update: { label: cr.label, description: cr.description, display_order: cr.display_order },
      create: cr,
    });
  }
  console.log('✅ MasterPatrolCrewRole seeded.');

  // 4. Master Dispatch Modes
  const dispatchModes = [
    { key: 'UNIT_PIKET_POLSEK', label: 'Unit Piket Polsek (Kewilayahan)', description: 'Disposisi terdistribusi ke posko/meja piket Polsek terdekat sesuai zona wilayah hukum', display_order: 1 },
    { key: 'PATROLI_PRESISI_MAKO', label: 'Patroli Siaga Presisi Mako Polres', description: 'Pengerahan tim taktis mobile Raimas / Resmob Polres Pekalongan', display_order: 2 },
    { key: 'GABUNGAN_RAYON', label: 'BKO Gabungan Rayon Lintas Polsek', description: 'Pengerahan gabungan 2-3 Polsek bersebelahan untuk eskalasi skala sedang', display_order: 3 },
    { key: 'KONTINJENSI_POLRES', label: 'Kontinjensi Total Polres', description: 'Pengerahan kompi siaga dalmas dan peleton siaga mako', display_order: 4 },
  ];

  for (const dm of dispatchModes) {
    await (prisma as any).masterDispatchMode.upsert({
      where: { key: dm.key },
      update: { label: dm.label, description: dm.description, display_order: dm.display_order },
      create: dm,
    });
  }
  console.log('✅ MasterDispatchMode seeded.');

  // 5. Update existing patrol vehicles with fuel relations
  const solarDipa = await (prisma as any).masterFuelType.findUnique({ where: { key: 'SOLAR_DIPA' } });
  const pertalite = await (prisma as any).masterFuelType.findUnique({ where: { key: 'PERTALITE' } });

  if (solarDipa) {
    await (prisma as any).patrolVehicle.updateMany({
      where: { jenis_kendaraan: 'RODA_4' },
      data: {
        fuel_type_id: solarDipa.id,
        fuel_ratio_km_per_liter: 8.0,
      },
    });
  }

  if (pertalite) {
    await (prisma as any).patrolVehicle.updateMany({
      where: { jenis_kendaraan: 'RODA_2' },
      data: {
        fuel_type_id: pertalite.id,
        fuel_ratio_km_per_liter: 35.0,
      },
    });
  }
  console.log('✅ PatrolVehicle fuel profiles updated.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log('Seeding Master Data Anti-Hardcode Completed Successfully!');
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
