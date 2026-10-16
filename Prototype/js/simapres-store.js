/**
 * SIMAPRES 110 - CENTRAL DATA STORE & PERSISTENCE ENGINE
 * Berkas: js/simapres-store.js
 * Deskripsi: Mengelola database lokal terpusat (LocalStorage), siklus hidup tiket,
 *            dan helper filter kepemilikan tugas per personel (Data Ownership Isolation).
 */

var STORAGE_KEY_LOGS = window.STORAGE_KEY_LOGS || 'simapres_app_logs_v1';

// SVGs Standar Dokumen Bukti & Avatar
var SVG_AVATAR_WARGA = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <circle cx="50" cy="50" r="50" fill="#E2E8F0"/>
  <circle cx="50" cy="38" r="20" fill="#64748B"/>
  <path d="M18 86 C18 64 32 58 50 58 C68 58 82 64 82 86 Z" fill="#64748B"/>
</svg>
`)}`;

var SVG_FALLBACK_PENGADUAN = window.SVG_FALLBACK_PENGADUAN || `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="400" height="240">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1E293B"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>
  </defs>
  <rect width="400" height="240" fill="url(#grad1)"/>
  <circle cx="200" cy="85" r="32" fill="#334155"/>
  <text x="200" y="93" fill="#60A5FA" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif" font-size="24" font-weight="800" text-anchor="middle">110</text>
  <text x="200" y="145" fill="#F8FAFC" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif" font-size="13" font-weight="700" text-anchor="middle">BUKTI LAPORAN WARGA</text>
  <text x="200" y="168" fill="#94A3B8" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif" font-size="11" text-anchor="middle">Dokumentasi Call Center 110 Terverifikasi</text>
  <rect x="130" y="186" width="140" height="24" rx="12" fill="rgba(59,130,246,0.2)"/>
  <text x="200" y="202" fill="#60A5FA" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif" font-size="10.5" font-weight="700" text-anchor="middle">✓ BUKTI TERVERIFIKASI</text>
</svg>
`)}`;

var SVG_FALLBACK_TINDAKAN = window.SVG_FALLBACK_TINDAKAN || `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="400" height="240">
  <defs>
    <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#064E3B"/>
      <stop offset="100%" stop-color="#022C22"/>
    </linearGradient>
  </defs>
  <rect width="400" height="240" fill="url(#grad2)"/>
  <circle cx="200" cy="85" r="32" fill="#065F46"/>
  <path d="M190 85 L197 92 L212 77" stroke="#34D399" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <text x="200" y="145" fill="#F8FAFC" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif" font-size="13" font-weight="700" text-anchor="middle">TINDAKAN PETUGAS TKP</text>
  <text x="200" y="168" fill="#A7F3D0" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif" font-size="11" text-anchor="middle">Dokumentasi Respon Lapangan Presisi</text>
  <rect x="130" y="186" width="140" height="24" rx="12" fill="rgba(16,185,129,0.2)"/>
  <text x="200" y="202" fill="#34D399" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif" font-size="10.5" font-weight="700" text-anchor="middle">✓ PERSONEL DI LOKASI</text>
</svg>
`)}`;

var SVG_FALLBACK_PERSIAPAN = window.SVG_FALLBACK_PERSIAPAN || `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="400" height="240">
  <defs>
    <linearGradient id="gradP" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1E3A8A"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>
  </defs>
  <rect width="400" height="240" fill="url(#gradP)"/>
  <circle cx="200" cy="85" r="32" fill="#1E40AF"/>
  <path d="M190 85 L200 70 L210 85 L203 85 L203 100 L197 100 L197 85 Z" fill="#93C5FD"/>
  <text x="200" y="145" fill="#F8FAFC" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif" font-size="13" font-weight="700" text-anchor="middle">PERSIAPAN & MELUNCUR</text>
  <text x="200" y="168" fill="#93C5FD" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif" font-size="11" text-anchor="middle">Dokumentasi Personel & GPS Terkunci</text>
  <rect x="120" y="186" width="160" height="24" rx="12" fill="rgba(59,130,246,0.2)"/>
  <text x="200" y="202" fill="#93C5FD" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif" font-size="10.5" font-weight="700" text-anchor="middle">✓ GPS & ARMADA SIAGA</text>
</svg>
`)}`;

// Daftar Satuan Tugas / Satker Presisi untuk Disposisi CAD Pawas (5 Satuan Utama)
var DAFTAR_ARMADA_PRESISI = window.DAFTAR_ARMADA_PRESISI || [
  {
    id: 'reskrim',
    satuanId: 'reskrim',
    nama: 'Satuan Reserse Kriminal (Satreskrim • Opsnal & Resmob)',
    namaSingkat: 'Sat Reskrim',
    satuan: 'Satuan Reserse Kriminal (Satreskrim)',
    sektorUtama: 'Pusat Komando',
    komandan: 'Ipda Reza Pratama, S.H. (Panit Opsnal)',
    nrpKomandan: '51044321',
    posisiSaatIni: 'Mako Polres (Standby Tim Tindak Gakkum Resmob)',
    kekuatan: 'Siaga 8 Personel Opsnal • Minibus Taktis • Senpi HS-9 & Kit Olah TKP Inafis',
    jarakBase: 2.1,
    etaBase: 5,
    icon: '🕵️'
  },
  {
    id: 'intel',
    satuanId: 'intel',
    nama: 'Satuan Intelijen Keamanan (Sat Intelkam • Deteksi Dini & Pulbaket)',
    namaSingkat: 'Sat Intelkam',
    satuan: 'Satuan Intelijen Keamanan (Sat Intelkam)',
    sektorUtama: 'Wilayah Hukum Polres',
    komandan: 'Ipda Dimas Wicaksono (Unit Analis Intel)',
    nrpKomandan: '52011234',
    posisiSaatIni: 'Wilayah Pantau Tertutup & Mako Sat Intelkam',
    kekuatan: 'Siaga 6 Personel Tertutup • Alkom Terenkripsi • Alat Pantau Siber & Deteksi Dini',
    jarakBase: 1.8,
    etaBase: 4,
    icon: '👁️'
  },
  {
    id: 'lantas',
    satuanId: 'lantas',
    nama: 'Satuan Lalu Lintas (Satlantas • Turjawali & PJR)',
    namaSingkat: 'Satlantas (Turjawali)',
    satuan: 'Satuan Lalu Lintas (Satlantas)',
    sektorUtama: 'Sektor Barat & Jalur Protokol',
    komandan: 'Aiptu Bambang Sudrajat (Piket Turjawali Lantas)',
    nrpKomandan: '49112233',
    posisiSaatIni: 'Pos Pol Koridor Protokol Sudirman - Thamrin',
    kekuatan: 'Siaga 10 Personel • Mobil Sedan PJR & Motor Patwal • Traffic Kit • Bodycam Live',
    jarakBase: 1.5,
    etaBase: 4,
    icon: '🚓'
  },
  {
    id: 'binmas',
    satuanId: 'binmas',
    nama: 'Satuan Pembinaan Masyarakat (Sat Binmas & Bhabinkamtibmas)',
    namaSingkat: 'Sat Binmas',
    satuan: 'Satuan Pembinaan Masyarakat (Sat Binmas)',
    sektorUtama: 'Sektor Timur & Kelurahan Binaan',
    komandan: 'Aipda Hendra Gunawan (Piket Binmas Bhabinkamtibmas)',
    nrpKomandan: '48099881',
    posisiSaatIni: 'Balai Warga / Kelurahan Binaan Bhabinkamtibmas',
    kekuatan: 'Siaga 6 Personel Sambang • Mobil Penyuluhan Binmas • Tablet BOS • Mediasi Warga',
    jarakBase: 2.5,
    etaBase: 6,
    icon: '🤝'
  },
  {
    id: 'sabhara',
    satuanId: 'sabhara',
    nama: 'Satuan Sabhara / Samapta Presisi (Patroli Perintis Presisi & Raimas)',
    namaSingkat: 'Sat Sabhara',
    satuan: 'Satuan Samapta Bhayangkara (Sabhara)',
    sektorUtama: 'Sektor Selatan & Rute Patroli Beat',
    komandan: 'Bripka Ahmad Subagyo (Piket Sabhara Perintis)',
    nrpKomandan: '95020123',
    posisiSaatIni: 'Pos Pantau Senayan / Patroli Mobile Beat Sabhara',
    kekuatan: 'Siaga 10 Personel • Armada R4 Sedan & R2 Trail Raimas • Senpi V2 • Bodycam Live',
    jarakBase: 1.2,
    etaBase: 3,
    icon: '🚔'
  }
];

function formatWaktuHhMmWib() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${hh}:${mm} WIB`;
}

function getFotoPengaduanByKategori(log) {
  if (!log) return 'assets/images/polri_pengaduan_tkp.jpg';
  const t = ((log.title || '') + ' ' + (log.jenisInsiden || '') + ' ' + (log.kategoriInsiden || '') + ' ' + (log.deskripsi || '') + ' ' + (log.lokasiKejadian || '')).toLowerCase();

  if (t.includes('tawuran') || t.includes('sajam') || t.includes('senjata') || t.includes('preman') || t.includes('pungli') || t.includes('kerumunan') || t.includes('rel kereta') || t.includes('karang taruna')) {
    return 'assets/images/polri_insiden_tawuran.jpg';
  }
  if (t.includes('curanmor') || t.includes('motor') || t.includes('helm') || t.includes('curian') || t.includes('kotak amal') || t.includes('pencurian') || t.includes('kriminalitas')) {
    return 'assets/images/polri_insiden_curanmor.jpg';
  }
  if (t.includes('pohon') || t.includes('tumbang') || t.includes('bencana') || t.includes('kabel') || t.includes('banjir')) {
    return 'assets/images/polri_insiden_pohontumbang.jpg';
  }
  if (t.includes('laka') || t.includes('tabrakan') || t.includes('truk') || t.includes('angkot') || t.includes('senggolan') || t.includes('rem blong') || t.includes('lalu lintas')) {
    return 'assets/images/polri_insiden_lakalantas.jpg';
  }
  if (t.includes('atm') || t.includes('bank') || t.includes('mall') || t.includes('perbankan') || t.includes('vital') || t.includes('skimming')) {
    return 'assets/images/polri_insiden_patroli_obvit.jpg';
  }
  if (t.includes('miras') || t.includes('oplosan') || t.includes('parkir') || t.includes('kafe') || t.includes('bising') || t.includes('cekcok')) {
    return 'assets/images/polri_insiden_miras_oplosan.jpg';
  }
  if (t.includes('anak') || t.includes('balita') || t.includes('dompet') || t.includes('hewan') || t.includes('bansos') || t.includes('sosial') || t.includes('hilang') || t.includes('kemanusiaan')) {
    return 'assets/images/polri_insiden_pelayanan_publik.jpg';
  }
  return 'assets/images/polri_pengaduan_tkp.jpg';
}

// Standar Tugas Pokok & Fungsi Satuan Operasional Polri (Berdasarkan SOP Resmi & Arahan Klien)
var TUPOKSI_SATUAN_POLRI = {
  reskrim: {
    id: 'reskrim',
    nama: 'Satuan Reserse Kriminal (Sat Reskrim)',
    namaSingkat: 'Sat Reskrim',
    icon: '🕵️',
    tupoksi: 'Melakukan olah TKP, penyelidikan, penyidikan, penangkapan tersangka, dan penyelesaian berkas perkara pidana untuk diserahkan ke kejaksaan.',
    arahanDefault: 'Segera datangi TKP, pasang garis polisi (Police Line), lakukan olah TKP awal dan identifikasi Inafis, kumpulkan barang bukti, serta lakukan pengejaran terhadap pelaku tindak pidana.'
  },
  intel: {
    id: 'intel',
    nama: 'Satuan Intelijen Keamanan (Sat Intelkam)',
    namaSingkat: 'Sat Intelkam',
    icon: '👁️',
    tupoksi: 'Melakukan deteksi dini potensi gangguan keamanan (early warning), memetakan konflik, serta melayani perizinan keramaian.',
    arahanDefault: 'Lakukan penggalangan dan pulbaket tertutup, petakan aktor penggerak dan eskalasi massa, pantau pergerakan situasi serta laporkan perkembangan berkala ke Posko Intel.'
  },
  lantas: {
    id: 'lantas',
    nama: 'Satuan Lalu Lintas (Sat Lantas)',
    namaSingkat: 'Satlantas',
    icon: '🚓',
    tupoksi: 'Mengatur kelancaran lalu lintas, menindak pelanggaran, serta menangani kecelakaan jalan raya.',
    arahanDefault: 'Prioritaskan evakuasi dan pertolongan korban laka lantas, amankan dan tandai posisi ranmor di TKP, lakukan rekayasa lalu lintas dan urai simpul kemacetan.'
  },
  sabhara: {
    id: 'sabhara',
    nama: 'Satuan Sabhara / Samapta Presisi (Sat Samapta)',
    namaSingkat: 'Sat Samapta',
    icon: '🚔',
    tupoksi: 'Melakukan patroli pencegahan kejahatan di area rawan, pengamanan objek vital, serta pengendalian massa (Dalmas) saat unjuk rasa atau gangguan nyata.',
    arahanDefault: 'Nyalakan rotator sirine biru (Blue Light Patrol), datangi TKP < 10 menit, lakukan tindakan preventif pembubaran/pengamanan perimeter, serta lindungi warga sekitar.'
  },
  binmas: {
    id: 'binmas',
    nama: 'Satuan Pembinaan Masyarakat (Sat Binmas)',
    namaSingkat: 'Sat Binmas',
    icon: '🤝',
    tupoksi: 'Melakukan problem solving kamtibmas, mediasi warga, sambang kemasyarakatan, serta penyuluhan hukum.',
    arahanDefault: 'Lakukan pendekatan humanis, dampingi tokoh masyarakat / perangkat RT/RW untuk problem solving mediasi damai, dan jaga kondusifitas lingkungan warga.'
  }
};

/**
 * Menentukan Satuan Utama (Primary) dan Satuan Pendukung (Secondary) sesuai SOP Tupoksi
 */
function getSopRecommendationByIncident(log) {
  if (!log) return { primarySatuanId: 'sabhara', secondarySatuanId: 'binmas', kategoriLabel: 'Kamtibmas Umum' };

  const text = ((log.title || '') + ' ' + (log.jenisInsiden || '') + ' ' + (log.kategoriInsiden || '') + ' ' + (log.deskripsi || '')).toLowerCase();

  // 1. Kamseltibcarlantas (Laka, macet, tabrakan, balap liar) -> Utama: Lantas, Pendukung: Sabhara
  if (text.includes('laka') || text.includes('tabrakan') || text.includes('macet') || text.includes('lalu lintas') || text.includes('derek') || text.includes('rem blong') || text.includes('senggolan') || text.includes('balap liar')) {
    return {
      primarySatuanId: 'lantas',
      secondarySatuanIds: ['sabhara'],
      kategoriLabel: 'Kamseltibcarlantas',
      alasanSop: 'SOP Sat Lantas (Utama) & Sat Samapta (Pendukung pengamanan jalur).'
    };
  }

  // 2. Tindak Pidana & Kriminalitas (Curanmor, curas, sajam, pencurian, pembegalan) -> Utama: Reskrim, Pendukung: Sabhara, Intelkam
  if (text.includes('curanmor') || text.includes('curas') || text.includes('curat') || text.includes('pencuri') || text.includes('curian') || text.includes('rampok') || text.includes('senjata tajam') || text.includes('sajam') || text.includes('begal') || text.includes('penodong') || text.includes('narkoba') || text.includes('penjambret') || text.includes('tindak pidana') || text.includes('bobol') || text.includes('kotak amal')) {
    return {
      primarySatuanId: 'reskrim',
      secondarySatuanIds: ['sabhara', 'intel'],
      kategoriLabel: 'Tindak Pidana & Kriminalitas',
      alasanSop: 'SOP Sat Reskrim (Utama) didukung Sat Samapta & Sat Intelkam.'
    };
  }

  // 3. Potensi Konflik & Deteksi Dini (Isu SARA, provokasi, unjuk rasa, demo, intel) -> Utama: Intelkam, Pendukung: Binmas, Sabhara
  if (text.includes('intel') || text.includes('konflik') || text.includes('sara') || text.includes('provokasi') || text.includes('unjuk rasa') || text.includes('demo') || text.includes('keramaian') || text.includes('izin') || text.includes('ancaman bom') || text.includes('deteksi')) {
    return {
      primarySatuanId: 'intel',
      secondarySatuanIds: ['binmas', 'sabhara'],
      kategoriLabel: 'Potensi Konflik & Deteksi Dini',
      alasanSop: 'SOP Sat Intelkam (Utama) didukung Sat Binmas & Sat Samapta.'
    };
  }

  // 4. Kemasyarakatan & Problem Solving (Mediasi warga, sengketa, anak hilang, bansos) -> Utama: Binmas, Pendukung: Sabhara
  if (text.includes('mediasi') || text.includes('problem solving') || text.includes('sengketa') || text.includes('keluarga') || text.includes('anak hilang') || text.includes('tetangga') || text.includes('bantuan') || text.includes('sosial') || text.includes('bansos')) {
    return {
      primarySatuanId: 'binmas',
      secondarySatuanIds: ['sabhara'],
      kategoriLabel: 'Kemasyarakatan & Problem Solving',
      alasanSop: 'SOP Sat Binmas (Utama) didukung Sat Samapta.'
    };
  }

  // 5. Bencana & Situasi Darurat Khusus (Pohon tumbang, banjir, kebakaran, evakuasi) -> Utama: Samapta (SAR), Pendukung: Lantas
  if (text.includes('pohon') || text.includes('tumbang') || text.includes('bencana') || text.includes('banjir') || text.includes('kebakaran') || text.includes('evakuasi') || text.includes('sar')) {
    return {
      primarySatuanId: 'sabhara',
      secondarySatuanIds: ['lantas'],
      kategoriLabel: 'Bencana & Situasi Darurat Khusus',
      alasanSop: 'SOP Sat Samapta / SAR Presisi (Utama) didukung Sat Lantas untuk pengalihan arus.'
    };
  }

  // 6. Kamtibmas & Gangguan Nyata (Tawuran, miras, pungli, keributan warga) -> Utama: Samapta, Pendukung: Binmas, Reskrim
  return {
    primarySatuanId: 'sabhara',
    secondarySatuanIds: ['binmas', 'reskrim'],
    kategoriLabel: 'Kamtibmas & Gangguan Nyata',
    alasanSop: 'SOP Sat Samapta (Utama) didukung Sat Binmas & Sat Reskrim.'
  };
}

function hitungEstimasiArmadaUntukLog(log) {
  const sektor = (log.sektor || 'Sektor Selatan').toLowerCase();
  const sop = getSopRecommendationByIncident(log);

  return DAFTAR_ARMADA_PRESISI.map(armada => {
    let multiplier = 1.0;
    if (armada.sektorUtama.toLowerCase().includes(sektor.replace('sektor ', ''))) {
      multiplier = 0.8;
    } else {
      multiplier = 1.4;
    }

    const isPrimarySop = armada.id === sop.primarySatuanId || armada.satuanId === sop.primarySatuanId;
    const isSecondarySop = Array.isArray(sop.secondarySatuanIds)
      ? sop.secondarySatuanIds.some(sid => armada.id === sid || armada.satuanId === sid)
      : (armada.id === sop.secondarySatuanId || armada.satuanId === sop.secondarySatuanId);

    // Satuan yang sesuai SOP mendapatkan prioritas respon waktu dan jarak operasional
    if (isPrimarySop) {
      multiplier *= 0.7;
    } else if (isSecondarySop) {
      multiplier *= 0.85;
    }

    const jarak = (armada.jarakBase * multiplier).toFixed(1);
    const eta = Math.max(2, Math.round(armada.etaBase * multiplier));

    return {
      ...armada,
      jarakKm: parseFloat(jarak),
      jarakCalc: parseFloat(jarak),
      jarakTeks: `${jarak} km`,
      etaMenit: eta,
      etaCalc: eta,
      etaTeks: `± ${eta} Menit`,
      isSlaAman: eta <= 10,
      isSektorSama: armada.sektorUtama.toLowerCase().includes(sektor.replace('sektor ', '')),
      isPrimarySop: isPrimarySop,
      isSecondarySop: isSecondarySop,
      sopRole: isPrimarySop ? 'PRIMARY' : (isSecondarySop ? 'SECONDARY' : 'STANDBY'),
      sopInfo: TUPOKSI_SATUAN_POLRI[armada.satuanId || armada.id] || null
    };
  }).sort((a, b) => {
    // Urutkan: Satuan Utama SOP lebih dulu, lalu jarak terdekat
    if (a.isPrimarySop && !b.isPrimarySop) return -1;
    if (!a.isPrimarySop && b.isPrimarySop) return 1;
    if (a.isSecondarySop && !b.isSecondarySop) return -1;
    if (!a.isSecondarySop && b.isSecondarySop) return 1;
    return a.jarakKm - b.jarakKm;
  });
}


function enrichLogOperationalHistory(l) {
  if (!l) return;
  const parseMin = (str) => {
    if (!str) return 0;
    const m = String(str).match(/(\d{1,2}):(\d{2})/);
    return m ? (parseInt(m[1], 10) * 60 + parseInt(m[2], 10)) : 0;
  };
  const formatMin = (mins) => {
    const h = Math.floor(((mins % 1440) + 1440) % 1440 / 60);
    const m = Math.floor(((mins % 1440) + 1440) % 1440 % 60);
    return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ' WIB';
  };

  const resolvePetugasDefault = (logItem) => {
    if (logItem.assignedNama) {
      return {
        nama: logItem.assignedNama,
        nrp: logItem.assignedNrp || '95020123',
        unit: logItem.assignedUnitId || 'Patroli Samapta Presisi R4',
        unitId: logItem.assignedUnitId || 'samapta-r4-selatan'
      };
    }
    if (logItem.disposisi?.komandan) {
      const nrpKom = logItem.disposisi.nrpKomandan || '95020123';
      return {
        nama: logItem.disposisi.komandan.split('(')[0].trim(),
        nrp: nrpKom,
        unit: logItem.disposisi.unit || 'Unit Patroli Presisi',
        unitId: logItem.disposisi.unitId || 'samapta-r4-selatan'
      };
    }
    const sektorStr = (logItem.sektor || '').toLowerCase();
    if (sektorStr.includes('selatan')) {
      return { nama: 'Bripka Ahmad Subagyo', nrp: '95020123', unit: 'Patroli Samapta Presisi (Unit Roda 4 - Zona Selatan)', unitId: 'samapta-r4-selatan' };
    }
    if (sektorStr.includes('barat')) {
      return { nama: 'Aipda Rudi Hartono', nrp: '50129841', unit: 'Patroli Samapta Reaksi Cepat (Unit Roda 2 - Motor Taktis)', unitId: 'samapta-r2-motor' };
    }
    if (sektorStr.includes('pusat')) {
      return { nama: 'Aiptu Bambang Sudrajat', nrp: '49112233', unit: 'Turjawali Satlantas Presisi (Unit Pengurai Kemacetan)', unitId: 'lantas-turjawali' };
    }
    if (sektorStr.includes('timur')) {
      return { nama: 'Aipda Rudi Hartono', nrp: '50129841', unit: 'Samapta Raimas R2 (Motor Taktis)', unitId: 'samapta-r2-motor' };
    }
    if (sektorStr.includes('utara')) {
      return { nama: 'Bripka Ahmad Subagyo', nrp: '95020123', unit: 'Patroli Samapta R4 (Zona Selatan)', unitId: 'samapta-r4-selatan' };
    }
    return { nama: 'Bripka Ahmad Subagyo', nrp: '95020123', unit: 'Patroli Samapta R4', unitId: 'samapta-r4-selatan' };
  };

  if (l.status === 'selesai') {
    const waktuSelesaiStr = l.pengesahanPawas?.waktu || l.waktuSelesai || l.waktu || '09:00 WIB';
    const totalMins = parseMin(waktuSelesaiStr);
    const petugasInfo = resolvePetugasDefault(l);

    if (!l.waktuSelesai) l.waktuSelesai = waktuSelesaiStr;
    if (!l.waktuTiba) l.waktuTiba = formatMin(totalMins - 12);
    if (!l.waktuMeluncur) l.waktuMeluncur = formatMin(totalMins - 20);

    l.assignedNrp = petugasInfo.nrp;
    l.assignedNama = petugasInfo.nama;
    l.assignedUnitId = petugasInfo.unitId;

    if (!l.slaMenit) {
      const mel = parseMin(l.waktuMeluncur);
      const tib = parseMin(l.waktuTiba);
      l.slaMenit = (tib > mel && (tib - mel) <= 30) ? (tib - mel) : 5;
      l.sla = `${l.slaMenit}.0 Menit`;
    }

    if (!l.disposisi) {
      l.disposisi = {
        unit: petugasInfo.unit,
        unitId: petugasInfo.unitId,
        komandan: `${petugasInfo.nama} (NRP: ${petugasInfo.nrp})`,
        nrpKomandan: petugasInfo.nrp,
        waktuDisposisi: formatMin(totalMins - 25),
        estimasiJarak: '1.4 km',
        estimasiEta: '± 5 Menit',
        arahan: 'Respon cepat laporan "' + (l.title || l.jenisInsiden || 'Kamtibmas') + '", amankan lokasi.'
      };
    } else {
      if (!l.disposisi.nrpKomandan) l.disposisi.nrpKomandan = petugasInfo.nrp;
      if (!l.disposisi.unitId) l.disposisi.unitId = petugasInfo.unitId;
      if (!l.disposisi.waktuDisposisi) l.disposisi.waktuDisposisi = formatMin(totalMins - 25);
    }

    if (!l.catatanPersiapan) {
      l.catatanPersiapan = 'Armada ' + (l.disposisi?.unit || petugasInfo.unit) + ' beranggotakan personel lengkap segera meluncur menuju lokasi.';
    }
    if (!l.deskripsiTindakan) {
      l.deskripsiTindakan = 'Petugas tiba di lokasi "' + (l.lokasiKejadian || 'TKP') + '" melaksanakan tindakan pertama dan sterilisasi situasi.';
    }
    if (!l.catatanSelesai) {
      l.catatanSelesai = 'Situasi telah aman dan kondusif, tugas penanganan rampung sesuai SOP Polri Presisi 110.';
    }
  }
}

function getDefaultLogs() {
  const defaultList = [
    {
      id: 1, platform: 'sos', platformBadge: '🚨 SOS PANIC', kategoriInsiden: 'Kamtibmas', kategoriBadge: '💥 Kamtibmas & Tawuran',
      tipePelapor: 'sos', nama: 'Sdr. Kevin Wardana', noTelpPelapor: '0812-9911-2233', nikPelapor: '3174052108960002', gpsCoords: '-6.2421, 106.7982',
      sumberLaporan: '🚨 Tombol Darurat SOS Presisi (Live GPS)', sumberSingkat: 'SOS PANIC', avatar: SVG_AVATAR_WARGA, status: 'menunggu', statusText: 'Menunggu Tindakan',
      title: '🚨 Peringatan SOS: Tawuran Remaja Bawa Senjata Tajam di Halte',
      deskripsi: 'Aktivasi Panic Button SOS oleh warga: Gerombolan 15+ remaja berkumpul membawa balok & sajam di dekat halte bus. Warga ketakutan melintas, butuh pencegatan darurat regu Samapta.',
      jenisInsiden: 'Tawuran & Senjata Tajam', sektor: 'Sektor Selatan', waktu: '07:14 WIB', urgensi: '🚨 Darurat',
      fotoLampiran: 'assets/images/polri_insiden_tawuran.jpg', fotoPengaduan: 'assets/images/polri_insiden_tawuran.jpg',
      lokasiKejadian: 'Jl. Panglima Polim Raya No. 42 (Dekat Halte Bus), Kebayoran Baru', alasanTolak: ''
    },
    {
      id: 2, platform: 'warga', platformBadge: '📱 PORTAL WARGA', kategoriInsiden: 'Laka Lantas', kategoriBadge: '🚗 Laka Lantas',
      tipePelapor: 'warga', nama: 'Budi Santoso, S.T.', noTelpPelapor: '0856-9123-8842', nikPelapor: '3171021405820001', gpsCoords: '-6.2398, 106.8245',
      sumberLaporan: '📱 Portal Presisi Pengaduan Warga (Online)', sumberSingkat: 'PORTAL WARGA', avatar: SVG_AVATAR_WARGA, status: 'menunggu', statusText: 'Menunggu Tindakan',
      title: 'Truk Kontainer Mogok Patah As Roda di Jalur Underpass',
      deskripsi: 'Laporan Pengemudi via Portal: Patah as roda pada truk kontainer muatan berat menutup 2 lajur arah Kuningan. Macet mengular 2,5 km, butuh bantuan mobil derek kepolisian.',
      jenisInsiden: 'Gangguan Lalu Lintas & Derek', sektor: 'Sektor Selatan', waktu: '07:22 WIB', urgensi: '⚠️ Sedang',
      fotoLampiran: 'assets/images/polri_insiden_lakalantas.jpg', fotoPengaduan: 'assets/images/polri_insiden_lakalantas.jpg',
      lokasiKejadian: 'Underpass Mampang Prapatan, Jakarta Selatan', alasanTolak: ''
    },
    {
      id: 3, platform: 'layanan110', platformBadge: '📞 LAYANAN 110', kategoriInsiden: 'Kriminalitas', kategoriBadge: '⚔️ Kriminalitas',
      tipePelapor: 'layanan110', nama: 'Sdri. Rina Indah Wulandari', noTelpPelapor: '0813-1456-9901', nikPelapor: '3174094408910005', gpsCoords: '-6.2812, 106.7924',
      sumberLaporan: '📞 Panggilan Darurat 110 (Call Center)', sumberSingkat: 'LAYANAN 110', avatar: SVG_AVATAR_WARGA, status: 'menunggu', statusText: 'Menunggu Tindakan',
      title: 'Panggilan 110: Percobaan Curanmor Roda-2 di Parkiran Toko',
      deskripsi: 'Laporan Warga 110 (Sdri. Rina): Karyawati toko melihat 2 pria tak dikenal merusak kunci kontak motor Beat di parkiran ruko. Pelaku kabur ke arah Cilandak saat ditegur satpam.',
      jenisInsiden: 'Tindak Pidana Curanmor', sektor: 'Sektor Selatan', waktu: '07:35 WIB', urgensi: '🚨 Darurat',
      fotoLampiran: 'assets/images/polri_insiden_curanmor.jpg', fotoPengaduan: 'assets/images/polri_insiden_curanmor.jpg',
      lokasiKejadian: 'Komplek Ruko Grand Fatmawati Blok B No. 7', alasanTolak: ''
    },
    {
      id: 4, platform: 'personel', platformBadge: '👮 PATROLI POLRI', kategoriInsiden: 'PATROLI', kategoriBadge: '🚔 Patroli Wilayah',
      tipePelapor: 'internal', nama: 'Aipda Ridwan (NRP: 78040112)', nrp: '78040112', kesatuan: 'Unit Patroli Samapta Presisi R-4',
      sumberLaporan: '👮 Inisiatif Patroli Mandiri Personel Polri', sumberSingkat: 'PATROLI POLRI', avatar: 'assets/images/avatar_polisi.jpg', status: 'menunggu', statusText: 'Menunggu Tindakan',
      title: 'Patroli Dialogis Perbankan & Gerai ATM 24 Jam',
      deskripsi: 'Giat Inisiatif Patroli Samapta: Pengecekan CCTV & sambang sekuriti gedung perbankan. Memastikan tidak ada alat skimming atau aktivitas mencurigakan di area ATM.',
      jenisInsiden: 'Pengamanan Objek Vital Perbankan', sektor: 'Sektor Pusat', waktu: '07:48 WIB', urgensi: 'ℹ️ Normal',
      fotoLampiran: 'assets/images/polri_insiden_tawuran.jpg', fotoPengaduan: 'assets/images/polri_insiden_tawuran.jpg',
      lokasiKejadian: 'Kawasan Bisnis Sudirman Kav. 24-26, Senayan', alasanTolak: ''
    },
    {
      id: 5, platform: 'layanan110', platformBadge: '📞 LAYANAN 110', kategoriInsiden: 'Kamtibmas', kategoriBadge: '💥 Kamtibmas & Tawuran',
      tipePelapor: 'layanan110', nama: 'Pak Hendro Wicaksono (Ketua RT)', noTelpPelapor: '0818-0921-4475', nikPelapor: '3173012503710002', gpsCoords: '-6.1732, 106.7915',
      sumberLaporan: '📞 Panggilan Darurat 110 (Call Center)', sumberSingkat: 'LAYANAN 110', avatar: SVG_AVATAR_WARGA, status: 'menunggu', statusText: 'Menunggu Tindakan',
      title: 'Panggilan 110: Cekcok Warga Mengenai Parkir Liar Akses Rumah',
      deskripsi: 'Laporan Pengurus RT: Adu mulut antar warga akibat mobil tamu parkir sembarangan menutup akses gerbang rumah warga. Memohon kehadiran Bhabinkamtibmas untuk mediasi damai.',
      jenisInsiden: 'Mediasi Kamtibmas Warga', sektor: 'Sektor Barat', waktu: '08:05 WIB', urgensi: 'ℹ️ Normal',
      fotoLampiran: 'assets/images/polri_insiden_tawuran.jpg', fotoPengaduan: 'assets/images/polri_insiden_tawuran.jpg',
      lokasiKejadian: 'Jl. Tomang Asri Blok C RT 03/RW 05, Grogol', alasanTolak: ''
    },
    {
      id: 6, platform: 'sos', platformBadge: '🚨 SOS PANIC', kategoriInsiden: 'Kriminalitas', kategoriBadge: '⚔️ Kriminalitas',
      tipePelapor: 'sos', nama: 'Sdri. Clarissa Putri (Pengendara Motor)', noTelpPelapor: '0821-3344-5566', nikPelapor: '3173066107870004', gpsCoords: '-6.1668, 106.7891',
      sumberLaporan: '🚨 Tombol Darurat SOS Presisi (Live GPS)', sumberSingkat: 'SOS PANIC', avatar: SVG_AVATAR_WARGA, status: 'menunggu', statusText: 'Menunggu Tindakan',
      title: '🚨 Peringatan SOS: Dugaan Penguntitan & Percobaan Begal Jalanan',
      deskripsi: 'Aktivasi SOS Darurat: Pengendara wanita merasa dibuntuti 2 motor tanpa plat nomor di flyover sepi. Korban berhenti di dekat SPBU dan mengaktifkan suar darurat SIMAPRES.',
      jenisInsiden: 'Ancaman Kejahatan Jalanan', sektor: 'Sektor Barat', waktu: '08:18 WIB', urgensi: '🚨 Darurat',
      fotoLampiran: 'assets/images/polri_insiden_curanmor.jpg', fotoPengaduan: 'assets/images/polri_insiden_curanmor.jpg',
      lokasiKejadian: 'Flyover Roxy Mas Arah Grogol, Jakarta Barat', alasanTolak: ''
    },
    {
      id: 7, platform: 'warga', platformBadge: '📱 PORTAL WARGA', kategoriInsiden: 'Darurat Bencana', kategoriBadge: '🔥 Darurat Bencana',
      tipePelapor: 'warga', nama: 'Ibu Ratna Dewi (Warga Rawamangun)', noTelpPelapor: '0812-3456-7890', nikPelapor: '3175034107850002', gpsCoords: '-6.1954, 106.8832',
      sumberLaporan: '📱 Portal Presisi Pengaduan Warga (Online)', sumberSingkat: 'PORTAL WARGA', avatar: SVG_AVATAR_WARGA, status: 'menunggu', statusText: 'Menunggu Tindakan',
      title: 'Laporan Warga: Pohon Rindang Tumbang Timpa Jaringan Kabel Listrik',
      deskripsi: 'Laporan Warga via Portal: Dahan pohon trembesi besar patah melintang di jalan raya menimpa jaringan kabel listrik PLN dan kabel optik. Arus lalin tersendat, butuh pengamanan lokasi.',
      jenisInsiden: 'Bencana Pohon Tumbang', sektor: 'Sektor Timur', waktu: '08:32 WIB', urgensi: '⚠️ Sedang',
      fotoLampiran: 'assets/images/polri_insiden_pohontumbang.jpg', fotoPengaduan: 'assets/images/polri_insiden_pohontumbang.jpg',
      lokasiKejadian: 'Jl. Pemuda No. 88, Rawamangun, Pulo Gadung', alasanTolak: ''
    },
    {
      id: 8, platform: 'sos', platformBadge: '🚨 SOS PANIC', kategoriInsiden: 'Kriminalitas', kategoriBadge: '⚔️ Kriminalitas',
      tipePelapor: 'sos', nama: 'Pak Bambang Hidayat', noTelpPelapor: '0812-7788-9900', nikPelapor: '3175041002760001', gpsCoords: '-6.2341, 106.8762',
      sumberLaporan: '🚨 Tombol Darurat SOS Presisi (Live GPS)', sumberSingkat: 'SOS PANIC', avatar: SVG_AVATAR_WARGA, status: 'menunggu', statusText: 'Menunggu Tindakan',
      title: '🚨 Peringatan SOS: Temuan Sepeda Motor Ditinggal di Semak Bantaran Kali',
      deskripsi: 'Warga menekan tombol SOS: Menemukan 1 unit sepeda motor matic tanpa plat nomor ditinggalkan di semak tepi kali sejak subuh. Diduga hasil curanmor yang disembunyikan.',
      jenisInsiden: 'Temuan Kendaraan Curian', sektor: 'Sektor Timur', waktu: '08:45 WIB', urgensi: '⚠️ Sedang',
      fotoLampiran: 'assets/images/polri_insiden_curanmor.jpg', fotoPengaduan: 'assets/images/polri_insiden_curanmor.jpg',
      lokasiKejadian: 'Bantaran Saluran Kalimalang KM 3.5, Cipinang', alasanTolak: ''
    },
    {
      id: 9, platform: 'layanan110', platformBadge: '📞 LAYANAN 110', kategoriInsiden: 'Kriminalitas', kategoriBadge: '⚔️ Kriminalitas',
      tipePelapor: 'layanan110', nama: 'Ahmad Fauzi (Pedagang Pasar)', noTelpPelapor: '0877-6543-2109', nikPelapor: '3175082006880007', gpsCoords: '-6.2731, 106.8681',
      sumberLaporan: '📞 Panggilan Darurat 110 (Call Center)', sumberSingkat: 'LAYANAN 110', avatar: SVG_AVATAR_WARGA, status: 'menunggu', statusText: 'Menunggu Tindakan',
      title: 'Panggilan 110: Premanisme & Dugaan Pungli Bongkar Muat Pasar',
      deskripsi: 'Laporan Pedagang Pasar ke 110: Oknum preman meminta uang bongkar muat secara paksa kepada sopir pikap. Pelaku mengancam merusak ban jika tidak diberikan uang tunai.',
      jenisInsiden: 'Penertiban Premanisme & Pungli', sektor: 'Sektor Timur', waktu: '09:05 WIB', urgensi: '⚠️ Sedang',
      fotoLampiran: 'assets/images/polri_insiden_tawuran.jpg', fotoPengaduan: 'assets/images/polri_insiden_tawuran.jpg',
      lokasiKejadian: 'Pintu Masuk Barat Pasar Induk Kramat Jati', alasanTolak: ''
    },
    {
      id: 10, platform: 'warga', platformBadge: '📱 PORTAL WARGA', kategoriInsiden: 'Kamtibmas', kategoriBadge: '💥 Kamtibmas & Tawuran',
      tipePelapor: 'warga', nama: 'Irfan Hakim, S.Kom.', noTelpPelapor: '0817-2233-4455', nikPelapor: '3172011904940002', gpsCoords: '-6.1389, 106.8691',
      sumberLaporan: '📱 Portal Presisi Pengaduan Warga (Online)', sumberSingkat: 'PORTAL WARGA', avatar: SVG_AVATAR_WARGA, status: 'menunggu', statusText: 'Menunggu Tindakan',
      title: 'Aduan Warga: Gangguan Musik Kafe Bising Melebihi Batas Waktu',
      deskripsi: 'Laporan Warga via Portal Presisi: Kafe live music memutar sound system bass dentuman keras hingga pukul 02:00 dini hari di samping komplek perumahan warga.',
      jenisInsiden: 'Gangguan Ketertiban Umum', sektor: 'Sektor Utara', waktu: '09:22 WIB', urgensi: 'ℹ️ Normal',
      fotoLampiran: 'assets/images/polri_insiden_tawuran.jpg', fotoPengaduan: 'assets/images/polri_insiden_tawuran.jpg',
      lokasiKejadian: 'Kawasan Danau Sunter Utara, Tanjung Priok', alasanTolak: ''
    },
    {
      id: 11, platform: 'warga', platformBadge: '📱 PORTAL WARGA', kategoriInsiden: 'Laka Lantas', kategoriBadge: '🚗 Laka Lantas',
      tipePelapor: 'warga', nama: 'dr. Tirta Prasetya', noTelpPelapor: '0819-5566-7788', nikPelapor: '3171042306890001', gpsCoords: '-6.1845, 106.8423',
      sumberLaporan: '📱 Portal Presisi Pengaduan Warga (Online)', sumberSingkat: 'PORTAL WARGA', avatar: SVG_AVATAR_WARGA, status: 'menunggu', statusText: 'Menunggu Tindakan',
      title: 'Laporan Warga: Tabrakan Beruntun 3 Minibus di TL Lampu Merah',
      deskripsi: 'Laporan Pengendara via Portal: Tabrakan beruntun di lampu merah akibat rem blong. Tidak ada korban jiwa namun kendaraan melintang di lajur utama menyebabkan kemacetan parah.',
      jenisInsiden: 'Kecelakaan Lalu Lintas Beruntun', sektor: 'Sektor Pusat', waktu: '09:38 WIB', urgensi: '⚠️ Sedang',
      fotoLampiran: 'assets/images/polri_insiden_lakalantas.jpg', fotoPengaduan: 'assets/images/polri_insiden_lakalantas.jpg',
      lokasiKejadian: 'Simpang Lima Senen / TL Coca Cola, Jakarta Pusat', alasanTolak: ''
    },
    {
      id: 12, platform: 'sos', platformBadge: '🚨 SOS PANIC', kategoriInsiden: 'Pelayanan Publik', kategoriBadge: '🤝 Pelayanan Publik',
      tipePelapor: 'sos', nama: 'Ibu Dewi Lestari (Ibu Korban)', noTelpPelapor: '0819-8765-4321', nikPelapor: '3171035508890006', gpsCoords: '-6.1754, 106.8272',
      sumberLaporan: '🚨 Tombol Darurat SOS Presisi (Live GPS)', sumberSingkat: 'SOS PANIC', avatar: SVG_AVATAR_WARGA, status: 'menunggu', statusText: 'Menunggu Tindakan',
      title: '🚨 Peringatan SOS: Anak Balita Terpisah dari Ibu di Keramaian Monas',
      deskripsi: 'Aktivasi SOS Darurat Ibu: Balita usia 4 tahun terpisah di area taman Monas pintu barat daya saat ramai pengunjung. Ciri-ciri: kaos kuning, celana biru dongker, membawa botol minum.',
      jenisInsiden: 'Pencarian Anak Hilang', sektor: 'Sektor Pusat', waktu: '09:55 WIB', urgensi: '🚨 Darurat',
      fotoLampiran: 'assets/images/polri_insiden_pelayanan_publik.jpg', fotoPengaduan: 'assets/images/polri_insiden_pelayanan_publik.jpg',
      lokasiKejadian: 'Plaza Monumen Nasional Pintu Barat Daya', alasanTolak: ''
    },
    {
      id: 13, platform: 'layanan110', platformBadge: '📞 LAYANAN 110', kategoriInsiden: 'Kamtibmas', kategoriBadge: '💥 Kamtibmas & Tawuran',
      tipePelapor: 'layanan110', nama: 'Pak Joko Subroto (Warga RT 08)', noTelpPelapor: '0812-1133-5577', nikPelapor: '3174062104750003', gpsCoords: '-6.2345, 106.7821',
      sumberLaporan: '📞 Panggilan Darurat 110 (Call Center)', sumberSingkat: 'LAYANAN 110', avatar: SVG_AVATAR_WARGA, status: 'menunggu', statusText: 'Menunggu Tindakan',
      title: 'Panggilan 110: Sekelompok Pemuda Pesta Miras Oplosan di Pos Ronda',
      deskripsi: 'Laporan Warga via 110: Kerumunan pemuda tak dikenal berkumpul di pos ronda kosong meminum miras oplosan dan mengganggu pengendara wanita yang melintas.',
      jenisInsiden: 'Penertiban Miras & Kamtibmas', sektor: 'Sektor Selatan', waktu: '10:15 WIB', urgensi: '⚠️ Sedang',
      fotoLampiran: 'assets/images/polri_insiden_tawuran.jpg', fotoPengaduan: 'assets/images/polri_insiden_tawuran.jpg',
      lokasiKejadian: 'Pos Kamling RW 08 Permata Hijau, Kebayoran Lama', alasanTolak: ''
    },
    {
      id: 14, platform: 'sos', platformBadge: '🚨 SOS PANIC', kategoriInsiden: 'Pelayanan Publik', kategoriBadge: '🤝 Pelayanan Publik',
      tipePelapor: 'sos', nama: 'Sdr. Denny Pratama', noTelpPelapor: '0857-8899-0011', nikPelapor: '3175021208980004', gpsCoords: '-6.2112, 106.8431',
      sumberLaporan: '🚨 Tombol Darurat SOS Presisi (Live GPS)', sumberSingkat: 'SOS PANIC', avatar: SVG_AVATAR_WARGA, status: 'ditolak', statusText: 'Ditolak / Revisi',
      title: '🚨 Peringatan SOS: Tombol Panik Tertekan Tidak Sengaja di Rumah',
      deskripsi: 'Alarm SOS menyala dari aplikasi warga. Saat dikonfirmasi operator 110, telepon dipegang anak balita dan bukan kondisi darurat sebenarnya.',
      jenisInsiden: 'Panggilan Panik Tidak Disengaja', sektor: 'Sektor Timur', waktu: '08:10 WIB', urgensi: 'ℹ️ Normal',
      fotoLampiran: 'assets/images/polri_insiden_pelayanan_publik.jpg', fotoPengaduan: 'assets/images/polri_insiden_pelayanan_publik.jpg',
      lokasiKejadian: 'Komplek Perumahan Jatinegara Baru Blok A, Jakarta Timur',
      alasanTolak: 'Aktivasi Palsu / Tidak Disengaja - Konfirmasi telepon menyatakan tombol tertekan anak kecil, situasi rumah tangga aman dan kondusif.'
    },
    {
      id: 15, platform: 'warga', platformBadge: '📱 PORTAL WARGA', kategoriInsiden: 'Kriminalitas', kategoriBadge: '⚔️ Kriminalitas',
      tipePelapor: 'warga', nama: 'Wahyu Setiawan', noTelpPelapor: '0857-1122-3344', nikPelapor: '3173041908850002', gpsCoords: '-6.1523, 106.7214',
      sumberLaporan: '📱 Portal Presisi Pengaduan Warga (Online)', sumberSingkat: 'PORTAL WARGA', avatar: SVG_AVATAR_WARGA, status: 'ditolak', statusText: 'Ditolak / Revisi',
      title: 'Pengaduan Portal: Kehilangan Helm di Parkiran Swalayan Tanpa Saksi',
      deskripsi: 'Warga melapor helm hilang di parkiran swalayan namun tidak mencantumkan rekaman CCTV, waktu pasti, maupun kontak petugas sekuriti setempat.',
      jenisInsiden: 'Pencurian Ringan', sektor: 'Sektor Barat', waktu: '09:00 WIB', urgensi: 'ℹ️ Normal',
      fotoLampiran: 'assets/images/polri_insiden_curanmor.jpg', fotoPengaduan: 'assets/images/polri_insiden_curanmor.jpg',
      lokasiKejadian: 'Parkiran Swalayan Daan Mogot KM 12',
      alasanTolak: 'Informasi Tidak Lengkap - Mohon lampirkan rekaman CCTV atau nomor saksi sekuriti yang bertugas saat kejadian berlangsung.'
    },
    {
      id: 16, platform: 'sos', platformBadge: '🚨 SOS PANIC', kategoriInsiden: 'Kriminalitas', kategoriBadge: '⚔️ Kriminalitas',
      tipePelapor: 'sos', nama: 'Sdri. Maya Indriani', noTelpPelapor: '0812-9988-7766', nikPelapor: '3174085104800008', gpsCoords: '-6.2289, 106.7892',
      sumberLaporan: '🚨 Tombol Darurat SOS Presisi (Live GPS)', sumberSingkat: 'SOS PANIC', avatar: SVG_AVATAR_WARGA,
      status: 'menunggu_pengesahan', statusText: 'Menunggu Pengesahan Pawas', tahap: 5, bapTerkirim: true,
      waktuSelesai: '20:06 WIB', catatanSelesai: 'Pelaku dan barang bukti motor telah berhasil diamankan',
      waktuTiba: '20:06 WIB', deskripsiTindakan: 'Mengamankan lokasi kejadian dan melakukan pengejaran pelaku',
      waktuMeluncur: '18:14 WIB', catatanPersiapan: 'Personel lengkap, perlengkapan dinas siap, segera meluncur menuju TKP.',
      fotoPersiapan: 'assets/images/polri_patrol_car.jpg', fotoTindakan: 'assets/images/polri_tindakan_tkp.jpg', fotoSelesai: 'assets/images/polri_situasi_selesai.jpg',
      title: '🚨 Peringatan SOS: Upaya Pencegatan Curas oleh 4 OTK di Simprug',
      deskripsi: 'Aktivasi SOS Darurat: Pengemudi mobil merasa dipepet 2 motor berboncengan saat melintas di jalanan sepi. Unit Patroli Samapta Presisi telah tuntas melakukan penanganan di TKP.',
      jenisInsiden: 'Percobaan Curas & Kejahatan Jalanan', sektor: 'Sektor Selatan', waktu: '13:05 WIB', urgensi: '🚨 Darurat',
      fotoLampiran: 'assets/images/polri_insiden_curanmor.jpg', fotoPengaduan: 'assets/images/polri_insiden_curanmor.jpg',
      lokasiKejadian: 'Jl. Simprug Golf Raya No. 15, Kebayoran Lama', alasanTolak: '',
      assignedNrp: '95020123', assignedNama: 'Bripka Ahmad Subagyo', assignedUnitId: 'samapta-r4-selatan',
      disposisi: {
        unit: 'Unit Patroli Samapta Presisi (Unit Roda 4)',
        unitId: 'samapta-r4-selatan',
        komandan: 'Bripka Ahmad & Regu Alpha (Unit Samapta Presisi)',
        nrpKomandan: '95020123',
        arahan: 'Datangi TKP dengan sirine biru, amankan perimeter, prioritaskan keselamatan korban.',
        waktuDisposisi: '13:05 WIB',
        targetSlaMenit: 10,
        estimasiJarak: '1.4 km',
        estimasiEta: '± 5 Menit',
        posisiAwal: 'Pos Polisi Subsektor Simprug',
        kekuatan: '4 Personel Lengkap, Alutsista & Bodycam Aktif'
      }
    },
    {
      id: 17, platform: 'layanan110', platformBadge: '📞 LAYANAN 110', kategoriInsiden: 'Laka Lantas', kategoriBadge: '🚗 Laka Lantas',
      tipePelapor: 'layanan110', nama: 'Pak Sukardi (Pengemudi Taksi)', noTelpPelapor: '0813-8899-0011', nikPelapor: '3171011203650004', gpsCoords: '-6.1951, 106.8231',
      sumberLaporan: '📞 Panggilan Darurat 110 (Call Center)', sumberSingkat: 'LAYANAN 110', avatar: SVG_AVATAR_WARGA, status: 'selesai', statusText: 'Kasus Selesai', tahap: 5,
      title: 'Panggilan 110: Mediasi Damai Senggolan Kendaraan Bundaran HI',
      deskripsi: 'Kedua pihak pengemudi sepakat berdamai dan ganti rugi diselesaikan secara kekeluargaan di Pos Polantas Bundaran HI.',
      jenisInsiden: 'Penyelesaian Laka Lantas', sektor: 'Sektor Pusat', waktu: '06:15 WIB',
      fotoLampiran: 'assets/images/polri_insiden_lakalantas.jpg', fotoPengaduan: 'assets/images/polri_insiden_lakalantas.jpg', fotoTindakan: 'assets/images/polri_tindakan_tkp.jpg',
      lokasiKejadian: 'Pos Polantas Bundaran HI, Jakarta Pusat', alasanTolak: ''
    },
    {
      id: 18, platform: 'warga', platformBadge: '📱 PORTAL WARGA', kategoriInsiden: 'Kamtibmas', kategoriBadge: '💥 Kamtibmas & Tawuran',
      tipePelapor: 'warga', nama: 'Sdri. Nadia Utami (Pengunjung Taman)', noTelpPelapor: '0812-4433-2211', nikPelapor: '3174075509920003', gpsCoords: '-6.2442, 106.7971',
      sumberLaporan: '📱 Portal Presisi Pengaduan Warga (Online)', sumberSingkat: 'PORTAL WARGA', avatar: SVG_AVATAR_WARGA, status: 'selesai', statusText: 'Kasus Selesai', tahap: 5,
      title: 'Laporan Portal: Pembubaran Pesta Miras Oplosan di Taman Barito',
      deskripsi: 'Barang bukti 3 botol miras disita dan 6 pemuda diberikan pembinaan di hadapan orang tua serta ketua RT setempat.',
      jenisInsiden: 'Penertiban Miras & Kamtibmas', sektor: 'Sektor Selatan', waktu: '06:30 WIB',
      fotoLampiran: 'assets/images/polri_insiden_tawuran.jpg', fotoPengaduan: 'assets/images/polri_insiden_tawuran.jpg',
      lokasiKejadian: 'Taman Ayodya Barito, Kebayoran Baru', alasanTolak: ''
    },
    {
      id: 19, platform: 'layanan110', platformBadge: '📞 LAYANAN 110', kategoriInsiden: 'Pelayanan Publik', kategoriBadge: '🤝 Pelayanan Publik',
      tipePelapor: 'layanan110', nama: 'Anisa Fitri, S.Pd.', noTelpPelapor: '0812-3344-5577', nikPelapor: '3174064508930009', gpsCoords: '-6.2391, 106.7981',
      sumberLaporan: '📞 Panggilan Darurat 110 (Call Center)', sumberSingkat: 'LAYANAN 110', avatar: SVG_AVATAR_WARGA, status: 'selesai', statusText: 'Kasus Selesai', tahap: 5,
      title: 'Panggilan 110: Pengembalian Dompet & Berkas Ketinggalan di Halte',
      deskripsi: 'Warga menemukan dompet berisi uang dan KTP di halte busway. Diserahkan ke pos polisi dan berhasil dikembalikan ke pemilik sah.',
      jenisInsiden: 'Pelayanan Temuan Barang Warga', sektor: 'Sektor Selatan', waktu: '06:45 WIB',
      fotoLampiran: 'assets/images/polri_insiden_pelayanan_publik.jpg', fotoPengaduan: 'assets/images/polri_insiden_pelayanan_publik.jpg',
      lokasiKejadian: 'Halte CSW ASEAN, Kebayoran Baru', alasanTolak: ''
    },
    {
      id: 20, platform: 'warga', platformBadge: '📱 PORTAL WARGA', kategoriInsiden: 'Laka Lantas', kategoriBadge: '🚗 Laka Lantas',
      tipePelapor: 'warga', nama: 'H. Syamsul Arifin (Pengguna KRL)', noTelpPelapor: '0858-9900-1122', nikPelapor: '3173051402680001', gpsCoords: '-6.2078, 106.7972',
      sumberLaporan: '📱 Portal Presisi Pengaduan Warga (Online)', sumberSingkat: 'PORTAL WARGA', avatar: SVG_AVATAR_WARGA, status: 'selesai', statusText: 'Kasus Selesai', tahap: 5,
      title: 'Aduan Portal: Penertiban Angkot Ngetem Bikin Macet Stasiun',
      deskripsi: 'Arus lalin di depan pintu stasiun ditertibkan, sopir angkot diarahkan masuk ke lajur penurunan resmi dan tidak mengunci badan jalan.',
      jenisInsiden: 'Penertiban Lalu Lintas', sektor: 'Sektor Barat', waktu: '07:00 WIB',
      fotoLampiran: 'assets/images/polri_insiden_lakalantas.jpg', fotoPengaduan: 'assets/images/polri_insiden_lakalantas.jpg',
      lokasiKejadian: 'Pintu Keluar Stasiun Palmerah, Jakarta Barat', alasanTolak: ''
    },
    {
      id: 21, platform: 'sos', platformBadge: '🚨 SOS PANIC', kategoriInsiden: 'Kamtibmas', kategoriBadge: '💥 Kamtibmas & Tawuran',
      tipePelapor: 'sos', nama: 'H. Mansyur (Tokoh Masyarakat SOS)', noTelpPelapor: '0811-2233-4411', nikPelapor: '3173021005580001', gpsCoords: '-6.1751, 106.7812',
      sumberLaporan: '🚨 Tombol Darurat SOS Presisi (Live GPS)', sumberSingkat: 'SOS PANIC', avatar: SVG_AVATAR_WARGA, status: 'selesai', statusText: 'Kasus Selesai', tahap: 5,
      title: '🚨 Peringatan SOS: Pencegahan Cekcok Antar Remaja di Balai Warga',
      deskripsi: 'Respon cepat suar SOS warga: Bhabinkamtibmas dan regu patroli tiba dalam 5 menit, berhasil memediasi kesalahpahaman remaja disaksikan pengurus RW.',
      jenisInsiden: 'Problem Solving Kamtibmas', sektor: 'Sektor Barat', waktu: '07:15 WIB',
      fotoLampiran: 'assets/images/polri_insiden_tawuran.jpg', fotoPengaduan: 'assets/images/polri_insiden_tawuran.jpg',
      lokasiKejadian: 'Balai Warga RW 04 Tanjung Duren Utara', alasanTolak: ''
    },
    {
      id: 22, platform: 'warga', platformBadge: '📱 PORTAL WARGA', kategoriInsiden: 'Pelayanan Publik', kategoriBadge: '🤝 Pelayanan Publik',
      tipePelapor: 'warga', nama: 'Sdri. Felicia Wijaya (Penyewa Toko)', noTelpPelapor: '0813-7788-9911', nikPelapor: '3172054907910003', gpsCoords: '-6.1582, 106.9081',
      sumberLaporan: '📱 Portal Presisi Pengaduan Warga (Online)', sumberSingkat: 'PORTAL WARGA', avatar: SVG_AVATAR_WARGA, status: 'selesai', statusText: 'Kasus Selesai', tahap: 5,
      title: 'Aduan Portal: Pengamanan & Sterilisasi Keramaian Mall Jelang Buka',
      deskripsi: 'Sterilisasi area parkir dan eskalator mall jelang jam buka akhir pekan, situasi tertib, aman dan nihil gangguan kamtibmas.',
      jenisInsiden: 'Pengamanan Objek Wisata & Niaga', sektor: 'Sektor Utara', waktu: '07:30 WIB',
      fotoLampiran: 'assets/images/polri_insiden_patroli_obvit.jpg', fotoPengaduan: 'assets/images/polri_insiden_patroli_obvit.jpg',
      lokasiKejadian: 'Mall Kelapa Gading 3, Jakarta Utara', alasanTolak: ''
    },
    {
      id: 23, platform: 'layanan110', platformBadge: '📞 LAYANAN 110', kategoriInsiden: 'Pelayanan Publik', kategoriBadge: '🤝 Pelayanan Publik',
      tipePelapor: 'layanan110', nama: 'Dedi Kurniawan (Pejalan Kaki)', noTelpPelapor: '0878-1234-5678', nikPelapor: '3172041807900003', gpsCoords: '-6.1421, 106.8712',
      sumberLaporan: '📞 Panggilan Darurat 110 (Call Center)', sumberSingkat: 'LAYANAN 110', avatar: SVG_AVATAR_WARGA, status: 'selesai', statusText: 'Kasus Selesai', tahap: 5,
      title: 'Panggilan 110: Bantuan Evakuasi Hewan Terjebak Rangka Jembatan',
      deskripsi: 'Bantuan kemanusiaan personel kepolisian bersama petugas Dishub berhasil mengevakuasi hewan terjebak di ketinggian rangka JPO.',
      jenisInsiden: 'Bantuan Kemanusiaan & Pelayanan', sektor: 'Sektor Utara', waktu: '07:45 WIB',
      fotoLampiran: 'assets/images/polri_insiden_pelayanan_publik.jpg', fotoPengaduan: 'assets/images/polri_insiden_pelayanan_publik.jpg',
      lokasiKejadian: 'JPO Halte Sunter Karya, Tanjung Priok', alasanTolak: ''
    },
    {
      id: 24, platform: 'personel', platformBadge: '👮 PATROLI POLRI', kategoriInsiden: 'SAMBANG', kategoriBadge: '🤝 Sambang Warga',
      tipePelapor: 'internal', nama: 'Bripda Kevin Ananda (NRP: 99010432)', nrp: '99010432', kesatuan: 'Tim Perintis Presisi R-2',
      sumberLaporan: '👮 Inisiatif Patroli Mandiri Personel Polri', sumberSingkat: 'PATROLI POLRI', avatar: 'assets/images/avatar_polisi.jpg', status: 'selesai', statusText: 'Kasus Selesai', tahap: 5,
      title: 'Penyuluhan Hukum Tawuran & Narkoba di Karang Taruna',
      deskripsi: 'Edukasi hukum kepada 30 pemuda karang taruna tentang bahaya tawuran dan ancaman pidana kepemilikan senjata tajam.',
      jenisInsiden: 'Penyuluhan Hukum & Kamtibmas', sektor: 'Sektor Timur', waktu: '08:00 WIB',
      fotoLampiran: 'assets/images/polri_insiden_tawuran.jpg', fotoPengaduan: 'assets/images/polri_insiden_tawuran.jpg',
      lokasiKejadian: 'Sekretariat Karang Taruna Kelurahan Cipinang Cempedak', alasanTolak: ''
    },
    {
      id: 25, platform: 'layanan110', platformBadge: '📞 LAYANAN 110', kategoriInsiden: 'Kriminalitas', kategoriBadge: '⚔️ Kriminalitas',
      tipePelapor: 'layanan110', nama: 'Ibu Ratna Sari (Jamaah Masjid)', noTelpPelapor: '0813-9876-5432', nikPelapor: '3175024409860005', gpsCoords: '-6.2312, 106.9012',
      sumberLaporan: '📞 Panggilan Darurat 110 (Call Center)', sumberSingkat: 'LAYANAN 110', avatar: SVG_AVATAR_WARGA, status: 'selesai', statusText: 'Kasus Selesai', tahap: 5,
      title: 'Panggilan 110: Olah TKP Pembobolan Kotak Amal Rumah Ibadah',
      deskripsi: 'Pemeriksaan rekaman CCTV masjid dan olah TKP awal berhasil mengamankan terduga pelaku di dekat pasar dalam waktu 40 menit.',
      jenisInsiden: 'Tindak Pidana Pencurian', sektor: 'Sektor Timur', waktu: '08:15 WIB',
      fotoLampiran: 'assets/images/polri_insiden_curanmor.jpg', fotoPengaduan: 'assets/images/polri_insiden_curanmor.jpg',
      lokasiKejadian: 'Masjid Jami Al-Hidayah, Duren Sawit', alasanTolak: ''
    },
    {
      id: 26, platform: 'warga', platformBadge: '📱 PORTAL WARGA', kategoriInsiden: 'Pelayanan Publik', kategoriBadge: '🤝 Pelayanan Publik',
      tipePelapor: 'warga', nama: 'Bambang Irawan (Pengurus RW)', noTelpPelapor: '0812-7711-2288', nikPelapor: '3174061502690001', gpsCoords: '-6.2512, 106.7845',
      sumberLaporan: '📱 Portal Presisi Pengaduan Warga (Online)', sumberSingkat: 'PORTAL WARGA', avatar: SVG_AVATAR_WARGA, status: 'selesai', statusText: 'Kasus Selesai', tahap: 5,
      title: 'Aduan Portal: Pengawalan Penyaluran Bantuan Sosial Lansia',
      deskripsi: 'Penyaluran beras bantuan pangan kepada 120 kepala keluarga lansia berlangsung tertib, aman dan tepat sasaran didampingi Bhabinkamtibmas.',
      jenisInsiden: 'Pengamanan Bantuan Sosial', sektor: 'Sektor Selatan', waktu: '08:30 WIB',
      fotoLampiran: 'assets/images/polri_insiden_pelayanan_publik.jpg', fotoPengaduan: 'assets/images/polri_insiden_pelayanan_publik.jpg',
      lokasiKejadian: 'Kantor Kelurahan Kebayoran Lama Selatan', alasanTolak: ''
    },
    {
      id: 27, platform: 'sos', platformBadge: '🚨 SOS PANIC', kategoriInsiden: 'Darurat Bencana', kategoriBadge: '🔥 Darurat Bencana',
      tipePelapor: 'sos', nama: 'Joko Prasetyo (Warga Johar Baru)', noTelpPelapor: '0812-4455-6677', nikPelapor: '3171052101790002', gpsCoords: '-6.1892, 106.8521',
      sumberLaporan: '🚨 Tombol Darurat SOS Presisi (Live GPS)', sumberSingkat: 'SOS PANIC', avatar: SVG_AVATAR_WARGA, status: 'selesai', statusText: 'Kasus Selesai', tahap: 5,
      title: '🚨 Peringatan SOS: Evakuasi Cepat Pohon Tumbang Robohkan Pagar Rumah',
      deskripsi: 'Respon cepat alarm SOS: Personel kepolisian bersama Damkar dan warga memotong batang pohon tumbang serta mengamankan jalur evakuasi.',
      jenisInsiden: 'Evakuasi Gangguan Pohon Tumbang', sektor: 'Sektor Pusat', waktu: '08:45 WIB',
      fotoLampiran: 'assets/images/polri_insiden_pohontumbang.jpg', fotoPengaduan: 'assets/images/polri_insiden_pohontumbang.jpg',
      lokasiKejadian: 'Jl. Percetakan Negara IX No. 12, Johar Baru', alasanTolak: ''
    },
    {
      id: 28, platform: 'layanan110', platformBadge: '📞 LAYANAN 110', kategoriInsiden: 'Kamtibmas', kategoriBadge: '💥 Kamtibmas & Tawuran',
      tipePelapor: 'layanan110', nama: 'Ibu Maryam (Warga Dekat PJL)', noTelpPelapor: '0818-4455-6688', nikPelapor: '3171086203810005', gpsCoords: '-6.1724, 106.8482',
      sumberLaporan: '📞 Panggilan Darurat 110 (Call Center)', sumberSingkat: 'LAYANAN 110', avatar: SVG_AVATAR_WARGA, status: 'selesai', statusText: 'Kasus Selesai', tahap: 5,
      title: 'Panggilan 110: Sterilisasi Jalur Rel Kereta Api dari Kerumunan',
      deskripsi: 'Penertiban kerumunan anak-anak dan pemuda yang nongkrong berbahaya di dekat perlintasan rel kereta api sebidang untuk cegah kecelakaan.',
      jenisInsiden: 'Pengamanan Objek Vital Perkeretaapian', sektor: 'Sektor Pusat', waktu: '09:00 WIB',
      fotoLampiran: 'assets/images/polri_insiden_tawuran.jpg', fotoPengaduan: 'assets/images/polri_insiden_tawuran.jpg',
      lokasiKejadian: 'Perlintasan Sebidang PJL 24 Pasar Senen', alasanTolak: ''
    }
  ];

  defaultList.forEach(l => {
    enrichLogOperationalHistory(l);
    l.fotoPengaduan = getFotoPengaduanByKategori(l);
    l.fotoLampiran = l.fotoPengaduan;
    l.fotoPersiapan = 'assets/images/polri_patrol_car.jpg';
    l.fotoTindakan = 'assets/images/polri_tindakan_tkp.jpg';
    l.fotoSelesai = 'assets/images/polri_situasi_selesai.jpg';
    if (l.tipePelapor === 'personel' || l.kesatuan || l.nrp) {
      l.avatar = 'assets/images/avatar_polisi.jpg';
    } else {
      l.avatar = SVG_AVATAR_WARGA;
    }
  });

  return defaultList;
}

let storeLogs = [];

function loadLogsFromStore() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_LOGS);
    if (saved) {
      storeLogs = JSON.parse(saved);
      const hasLegacyDummy = storeLogs.some(l =>
        !l.platform ||
        !l.kategoriInsiden ||
        (l.id === 1 && l.platform !== 'sos') ||
        (l.title && l.title.includes('Patroli Dialogis Pasar Jaya')) ||
        (l.fotoLampiran && l.fotoLampiran.includes('Disetujui')) ||
        (l.title && l.title.includes('belum direview'))
      );
      if (hasLegacyDummy) {
        storeLogs = getDefaultLogs();
      }

      // Sinkronisasi Kasus ID 16
      const log16 = storeLogs.find(l => l.id === 16);
      if (log16) {
        if (!log16.pengesahanPawas && log16.status !== 'selesai') {
          log16.tahap = 5;
          log16.bapTerkirim = true;
          log16.status = 'menunggu_pengesahan';
          log16.statusText = 'Menunggu Pengesahan Pawas';
          if (!log16.waktuSelesai) log16.waktuSelesai = '20:06 WIB';
          if (!log16.catatanSelesai) log16.catatanSelesai = 'Pelaku dan barang bukti motor telah berhasil diamankan';
        }
        if (!log16.waktuTiba) log16.waktuTiba = '20:06 WIB';
        if (!log16.deskripsiTindakan) log16.deskripsiTindakan = 'Mengamankan lokasi kejadian dan melakukan pengejaran pelaku';
        if (!log16.waktuMeluncur) log16.waktuMeluncur = '18:14 WIB';
        if (!log16.catatanPersiapan) log16.catatanPersiapan = 'Personel lengkap, perlengkapan dinas siap, segera meluncur menuju TKP.';
        if (!log16.assignedNrp) log16.assignedNrp = '95020123';
        if (!log16.assignedNama) log16.assignedNama = 'Bripka Ahmad Subagyo';
        if (!log16.assignedUnitId) log16.assignedUnitId = 'samapta-r4-selatan';
        if (!log16.disposisi) {
          log16.disposisi = {
            unit: 'Unit Patroli Samapta Presisi (Unit Roda 4)',
            unitId: 'samapta-r4-selatan',
            komandan: 'Bripka Ahmad & Regu Alpha (Unit Samapta Presisi)',
            nrpKomandan: '95020123',
            arahan: 'Datangi TKP dengan sirine biru, amankan perimeter, prioritaskan keselamatan korban.',
            waktuDisposisi: '13:05 WIB'
          };
        } else if (!log16.disposisi.waktuDisposisi) {
          log16.disposisi.waktuDisposisi = '13:05 WIB';
        }
      }

      // Sinkronisasi Kasus ID 28 (Aiptu Bambang Sudrajat)
      const log28 = storeLogs.find(l => l.id === 28);
      if (log28) {
        if (!log28.waktuTiba) log28.waktuTiba = '08:48 WIB';
        if (!log28.waktuSelesai) log28.waktuSelesai = '09:00 WIB';
      }
    } else {
      storeLogs = getDefaultLogs();
    }

    // Pembersihan & Standarisasi State
    storeLogs.forEach(l => {
      if (l.status === 'disetujui') {
        l.status = 'menunggu';
        l.statusText = 'Menunggu Tindakan';
      }
      if ((l.tahap >= 5 || l.statusText === 'Menunggu Pengesahan Pawas' || l.bapTerkirim) && !l.pengesahanPawas && l.status !== 'selesai') {
        l.status = 'menunggu_pengesahan';
        l.statusText = 'Menunggu Pengesahan Pawas';
      }
      if (l.status === 'diproses' && !l.tahap) l.tahap = 3;
      if (l.status === 'menunggu_pengesahan' && !l.tahap) l.tahap = 5;
      if (l.status === 'selesai' && !l.tahap) l.tahap = 5;

      // Auto-upgrade log personel lawas ke klasifikasi giat presisi Opsi B
      if (l.platform === 'personel') {
        if (!l.kategoriInsiden || l.kategoriInsiden === 'Kamtibmas') {
          const t = (l.title || '').toLowerCase() + ' ' + (l.jenisInsiden || '').toLowerCase();
          if (t.includes('sambang') || t.includes('penyuluhan')) {
            l.kategoriInsiden = 'SAMBANG';
            l.kategoriBadge = '🤝 Sambang Warga';
          } else if (t.includes('tptkp')) {
            l.kategoriInsiden = 'TPTKP';
            l.kategoriBadge = '🛡️ TPTKP';
          } else if (t.includes('pengamanan') || t.includes('pam')) {
            l.kategoriInsiden = 'PENGAMANAN';
            l.kategoriBadge = '⚠️ Pengamanan Jalur/Objek';
          } else {
            l.kategoriInsiden = 'PATROLI';
            l.kategoriBadge = '🚔 Patroli Wilayah';
          }
        }
      }

      if (!l.nomorTiket) {
        l.nomorTiket = `TIKET-110-${l.id}X2F`;
      }

      if (l.status === 'diproses' && !l.disposisi) {
        l.disposisi = {
          unit: 'Unit Patroli Samapta Presisi (Unit Roda 4)',
          unitId: 'samapta-r4-selatan',
          komandan: 'Bripka Ahmad & Regu Alpha (Unit Samapta Presisi)',
          nrpKomandan: '95020123',
          arahan: 'Datangi TKP dengan sirine biru, amankan perimeter, prioritaskan keselamatan korban.',
          waktuDisposisi: l.waktu || '13:05 WIB',
          targetSlaMenit: 10,
          estimasiJarak: '1.4 km',
          estimasiEta: '± 5 Menit',
          posisiAwal: 'Pos Polisi Subsektor Simprug',
          kekuatan: '4 Personel Lengkap, Alutsista & Bodycam Aktif'
        };
      }

      l.fotoPengaduan = getFotoPengaduanByKategori(l);
      l.fotoLampiran = l.fotoPengaduan;

      if (l.tipePelapor === 'personel' || l.kesatuan || l.nrp) {
        l.avatar = 'assets/images/avatar_polisi.jpg';
      } else if (!l.avatar || l.avatar.includes('unsplash.com')) {
        l.avatar = SVG_AVATAR_WARGA;
      }

      if (!l.deskripsiTindakan && (l.status === 'selesai' || l.tahap >= 5)) {
        l.deskripsiTindakan = 'Telah tiba di TKP, mengamankan perimeter lokasi kejadian, pendataan saksi dan mediasi situasi hingga kondusif.';
      }
      if (!l.catatanSelesai && l.status === 'selesai') {
        l.catatanSelesai = 'Situasi telah aman dan kondusif, arus lalu lintas lancar kembali, warga kembali beraktivitas normal.';
      }
      if (typeof enrichLogsWithCitizenReviews === 'function') {
        enrichLogsWithCitizenReviews([l]);
      }
    });

    saveLogsToStore(storeLogs);
  } catch (e) {
    console.warn('Gagal memuat dari storage, reset ke default:', e);
    storeLogs = getDefaultLogs();
    saveLogsToStore(storeLogs);
  }
  return storeLogs;
}

function saveLogsToStore(logs) {
  try {
    const dataToSave = logs || storeLogs;
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(dataToSave));
    sessionStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(dataToSave));
    window.dispatchEvent(new CustomEvent('simapres:data-updated', { detail: { logs: dataToSave } }));
  } catch (e) {
    console.error('Gagal menyimpan logs ke storage:', e);
  }
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

  // Helper normalisasi ID satuan: misal 'samapta-r4-selatan' atau 'samapta-r2-motor' -> 'samapta'
  const normSatuan = (val) => {
    const s = String(val || '').toLowerCase();
    if (s.includes('lantas') || s.includes('pjr') || s.includes('turjawali')) return 'lantas';
    if (s.includes('samapta') || s.includes('sabhara') || s.includes('raimas') || s.includes('perintis')) return 'samapta';
    if (s.includes('reskrim') || s.includes('resmob') || s.includes('opsnal') || s.includes('inafis')) return 'reskrim';
    if (s.includes('bhabin') || s.includes('polsek') || s.includes('subsektor')) return 'polsek';
    return s;
  };

  const userCategory = normSatuan(unitId || satuan);

  // 1. Cek langsung assignedUnitId, assignedUnitIds (Multi-Unit), atau assignedSatuan pada level root tiket
  if (Array.isArray(log.assignedUnitIds) && log.assignedUnitIds.length > 0) {
    const isMatched = log.assignedUnitIds.some(uId => {
      const uNorm = normSatuan(uId);
      return uId === unitId || uNorm === userCategory;
    });
    if (isMatched) return true;
  }
  if (log.assignedUnitId) {
    const targetUnit = String(log.assignedUnitId).trim().toLowerCase();
    if (targetUnit === unitId || normSatuan(targetUnit) === userCategory) return true;
  }
  if (log.assignedSatuan && normSatuan(log.assignedSatuan) === userCategory) return true;
  if (log.assignedNrp && String(log.assignedNrp).trim().toLowerCase() === nrp) return true;
  if (Array.isArray(log.acceptedNrps) && log.acceptedNrps.includes(nrp)) return true;

  // 2. Cek di dalam objek disposisi taktis (termasuk multi-unit)
  if (log.disposisi) {
    if (Array.isArray(log.disposisi.unitIds) && log.disposisi.unitIds.length > 0) {
      const isDispMatched = log.disposisi.unitIds.some(uId => {
        const uNorm = normSatuan(uId);
        return uId === unitId || uNorm === userCategory;
      });
      if (isDispMatched) return true;
    }
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
 * Mengambil daftar tugas yang khusus menjadi tanggung jawab personel aktif
 * @param {object|string} userOrNrp 
 * @param {string} statusFilter ('semua' | 'aktif' | 'diproses' | 'menunggu_pengesahan' | 'selesai')
 * @returns {Array}
 */
function getLogsForUser(userOrNrp, statusFilter = 'semua') {
  let user = null;
  if (typeof userOrNrp === 'string') {
    user = typeof cariPersonelByNrp === 'function' ? cariPersonelByNrp(userOrNrp) : { nrp: userOrNrp };
  } else {
    user = userOrNrp;
  }

  // Gunakan data memori aktif (appLogs) jika tersedia, fallback ke storage
  const all = (typeof appLogs !== 'undefined' && Array.isArray(appLogs) && appLogs.length > 0)
    ? appLogs
    : (storeLogs.length > 0 ? storeLogs : loadLogsFromStore());

  return all.filter(log => {
    // Filter kepemilikan personel (Data Ownership)
    if (!isLogAssignedToUser(log, user)) return false;

    // Filter status tab
    if (statusFilter === 'aktif') return (log.status === 'diproses' || log.status === 'menunggu_pengesahan');
    if (statusFilter === 'diproses') return log.status === 'diproses';
    if (statusFilter === 'menunggu_pengesahan') return log.status === 'menunggu_pengesahan';
    if (statusFilter === 'selesai') return log.status === 'selesai';
    return true; // 'semua'
  });
}
