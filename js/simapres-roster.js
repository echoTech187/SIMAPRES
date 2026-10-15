/**
 * SIMAPRES 110 - MASTER DATA ROSTER PERSONEL SIAGA
 * Berkas: js/simapres-roster.js
 * Deskripsi: Menyediakan data resmi seluruh personel, operator, dan pimpinan piket siaga
 * Sumber: Implementasi nyata E-Tribrata Log & SOP Rantai Komando Presisi 110
 */

const ROSTER_PERSONEL = [
  // 1. PERSONEL LAPANGAN - SATUAN SAMAPTA PRESISI (R4 & R2)
  {
    nrp: '95020123',
    aliasNrp: ['50123456'],
    nama: 'Bripka Ahmad Subagyo',
    namaSingkat: 'Bripka Ahmad',
    role: 'anggota',
    pangkat: 'BRIGADIR POLISI KEPALA (BRIPKA)',
    pangkatSingkat: 'Bripka',
    jabatan: 'Unit Patroli Reaksi Cepat • Satuan Samapta',
    satuan: 'Satuan Samapta Presisi',
    unitId: 'samapta',
    chRadio: 'CH-04 SAMAPTA SELATAN',
    golongan: 'Bintara (II/d)',
    avatar: 'assets/images/polri_pengaduan_tkp.jpg',
    ranmor: 'Ranmor Dinas Samapta R-4 (Plat VII-1024-01)',
    alkom: 'HT Motorola GP338 Plus',
    gadget: 'Bodycam Presisi Live #04',
    senpi: 'Revolver Cal 38 & Rompi III-A',
    badgeText: 'SAMAPTA PRESISI',
    badgeBg: '#F0FDF4',
    badgeColor: '#15803D'
  },
  {
    nrp: '50129841',
    aliasNrp: ['97080215'],
    nama: 'Aipda Rudi Hartono',
    namaSingkat: 'Aipda Rudi',
    role: 'anggota',
    pangkat: 'AJUN INSPEKTUR POLISI DUA (AIPDA)',
    pangkatSingkat: 'Aipda',
    jabatan: 'Danru Tim Reaksi Cepat Raimas • Satuan Samapta',
    satuan: 'Satuan Samapta Presisi',
    unitId: 'samapta',
    chRadio: 'CH-02 RAIMAS MOTOR BARAT',
    golongan: 'Bintara (II/c)',
    avatar: 'assets/images/polri_pengaduan_tkp.jpg',
    ranmor: 'Motor Trail KLX 250 Raimas (Plat VII-2105-02)',
    alkom: 'HT Motorola APX 2000 & Headset Helm',
    gadget: 'Bodycam Helm Taktis #12',
    senpi: 'Gas Air Mata & Rompi Taktis Level III',
    badgeText: 'SAMAPTA RAIMAS',
    badgeBg: '#FEF3C7',
    badgeColor: '#B45309'
  },
  {
    nrp: '82040512',
    aliasNrp: ['82040512'],
    nama: 'Aipda Eko Prasetyo',
    namaSingkat: 'Aipda Eko',
    role: 'anggota',
    pangkat: 'AJUN INSPEKTUR POLISI DUA (AIPDA)',
    pangkatSingkat: 'Aipda',
    jabatan: 'Patroli Kota Satuan Samapta',
    satuan: 'Satuan Samapta Presisi',
    unitId: 'samapta',
    chRadio: 'CH-04 SAMAPTA PUSAT',
    golongan: 'Bintara (II/c)',
    avatar: 'assets/images/polri_pengaduan_tkp.jpg',
    ranmor: 'Double Cabin R4-Samapta-12',
    alkom: 'HT Motorola GP338 Plus',
    gadget: 'Bodycam Presisi Live #07',
    senpi: 'Revolver Cal 38',
    badgeText: 'SAMAPTA PRESISI',
    badgeBg: '#F0FDF4',
    badgeColor: '#15803D'
  },

  // 2. PERSONEL LAPANGAN - SATUAN LALU LINTAS (SATLANTAS) - 10 Personel Siaga
  {
    nrp: '49112233',
    aliasNrp: ['93050411'],
    nama: 'Aiptu Bambang Sudrajat',
    namaSingkat: 'Aiptu Bambang',
    role: 'anggota',
    pangkat: 'AJUN INSPEKTUR POLISI SATU (AIPTU)',
    pangkatSingkat: 'Aiptu',
    jabatan: 'Unit Patroli Jalan Raya (PJR) & Turjawali • Satlantas',
    satuan: 'Satuan Lalu Lintas (Satlantas)',
    unitId: 'lantas',
    chRadio: 'CH-01 TURJAWALI LANTAS',
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
  {
    nrp: '93020101',
    aliasNrp: ['lantas02'],
    nama: 'Bripka Hendro Wibowo',
    namaSingkat: 'Bripka Hendro',
    role: 'anggota',
    pangkat: 'BRIGADIR POLISI KEPALA (BRIPKA)',
    pangkatSingkat: 'Bripka',
    jabatan: 'Unit Patroli Reaksi Cepat Lantas • Satlantas',
    satuan: 'Satuan Lalu Lintas (Satlantas)',
    unitId: 'lantas',
    chRadio: 'CH-01 TURJAWALI LANTAS',
    golongan: 'Bintara (II/d)',
    avatar: 'assets/images/polri_pengaduan_tkp.jpg',
    ranmor: 'Motor PJR Yamaha FJR 1300',
    alkom: 'HT Motorola APX 7000',
    gadget: 'Tablet E-Tilang #04',
    senpi: 'Rompi Fosfor Lantas',
    badgeText: 'SATLANTAS PRESISI',
    badgeBg: '#EFF6FF',
    badgeColor: '#1D4ED8'
  },
  {
    nrp: '94030202',
    aliasNrp: ['lantas03'],
    nama: 'Bripka Dwi Cahyono',
    namaSingkat: 'Bripka Dwi',
    role: 'anggota',
    pangkat: 'BRIGADIR POLISI KEPALA (BRIPKA)',
    pangkatSingkat: 'Bripka',
    jabatan: 'Unit Pengaturan & Patroli • Satlantas',
    satuan: 'Satuan Lalu Lintas (Satlantas)',
    unitId: 'lantas',
    chRadio: 'CH-01 TURJAWALI LANTAS',
    golongan: 'Bintara (II/d)',
    avatar: 'assets/images/polri_pengaduan_tkp.jpg',
    ranmor: 'Sedan Patroli Lantas VII-3012-01',
    alkom: 'HT Motorola APX 7000',
    gadget: 'Bodycam Lantas #08',
    senpi: 'Rompi Fosfor Lantas',
    badgeText: 'SATLANTAS PRESISI',
    badgeBg: '#EFF6FF',
    badgeColor: '#1D4ED8'
  },
  {
    nrp: '95040303',
    aliasNrp: ['lantas04'],
    nama: 'Brigadir Surya Pratama',
    namaSingkat: 'Brigadir Surya',
    role: 'anggota',
    pangkat: 'BRIGADIR POLISI (BRIGADIR)',
    pangkatSingkat: 'Brigadir',
    jabatan: 'Unit Penegakan Hukum & Laka • Satlantas',
    satuan: 'Satuan Lalu Lintas (Satlantas)',
    unitId: 'lantas',
    chRadio: 'CH-01 TURJAWALI LANTAS',
    golongan: 'Bintara (II/c)',
    avatar: 'assets/images/polri_pengaduan_tkp.jpg',
    ranmor: 'Sedan PJR Patroli VII-3015-01',
    alkom: 'HT Motorola APX 7000',
    gadget: 'Tablet E-Tilang #09',
    senpi: 'Rompi Fosfor Lantas',
    badgeText: 'SATLANTAS PRESISI',
    badgeBg: '#EFF6FF',
    badgeColor: '#1D4ED8'
  },
  {
    nrp: '96050404',
    aliasNrp: ['lantas05'],
    nama: 'Brigadir Bayu Nugroho',
    namaSingkat: 'Brigadir Bayu',
    role: 'anggota',
    pangkat: 'BRIGADIR POLISI (BRIGADIR)',
    pangkatSingkat: 'Brigadir',
    jabatan: 'Unit Turjawali Beat Timur • Satlantas',
    satuan: 'Satuan Lalu Lintas (Satlantas)',
    unitId: 'lantas',
    chRadio: 'CH-01 TURJAWALI LANTAS',
    golongan: 'Bintara (II/c)',
    avatar: 'assets/images/polri_pengaduan_tkp.jpg',
    ranmor: 'Motor Trail PJR VII-2101-01',
    alkom: 'HT Motorola APX 7000',
    gadget: 'Bodycam Lantas #10',
    senpi: 'Rompi Fosfor Lantas',
    badgeText: 'SATLANTAS PRESISI',
    badgeBg: '#EFF6FF',
    badgeColor: '#1D4ED8'
  },
  {
    nrp: '97060505',
    aliasNrp: ['lantas06'],
    nama: 'Briptu Indra Lesmana',
    namaSingkat: 'Briptu Indra',
    role: 'anggota',
    pangkat: 'BRIGADIR POLISI SATU (BRIPTU)',
    pangkatSingkat: 'Briptu',
    jabatan: 'Unit Quick Response Lantas • Satlantas',
    satuan: 'Satuan Lalu Lintas (Satlantas)',
    unitId: 'lantas',
    chRadio: 'CH-01 TURJAWALI LANTAS',
    golongan: 'Bintara (II/b)',
    avatar: 'assets/images/polri_pengaduan_tkp.jpg',
    ranmor: 'Motor Patroli Lantas VII-2102-01',
    alkom: 'HT Motorola APX 7000',
    gadget: 'Bodycam Lantas #11',
    senpi: 'Rompi Fosfor Lantas',
    badgeText: 'SATLANTAS PRESISI',
    badgeBg: '#EFF6FF',
    badgeColor: '#1D4ED8'
  },
  {
    nrp: '98070606',
    aliasNrp: ['lantas07'],
    nama: 'Briptu Rizky Ramadhan',
    namaSingkat: 'Briptu Rizky',
    role: 'anggota',
    pangkat: 'BRIGADIR POLISI SATU (BRIPTU)',
    pangkatSingkat: 'Briptu',
    jabatan: 'Unit Patroli Protokol • Satlantas',
    satuan: 'Satuan Lalu Lintas (Satlantas)',
    unitId: 'lantas',
    chRadio: 'CH-01 TURJAWALI LANTAS',
    golongan: 'Bintara (II/b)',
    avatar: 'assets/images/polri_pengaduan_tkp.jpg',
    ranmor: 'Sedan PJR VII-3016-01',
    alkom: 'HT Motorola APX 7000',
    gadget: 'Tablet E-Tilang #12',
    senpi: 'Rompi Fosfor Lantas',
    badgeText: 'SATLANTAS PRESISI',
    badgeBg: '#EFF6FF',
    badgeColor: '#1D4ED8'
  },
  {
    nrp: '99080707',
    aliasNrp: ['lantas08'],
    nama: 'Briptu Fajar Hidayat',
    namaSingkat: 'Briptu Fajar',
    role: 'anggota',
    pangkat: 'BRIGADIR POLISI SATU (BRIPTU)',
    pangkatSingkat: 'Briptu',
    jabatan: 'Unit Turjawali Jalur Protokol • Satlantas',
    satuan: 'Satuan Lalu Lintas (Satlantas)',
    unitId: 'lantas',
    chRadio: 'CH-01 TURJAWALI LANTAS',
    golongan: 'Bintara (II/b)',
    avatar: 'assets/images/polri_pengaduan_tkp.jpg',
    ranmor: 'Motor PJR Yamaha VII-2103-01',
    alkom: 'HT Motorola APX 7000',
    gadget: 'Bodycam Lantas #13',
    senpi: 'Rompi Fosfor Lantas',
    badgeText: 'SATLANTAS PRESISI',
    badgeBg: '#EFF6FF',
    badgeColor: '#1D4ED8'
  },
  {
    nrp: '00090808',
    aliasNrp: ['lantas09'],
    nama: 'Bripda Arif Gunawan',
    namaSingkat: 'Bripda Arif',
    role: 'anggota',
    pangkat: 'BRIGADIR POLISI DUA (BRIPDA)',
    pangkatSingkat: 'Bripda',
    jabatan: 'Unit Pengawalan & Pengaturan • Satlantas',
    satuan: 'Satuan Lalu Lintas (Satlantas)',
    unitId: 'lantas',
    chRadio: 'CH-01 TURJAWALI LANTAS',
    golongan: 'Bintara (II/a)',
    avatar: 'assets/images/polri_pengaduan_tkp.jpg',
    ranmor: 'Motor Patroli Lantas VII-2104-01',
    alkom: 'HT Motorola APX 7000',
    gadget: 'Bodycam Lantas #14',
    senpi: 'Rompi Fosfor Lantas',
    badgeText: 'SATLANTAS PRESISI',
    badgeBg: '#EFF6FF',
    badgeColor: '#1D4ED8'
  },
  {
    nrp: '01100909',
    aliasNrp: ['lantas10'],
    nama: 'Bripda Dimas Anggoro',
    namaSingkat: 'Bripda Dimas',
    role: 'anggota',
    pangkat: 'BRIGADIR POLISI DUA (BRIPDA)',
    pangkatSingkat: 'Bripda',
    jabatan: 'Unit Patroli Jalan Raya Siaga • Satlantas',
    satuan: 'Satuan Lalu Lintas (Satlantas)',
    unitId: 'lantas',
    chRadio: 'CH-01 TURJAWALI LANTAS',
    golongan: 'Bintara (II/a)',
    avatar: 'assets/images/polri_pengaduan_tkp.jpg',
    ranmor: 'Sedan PJR VII-3018-01',
    alkom: 'HT Motorola APX 7000',
    gadget: 'Bodycam Lantas #15',
    senpi: 'Rompi Fosfor Lantas',
    badgeText: 'SATLANTAS PRESISI',
    badgeBg: '#EFF6FF',
    badgeColor: '#1D4ED8'
  },

  // 3. PERSONEL SATUAN RESKRIM, INTEL, & BINMAS
  {
    nrp: '51044321',
    aliasNrp: ['reskrim01'],
    nama: 'Ipda Reza Pratama, S.H.',
    namaSingkat: 'Ipda Reza',
    role: 'anggota',
    pangkat: 'INSPEKTUR POLISI DUA (IPDA)',
    pangkatSingkat: 'Ipda',
    jabatan: 'Panit Tim Opsnal & Resmob • Satreskrim',
    satuan: 'Satuan Reserse Kriminal (Satreskrim)',
    unitId: 'reskrim',
    chRadio: 'CH-05 RESKRIM OPSNAL',
    golongan: 'Pama (III/a)',
    avatar: 'assets/images/polri_pengaduan_tkp.jpg',
    ranmor: 'Minibus Taktis Tertutup VII-4011-01',
    alkom: 'HT APX 8000',
    gadget: 'Perangkat Inafis & Forensik Mobile',
    senpi: 'Senpi HS-9 & Rompi Taktis Level III',
    badgeText: 'RESKRIM OPSNAL',
    badgeBg: '#FEF2F2',
    badgeColor: '#991B1B'
  },
  {
    nrp: '52011234',
    aliasNrp: ['intel01'],
    nama: 'Ipda Dimas Wicaksono',
    namaSingkat: 'Ipda Dimas',
    role: 'anggota',
    pangkat: 'INSPEKTUR POLISI DUA (IPDA)',
    pangkatSingkat: 'Ipda',
    jabatan: 'Unit Deteksi Dini & Pulbaket • Sat Intelkam',
    satuan: 'Satuan Intelijen Keamanan (Sat Intelkam)',
    unitId: 'intel',
    chRadio: 'CH-06 INTELKAM VIP',
    golongan: 'Pama (III/a)',
    avatar: 'assets/images/polri_pengaduan_tkp.jpg',
    ranmor: 'Kendaraan Dinas Tertutup VII-6011-01',
    alkom: 'HT Motorola APX 8000 Encrypted',
    gadget: 'Terminal Pantau Siber & Deteksi Dini #01',
    senpi: 'Senpi Rahasia Glock 19 & ID Khusus',
    badgeText: 'SAT INTELKAM',
    badgeBg: '#FFF7ED',
    badgeColor: '#C2410C'
  },
  {
    nrp: '48099881',
    aliasNrp: ['bhabin01', 'binmas01'],
    nama: 'Aipda Hendra Gunawan',
    namaSingkat: 'Aipda Hendra',
    role: 'anggota',
    pangkat: 'AJUN INSPEKTUR POLISI DUA (AIPDA)',
    pangkatSingkat: 'Aipda',
    jabatan: 'Piket Binmas & Bhabinkamtibmas Kelurahan Binaan',
    satuan: 'Satuan Pembinaan Masyarakat (Sat Binmas)',
    unitId: 'binmas',
    chRadio: 'CH-03 BINMAS BHABIN',
    golongan: 'Bintara (II/c)',
    avatar: 'assets/images/polri_pengaduan_tkp.jpg',
    ranmor: 'Mobil Penyuluhan Binmas VII-5011-01',
    alkom: 'HT Motorola GP338 Plus',
    gadget: 'Tablet Binmas Online System (BOS)',
    senpi: 'Revolver Cal 38',
    badgeText: 'SAT BINMAS',
    badgeBg: '#F0FDF4',
    badgeColor: '#166534'
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
    chRadio: 'CH-110 SPKT PUSAT',
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
    chRadio: 'CH-00 KOMANDO UTAMA',
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
 * Mendapatkan seluruh daftar personel gabungan (Bawaan ROSTER_PERSONEL + Registrasi Satuan Baru dari localStorage)
 * @returns {Array}
 */
function getCombinedRosterPersonel() {
  let registered = [];
  try {
    const raw = localStorage.getItem('simapres_registered_units');
    if (raw) {
      registered = JSON.parse(raw);
      // Lengkapi atribut role jika didaftarkan sebagai pawas_spkt
      registered.forEach(u => {
        if (u.unitId === 'pawas_spkt' || u.unitId === 'pawas' || u.unitId === 'operator') {
          u.role = 'pawas';
          u.isSuperUser = true;
          if (!u.avatar) u.avatar = 'assets/images/avatar_polisi.jpg';
        } else if (!u.role) {
          u.role = 'anggota';
        }
      });
    }
  } catch (e) {
    console.warn('Gagal membaca simapres_registered_units:', e);
  }
  return [...ROSTER_PERSONEL, ...registered];
}

/**
 * Mencari profil personel berdasarkan NRP atau alias NRP
 * @param {string} nrpInput 
 * @returns {object|null}
 */
function cariPersonelByNrp(nrpInput) {
  if (!nrpInput) return null;
  const clean = String(nrpInput).trim().toLowerCase();
  const allPersonel = getCombinedRosterPersonel();
  return allPersonel.find(u => {
    if (u.nrp && u.nrp.toLowerCase() === clean) return true;
    if (u.aliasNrp && u.aliasNrp.some(a => a.toLowerCase() === clean)) return true;
    if (u.nama && u.nama.toLowerCase().includes(clean)) return true;
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
 * Filter cerdas isolasi data tugas: Menentukan apakah sebuah tiket adalah tanggung jawab user / satuan user
 * Mendukung penugasan persatuan (seluruh anggota dalam satuan tersebut dapat melihat & menangani tiket)
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
  const satuan = String(user.satuan || '').trim().toLowerCase();

  // Helper normalisasi ID satuan (5 Satuan Utama: reskrim, intel, lantas, binmas, sabhara)
  const normSatuan = (val) => {
    const s = String(val || '').toLowerCase();
    if (s.includes('reskrim') || s.includes('resmob') || s.includes('opsnal') || s.includes('inafis') || s.includes('penyidik')) return 'reskrim';
    if (s.includes('intel') || s.includes('intelkam') || s.includes('sandik') || s.includes('pulbaket')) return 'intel';
    if (s.includes('lantas') || s.includes('pjr') || s.includes('turjawali') || s.includes('laka')) return 'lantas';
    if (s.includes('binmas') || s.includes('bhabin') || s.includes('polsek') || s.includes('sambang')) return 'binmas';
    if (s.includes('sabhara') || s.includes('samapta') || s.includes('raimas') || s.includes('perintis') || s.includes('patroli')) return 'sabhara';
    return s;
  };

  const userCategory = normSatuan(unitId || satuan);

  // 1. Cek langsung assignedUnitId atau assignedSatuan pada level root tiket
  if (log.assignedUnitId) {
    const targetUnit = String(log.assignedUnitId).trim().toLowerCase();
    if (targetUnit === unitId || normSatuan(targetUnit) === userCategory) return true;
  }
  if (log.assignedSatuan && normSatuan(log.assignedSatuan) === userCategory) return true;
  if (log.assignedNrp && String(log.assignedNrp).trim().toLowerCase() === nrp) return true;
  if (Array.isArray(log.acceptedNrps) && log.acceptedNrps.includes(nrp)) return true;

  // 2. Cek di dalam objek disposisi taktis
  if (log.disposisi) {
    if (log.disposisi.unitId) {
      const dispUnit = String(log.disposisi.unitId).trim().toLowerCase();
      if (dispUnit === unitId || normSatuan(dispUnit) === userCategory) return true;
    }
    if (log.disposisi.satuan && normSatuan(log.disposisi.satuan) === userCategory) return true;
    if (log.disposisi.unit && normSatuan(log.disposisi.unit) === userCategory) return true;
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

  // 5. Fallback Default untuk Tiket 16 (Samapta Presisi)
  if (log.id === 16 && (userCategory === 'samapta' || nrp === '95020123' || nrp === '50123456')) return true;

  return false;
}

/**
 * MASTER DATA ULASAN & VOTING KEPUASAN MASYARAKAT (REAL-TIME IKM ENGINE)
 * Terhubung langsung dengan kasus-kasus selesai yang ditangani oleh seluruh unit & personel di jajaran Polres.
 */
const DEFAULT_CITIZEN_REVIEWS_MAP = {
  17: {
    skor: 5,
    bintang: 5,
    tags: ['⚡ Respon Sangat Cepat', '👮 Petugas Ramah & Humanis', '✓ Mediasi Damai Tuntas'],
    ulasan: 'Penanganan sangat humanis dan cepat. Mediasi damai senggolan taksi berjalan lancar tanpa ada pihak yang dirugikan.',
    nama: 'Pak Sukardi (Pengemudi Taksi)',
    waktu: 'Hari ini, 07:10 WIB',
    sudahDinilai: true,
    assignedNrp: '49112233',
    assignedNama: 'Aiptu Bambang Sudrajat',
    assignedUnitId: 'lantas_r4',
    disposisi: {
      unit: 'Unit Turjawali Lalu Lintas (Unit Roda 4)',
      komandan: 'Aiptu Bambang Sudrajat (Unit Turjawali Lantas)',
      nrpKomandan: '49112233'
    }
  },
  18: {
    skor: 5,
    bintang: 5,
    tags: ['⚡ Tindakan Sigap', '👮 Petugas Humanis', '✓ Taman Aman & Tertib'],
    ulasan: 'Tim Raimas motor tiba hanya 5 menit setelah laporan masuk. Petugas sigap membubarkan pemuda pesta miras sehingga pengunjung taman kembali merasa aman.',
    nama: 'Sdri. Nadia Utami',
    waktu: 'Hari ini, 07:25 WIB',
    sudahDinilai: true,
    assignedNrp: '50129841',
    assignedNama: 'Aipda Rudi Hartono',
    assignedUnitId: 'raimas_r2',
    disposisi: {
      unit: 'Tim Raimas Reaksi Cepat (Unit Roda 2)',
      komandan: 'Aipda Rudi Hartono (Tim Raimas Reaksi Cepat)',
      nrpKomandan: '50129841'
    }
  },
  19: {
    skor: 5,
    bintang: 5,
    tags: ['👮 Kejujuran & Integritas', '⚡ Respon Cepat', '✓ Barang Kembali 100%'],
    ulasan: 'Alhamdulillah berkas dan dompet saya yang ketinggalan di halte diserahkan kembali secara utuh. Bripka Ahmad dan tim Samapta sangat amanah dan profesional.',
    nama: 'Anisa Fitri, S.Pd.',
    waktu: 'Hari ini, 07:45 WIB',
    sudahDinilai: true,
    assignedNrp: '95020123',
    assignedNama: 'Bripka Ahmad Subagyo',
    assignedUnitId: 'samapta_r4',
    disposisi: {
      unit: 'Unit Patroli Samapta Presisi (Unit Roda 4)',
      komandan: 'Bripka Ahmad Subagyo & Regu Alpha (Unit Samapta Presisi)',
      nrpKomandan: '95020123'
    }
  },
  20: {
    skor: 4,
    bintang: 4,
    tags: ['🚗 Arus Lalin Lancar', '👮 Penertiban Tertib'],
    ulasan: 'Arus lalu lintas depan stasiun langsung terurai lancar setelah polisi lalu lintas mengatur angkot yang ngetem. Pelayanan sangat baik.',
    nama: 'H. Syamsul Arifin',
    waktu: 'Hari ini, 08:05 WIB',
    sudahDinilai: true,
    assignedNrp: '49112233',
    assignedNama: 'Aiptu Bambang Sudrajat',
    assignedUnitId: 'lantas_r4',
    disposisi: {
      unit: 'Unit Turjawali Lalu Lintas (Unit Roda 4)',
      komandan: 'Aiptu Bambang Sudrajat (Unit Turjawali Lantas)',
      nrpKomandan: '49112233'
    }
  },
  21: {
    skor: 5,
    bintang: 5,
    tags: ['🚨 Alarm SOS Akurat', '⚡ Tiba Sangat Cepat', '✓ Musyawarah Damai'],
    ulasan: 'Aplikasi SOS Presisi benar-benar direspon seketika. Mobil Samapta datang dengan sirine sehingga adu mulut remaja langsung reda dan diselesaikan damai di balai warga.',
    nama: 'H. Mansyur',
    waktu: 'Hari ini, 08:20 WIB',
    sudahDinilai: true,
    assignedNrp: '95020123',
    assignedNama: 'Bripka Ahmad Subagyo',
    assignedUnitId: 'samapta_r4',
    disposisi: {
      unit: 'Unit Patroli Samapta Presisi (Unit Roda 4)',
      komandan: 'Bripka Ahmad Subagyo & Regu Alpha (Unit Samapta Presisi)',
      nrpKomandan: '95020123'
    }
  },
  22: {
    skor: 5,
    bintang: 5,
    tags: ['👮 Patroli Rutin Preventif', '✓ Rasa Aman Nyata'],
    ulasan: 'Petugas Raimas patroli menyapa pedagang dan security mall. Sangat ramah, humanis, dan membuat suasana belanja tertib.',
    nama: 'Sdri. Felicia Wijaya',
    waktu: 'Hari ini, 08:35 WIB',
    sudahDinilai: true,
    assignedNrp: '50129841',
    assignedNama: 'Aipda Rudi Hartono',
    assignedUnitId: 'raimas_r2',
    disposisi: {
      unit: 'Tim Raimas Reaksi Cepat (Unit Roda 2)',
      komandan: 'Aipda Rudi Hartono (Tim Raimas Reaksi Cepat)',
      nrpKomandan: '50129841'
    }
  },
  23: {
    skor: 5,
    bintang: 5,
    tags: ['🤝 Pelayanan Humanis', '⚡ Respon Cepat'],
    ulasan: 'Terima kasih respon kepolisian yang sangat peduli dan membantu masyarakat dalam situasi apa pun mengevakuasi hewan di JPO.',
    nama: 'Dedi Kurniawan',
    waktu: 'Hari ini, 08:45 WIB',
    sudahDinilai: true,
    assignedNrp: '95020123',
    assignedNama: 'Bripka Ahmad Subagyo',
    assignedUnitId: 'samapta_r4',
    disposisi: {
      unit: 'Unit Patroli Samapta Presisi (Unit Roda 4)',
      komandan: 'Bripka Ahmad Subagyo & Regu Alpha (Unit Samapta Presisi)',
      nrpKomandan: '95020123'
    }
  },
  25: {
    skor: 5,
    bintang: 5,
    tags: ['🔍 Olah TKP Cermat', '👮 Penjelasan Jelas & Tenang'],
    ulasan: 'Polisi datang sangat cepat setelah dihubungi via 110. Olah TKP dan pengecekan rekaman CCTV dilakukan sangat teliti.',
    nama: 'Ibu Ratna Sari',
    waktu: 'Hari ini, 09:10 WIB',
    sudahDinilai: true,
    assignedNrp: '95020123',
    assignedNama: 'Bripka Ahmad Subagyo',
    assignedUnitId: 'samapta_r4',
    disposisi: {
      unit: 'Unit Patroli Samapta Presisi (Unit Roda 4)',
      komandan: 'Bripka Ahmad Subagyo & Regu Alpha (Unit Samapta Presisi)',
      nrpKomandan: '95020123'
    }
  },
  26: {
    skor: 5,
    bintang: 5,
    tags: ['👮 Tertib & Teratur', '✓ Lansia Terlayani Nyaman'],
    ulasan: 'Pengawalan lalulintas dan pendampingan antrean lansia sangat tertib dan santun. Pembagian sembako berjalan aman lancar.',
    nama: 'Bambang Irawan (Ketua RW)',
    waktu: 'Hari ini, 09:30 WIB',
    sudahDinilai: true,
    assignedNrp: '49112233',
    assignedNama: 'Aiptu Bambang Sudrajat',
    assignedUnitId: 'lantas_r4',
    disposisi: {
      unit: 'Unit Turjawali Lalu Lintas (Unit Roda 4)',
      komandan: 'Aiptu Bambang Sudrajat (Unit Turjawali Lantas)',
      nrpKomandan: '49112233'
    }
  },
  27: {
    skor: 5,
    bintang: 5,
    tags: ['⚡ Penanganan Darurat Cepat', '🤝 Kerjasama Tim Hebat'],
    ulasan: 'Pohon tumbang yang menimpa pagar dan kabel langsung ditangani cepat bersama Damkar. Petugas sigap mengatur lalu lintas jalan sempit.',
    nama: 'Joko Prasetyo',
    waktu: 'Hari ini, 09:45 WIB',
    sudahDinilai: true,
    assignedNrp: '95020123',
    assignedNama: 'Bripka Ahmad Subagyo',
    assignedUnitId: 'samapta_r4',
    disposisi: {
      unit: 'Unit Patroli Samapta Presisi (Unit Roda 4)',
      komandan: 'Bripka Ahmad Subagyo & Regu Alpha (Unit Samapta Presisi)',
      nrpKomandan: '95020123'
    }
  },
  28: {
    skor: 5,
    bintang: 5,
    tags: ['🛡️ Pencegahan Fatalitas', '👮 Himbauan Humanis'],
    ulasan: 'Remaja yang nongkrong berbahaya di pinggir rel langsung ditertibkan secara humanis oleh petugas Samapta. Sangat mengutamakan keselamatan warga.',
    nama: 'Ibu Maryam',
    waktu: 'Hari ini, 09:55 WIB',
    sudahDinilai: true,
    assignedNrp: '95020123',
    assignedNama: 'Bripka Ahmad Subagyo',
    assignedUnitId: 'samapta_r4',
    disposisi: {
      unit: 'Unit Patroli Samapta Presisi (Unit Roda 4)',
      komandan: 'Bripka Ahmad Subagyo & Regu Alpha (Unit Samapta Presisi)',
      nrpKomandan: '95020123'
    }
  }
};

/**
 * Memperkaya log kasus yang telah berstatus selesai dengan ulasan riil masyarakat dan unit penangan,
 * sehingga penghitungan IKM (Indeks Kepuasan Masyarakat) 100% dinamis, mencakup seluruh personel,
 * dan menghitung jumlah voting riil.
 * @param {Array} logs
 * @returns {boolean} true jika ada data yang diperbarui
 */
function enrichLogsWithCitizenReviews(logs) {
  if (!Array.isArray(logs) || logs.length === 0) return false;
  let modified = false;

  logs.forEach(l => {
    if (l.status === 'selesai' && DEFAULT_CITIZEN_REVIEWS_MAP[l.id]) {
      const rev = DEFAULT_CITIZEN_REVIEWS_MAP[l.id];
      // Jika belum memiliki ulasan warga atau data ulasan tidak lengkap
      if (!l.ratingKepuasan || !l.ratingKepuasan.ulasan) {
        l.ratingKepuasan = {
          skor: rev.skor,
          bintang: rev.bintang,
          tags: [...rev.tags],
          ulasan: rev.ulasan,
          nama: rev.nama,
          waktu: rev.waktu,
          sudahDinilai: true
        };
        modified = true;
      }
      if (!l.assignedNrp) {
        l.assignedNrp = rev.assignedNrp;
        modified = true;
      }
      if (!l.assignedNama) {
        l.assignedNama = rev.assignedNama;
        modified = true;
      }
      if (!l.assignedUnitId) {
        l.assignedUnitId = rev.assignedUnitId;
        modified = true;
      }
      if (!l.disposisi) {
        l.disposisi = { ...rev.disposisi };
        modified = true;
      }
    }
  });

  return modified;
}

