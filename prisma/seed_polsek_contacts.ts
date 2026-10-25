import { prisma } from '../src/infrastructure/db/prisma.client';

export const POLSEK_CONTACTS: Record<string, { phone_piket: string; phone_kapolsek: string }> = {
  'POLRES-PEKALONGAN': { phone_piket: '08112345110', phone_kapolsek: '08122900001' },
  'POLRES_PEKALONGAN_KOTA': { phone_piket: '08112345111', phone_kapolsek: '08122900002' },
  'POLSEK_KAJEN': { phone_piket: '08122511011', phone_kapolsek: '08122900011' },
  'POLSEK_KEDUNGWUNI': { phone_piket: '08122511012', phone_kapolsek: '08122900012' },
  'POLSEK_WIRADESA': { phone_piket: '08122511013', phone_kapolsek: '08122900013' },
  'POLSEK_BOJONG_PEKALONGAN': { phone_piket: '08122511014', phone_kapolsek: '08122900014' },
  'POLSEK_WONOPRINGGO': { phone_piket: '08122511015', phone_kapolsek: '08122900015' },
  'POLSEK_DORO': { phone_piket: '08122511016', phone_kapolsek: '08122900016' },
  'POLSEK_KARANGANYAR_PEKALONGAN': { phone_piket: '08122511017', phone_kapolsek: '08122900017' },
  'POLSEK_SRAGI': { phone_piket: '08122511018', phone_kapolsek: '08122900018' },
  'POLSEK_BUARAN': { phone_piket: '08122511021', phone_kapolsek: '08122900021' },
  'POLSEK_TIRTO': { phone_piket: '08122511022', phone_kapolsek: '08122900022' },
  'POLSEK_PANINGGARAN': { phone_piket: '08122511023', phone_kapolsek: '08122900023' },
  'POLSEK_KANDANGSERANG': { phone_piket: '08122511024', phone_kapolsek: '08122900024' },
  'POLSEK_TALUN_PEKALONGAN': { phone_piket: '08122511027', phone_kapolsek: '08122900027' },
  'POLSEK_PEKALONGAN_BARAT': { phone_piket: '08122511028', phone_kapolsek: '08122900028' },
  'POLSEK_PEKALONGAN_UTARA': { phone_piket: '08122511029', phone_kapolsek: '08122900029' },
  'POLSEK_PEKALONGAN_SELATAN': { phone_piket: '08122511030', phone_kapolsek: '08122900030' },
  'POLSEK_PEKALONGAN_TIMUR': { phone_piket: '08122511031', phone_kapolsek: '08122900031' },
  'POLRESTA_BATANG': { phone_piket: '08112345112', phone_kapolsek: '08122900032' },
};

export async function seedPolsekContacts() {
  console.log('🌱 Updating Polsek Contacts with Official WA Numbers...');
  for (const [code, contact] of Object.entries(POLSEK_CONTACTS)) {
    await (prisma as any).policeStation.updateMany({
      where: { station_code: code },
      data: {
        phone_piket: contact.phone_piket,
        phone_kapolsek: contact.phone_kapolsek,
        is_active: true,
      },
    });
  }
  console.log('✓ Polsek Official Contacts updated successfully.');
}

if (require.main === module) {
  seedPolsekContacts()
    .catch(console.error)
    .finally(() => (prisma as any).$disconnect());
}
