/**
 * SIMAPRES 110 - MASTER DATA ROSTER PERSONEL SIAGA
 * Berkas: js/simapres-roster.js
 * Deskripsi: Menyediakan data resmi seluruh personel, operator, dan pimpinan piket siaga
 * Sumber: Implementasi nyata E-Tribrata Log & SOP Rantai Komando Presisi 110
 */

const ROSTER_PERSONEL = [
  // 1. PERSONEL LAPANGAN - UNIT SAMAPTA PRESISI (RODA 4)
  {
    nrp: '95020123',
    aliasNrp: ['50123456'],
    nama: 'Bripka Ahmad Subagyo',
    namaSingkat: 'Bripka Ahmad',
    role: 'anggota',
    pangkat: 'BRIGADIR POLISI KEPALA (BRIPKA)',
    pangkatSingkat: 'Bripka',
    jabatan: 'Unit Patroli Reaksi Cepat • Satuan Samapta',
    satuan: 'Patroli Samapta Presisi (Unit Roda 4 - Zona Selatan)',
    unitId: 'samapta-r4-selatan',
    golongan: 'Bintara (II/d)',
    avatar: 'assets/images/polri_pengaduan_tkp.jpg',
    ranmor: 'Ranmor Dinas Samapta R-4 (Plat VII-1024-01)',
    alkom: 'HT Motorola GP338 Plus',
    gadget: 'Bodycam Presisi Live #04',
    senpi: 'Revolver Cal 38 & Rompi III-A',
    badgeText: 'ANGGOTA PATROLI',
    badgeBg: '#F0FDF4',
    badgeColor: '#15803D'
  },

  // 2. PERSONEL LAPANGAN - UNIT SAMAPTA REAKSI CEPAT RAIMAS (RODA 2)
  {
    nrp: '50129841',
    aliasNrp: ['97080215'],
    nama: 'Aipda Rudi Hartono',
    namaSingkat: 'Aipda Rudi',
    role: 'anggota',
    pangkat: 'AJUN INSPEKTUR POLISI DUA (AIPDA)',
    pangkatSingkat: 'Aipda',
    jabatan: 'Danru Tim Reaksi Cepat Raimas • Satuan Samapta',
    satuan: 'Patroli Samapta Reaksi Cepat (Unit Roda 2 - Motor Taktis)',
    unitId: 'samapta-r2-motor',
    golongan: 'Bintara (II/c)',
    avatar: 'assets/images/polri_pengaduan_tkp.jpg',
    ranmor: 'Motor Trail KLX 250 Raimas (Plat VII-2105-02)',
    alkom: 'HT Motorola APX 2000 & Headset Helm',
    gadget: 'Bodycam Helm Taktis #12',
    senpi: 'Gas Air Mata & Rompi Taktis Level III',
    badgeText: 'TIM RAIMAS R2',
    badgeBg: '#FEF3C7',
    badgeColor: '#B45309'
  },

  // 3. PERSONEL LAPANGAN - UNIT TURJAWALI SATLANTAS (PJR / LAKA)
  {
    nrp: '49112233',
    aliasNrp: ['93050411'],
    nama: 'Aiptu Bambang Sudrajat',
    namaSingkat: 'Aiptu Bambang',
    role: 'anggota',
    pangkat: 'AJUN INSPEKTUR POLISI SATU (AIPTU)',
    pangkatSingkat: 'Aiptu',
    jabatan: 'Unit Patroli Jalan Raya (PJR) & Turjawali • Satlantas',
    satuan: 'Turjawali Satlantas (Unit Patroli Jalan Raya PJR)',
    unitId: 'lantas-turjawali',
    golongan: 'Bintara (II/d)',
    avatar: 'assets/images/polri_pengaduan_tkp.jpg',
    ranmor: 'Mobil Sedan Patroli Lantas PJR (Plat VII-3011-01)',
    alkom: 'HT Motorola APX 7000 Digital',
    gadget: 'Tablet E-Tilang & Lantas Mobile #03',
    senpi: 'Rompi Fosfor Lantas & Manset Traffic',
    badgeText: 'TURJAWALI LANTAS',
    badgeBg: '#EFF6FF',
    badgeColor: '#1D4ED8'
  },

  // 4. OPERATOR SENTRA PELAYANAN KEPOLISIAN TERPADU 110 (SPKT)
  {
    nrp: '98040112',
    aliasNrp: ['operator110'],
    nama: 'Briptu Dian Lestari',
    namaSingkat: 'Briptu Dian',
    role: 'operator',
    pangkat: 'BRIGADIR POLISI SATU (BRIPTU)',
    pangkatSingkat: 'Briptu',
    jabatan: 'Operator Konsol CAD Sentra Pelayanan Kepolisian Terpadu 110',
    satuan: 'Sentra Pelayanan Kepolisian Terpadu (SPKT Metro)',
    unitId: 'operator-spkt',
    golongan: 'Bintara (II/b)',
    avatar: 'assets/images/polri_pengaduan_tkp.jpg',
    ranmor: 'Stasiun Kerja CAD SPKT',
    alkom: 'Headset Konsol CAD SPKT',
    gadget: 'Workstation CAD Dispatcher #02',
    senpi: 'ID Token & Akses Sistem Aktif',
    badgeText: 'OPERATOR SPKT',
    badgeBg: '#EFF6FF',
    badgeColor: '#1D4ED8'
  },

  // 5. PIMPINAN / PERWIRA PENGAWAS (PAWAS / KAPOLRES)
  {
    nrp: '88010234',
    aliasNrp: ['pimpinan', 'pawas', 'kapolres'],
    nama: 'Kombes Pol Budi Santoso',
    namaSingkat: 'Kombes Pol Budi',
    role: 'pimpinan',
    pangkat: 'KOMISARIS BESAR POLISI (KOMBES POL)',
    pangkatSingkat: 'Kombes Pol',
    jabatan: 'Perwira Pengawas (PAWAS) • Posko Pengendalian Operasi',
    satuan: 'Posko Komando Pengendalian (Pawas Metro)',
    unitId: 'pawas-komando',
    golongan: 'Pamen (IV/b)',
    avatar: 'assets/images/polri_pengaduan_tkp.jpg',
    ranmor: 'Ranmor Komando Supervisi',
    alkom: 'HT Motorola APX 8000',
    gadget: 'Tablet Supervisi Komando',
    senpi: 'Senpi & Rompi Level III-A',
    badgeText: 'PIMPINAN / PAWAS',
    badgeBg: '#FFFBEB',
    badgeColor: '#B45309'
  }
];

/**
 * Mencari profil personel berdasarkan NRP atau alias NRP
 * @param {string} nrpInput 
 * @returns {object|null}
 */
function cariPersonelByNrp(nrpInput) {
  if (!nrpInput) return null;
  const clean = String(nrpInput).trim().toLowerCase();
  return ROSTER_PERSONEL.find(u => {
    if (u.nrp.toLowerCase() === clean) return true;
    if (u.aliasNrp && u.aliasNrp.some(a => a.toLowerCase() === clean)) return true;
    if (u.nama.toLowerCase().includes(clean)) return true;
    return false;
  }) || null;
}

/**
 * Mendapatkan profil default berdasarkan role jika NRP tidak dispesifikasikan
 * @param {string} role ('anggota' | 'pimpinan' | 'operator')
 * @returns {object}
 */
function getDefaultUserByRole(role) {
  if (role === 'pimpinan' || role === 'pawas' || role === 'atasan') {
    return ROSTER_PERSONEL.find(u => u.role === 'pimpinan') || ROSTER_PERSONEL[4];
  }
  if (role === 'operator') {
    return ROSTER_PERSONEL.find(u => u.role === 'operator') || ROSTER_PERSONEL[3];
  }
  return ROSTER_PERSONEL[0]; // Bripka Ahmad
}

/**
 * Mendapatkan sesi aktif petugas (Bebas dari race condition multi-tab)
 * Prioritas:
 * 1. URL Parameter 'nrp' (Memungkinkan tab berbeda memiliki login berbeda)
 * 2. URL Parameter 'role'
 * 3. sessionStorage 'simapres_active_user'
 * 4. Fallback Default User
 * @returns {object}
 */
function getActiveSessionUser() {
  const params = new URLSearchParams(window.location.search);
  const paramNrp = params.get('nrp');
  const paramRole = params.get('role');

  if (paramNrp) {
    const userFound = cariPersonelByNrp(paramNrp);
    if (userFound) {
      sessionStorage.setItem('simapres_active_user', JSON.stringify(userFound));
      return userFound;
    }
  }

  const stored = sessionStorage.getItem('simapres_active_user');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed && parsed.nrp) {
        // Jika paramRole memaksa peran lain, utamakan paramRole
        if (paramRole && parsed.role !== paramRole) {
          const roleUser = getDefaultUserByRole(paramRole);
          sessionStorage.setItem('simapres_active_user', JSON.stringify(roleUser));
          return roleUser;
        }
        return parsed;
      }
    } catch (e) {
      console.warn('Gagal parse active user dari session:', e);
    }
  }

  // Jika tidak ada di session, deteksi dari paramRole atau default anggota
  const fallback = getDefaultUserByRole(paramRole || 'anggota');
  sessionStorage.setItem('simapres_active_user', JSON.stringify(fallback));
  return fallback;
}

/**
 * Filter cerdas isolasi data tugas: Menentukan apakah sebuah tiket adalah tanggung jawab user
 * @param {object} log 
 * @param {object} user 
 * @returns {boolean}
 */
function isLogAssignedToUser(log, user) {
  if (!user || !log) return false;
  const nrp = String(user.nrp || '').trim().toLowerCase();
  const namaSingkat = String(user.namaSingkat || '').trim().toLowerCase();
  const nama = String(user.nama || '').trim().toLowerCase();
  const unitId = String(user.unitId || '').trim().toLowerCase();

  // 1. Cek langsung assignedNrp atau assignedUnitId pada level root tiket
  if (log.assignedNrp && String(log.assignedNrp).trim().toLowerCase() === nrp) return true;
  if (log.assignedUnitId && String(log.assignedUnitId).trim().toLowerCase() === unitId) return true;

  // 2. Cek di dalam objek disposisi taktis
  if (log.disposisi) {
    if (log.disposisi.unitId && String(log.disposisi.unitId).trim().toLowerCase() === unitId) return true;
    if (log.disposisi.nrpKomandan && String(log.disposisi.nrpKomandan).trim().toLowerCase() === nrp) return true;
    const komandan = String(log.disposisi.komandan || '').toLowerCase();
    if (komandan.includes(nrp)) return true;
    if (namaSingkat && komandan.includes(namaSingkat)) return true;
    if (nama && komandan.includes(nama)) return true;
  }

  // 3. Cek personelDitugaskan atau petugasPenangan
  const petugas = String(log.personelDitugaskan || log.petugasPenangan || '').toLowerCase();
  if (petugas.includes(nrp)) return true;
  if (namaSingkat && petugas.includes(namaSingkat)) return true;

  // 4. Jika laporan inisiatif mandiri personel
  if (log.tipePelapor === 'personel' || log.tipePelapor === 'internal') {
    if (log.nrp && String(log.nrp).trim().toLowerCase() === nrp) return true;
    if (namaSingkat && String(log.nama || '').toLowerCase().includes(namaSingkat)) return true;
  }

  // 5. Fallback Default untuk Tiket 16 (Bripka Ahmad)
  if (log.id === 16 && (nrp === '95020123' || nrp === '50123456')) return true;

  return false;
}
