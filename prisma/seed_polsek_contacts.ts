import { prisma } from '../src/infrastructure/db/prisma.client';

export const POLSEK_CONTACTS: Record<string, { phone_piket: string; phone_kapolsek?: string }> = {
  'POLRES-PEKALONGAN': { phone_piket: '08112345110', phone_kapolsek: '08122900001' },
  'POLRES_PEKALONGAN_KOTA': { phone_piket: '08112345111', phone_kapolsek: '08122900002' },
  'POLSEK_KAJEN': { phone_piket: '085741111774', phone_kapolsek: '08122900011' }, // KA SPKT: DEDI
  'POLSEK_DORO': { phone_piket: '085642634969', phone_kapolsek: '08122900016' }, // KA SPKT: HUDA
  'POLSEK_PANINGGARAN': { phone_piket: '085201313458', phone_kapolsek: '08122900023' }, // KA SPKT: ARTA
  'POLSEK_SRAGI': { phone_piket: '085869843360', phone_kapolsek: '08122900018' }, // KA SPKT: ARIF
  'POLSEK_PETUNGKRIYONO': { phone_piket: '085701260213' }, // KA SPKT: FAHRUDIN
  'POLSEK_TALUN_PEKALONGAN': { phone_piket: '085730440859', phone_kapolsek: '08122900027' }, // KA SPKT: JUNI
  'POLSEK_WIRADESA': { phone_piket: '085878911703', phone_kapolsek: '08122900013' }, // KA SPKT: PIKET
  'POLSEK_WONOPRINGGO': { phone_piket: '085869231044', phone_kapolsek: '08122900015' }, // KA SPKT: FAJAR
  'POLSEK_KESESI': { phone_piket: '085325421133' }, // KA SPKT: WAWAN
  'POLSEK_KEDUNGWUNI': { phone_piket: '08161366630', phone_kapolsek: '08122900012' }, // KA SPKT: DWI
  'POLSEK_LEBAKBARANG': { phone_piket: '0816613996', phone_kapolsek: '085867620312' }, // KA SPKT: PIKET & GEDE
  'POLSEK_BOJONG_PEKALONGAN': { phone_piket: '082324225009', phone_kapolsek: '08122900014' }, // KA SPKT: KARYOTO
  'POLSEK_KARANGANYAR_PEKALONGAN': { phone_piket: '081575877772', phone_kapolsek: '08122900017' }, // KA SPKT: HERMANTO
  'POLSEK_KANDANGSERANG': { phone_piket: '081393511265', phone_kapolsek: '08122900024' }, // KA SPKT: SIGIT
  'POLSEK_BUARAN': { phone_piket: '08122511021', phone_kapolsek: '08122900021' },
  'POLSEK_TIRTO': { phone_piket: '08122511022', phone_kapolsek: '08122900022' },
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
        ...(contact.phone_kapolsek ? { phone_kapolsek: contact.phone_kapolsek } : {}),
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
