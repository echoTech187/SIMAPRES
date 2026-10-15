// ==================================
// NATIVE GOOGLE MAPS INITIALIZATION
// ==================================
let mapFullscreen;
let mapBeranda;

function initMaps() {
  if (typeof google === 'undefined' || !google.maps || typeof google.maps.Map !== 'function') {
    setTimeout(initMaps, 500);
    return;
  }

  const elFs = document.getElementById('map-fullscreen');
  const elBeranda = document.getElementById('map-beranda');
  if (!elFs || !elBeranda) return;

  try {
    const mapOptions = {
      zoom: 13,
      center: { lat: -6.1980, lng: 106.8245 },
      disableDefaultUI: true, // Clean interface like the mockup
      mapTypeId: 'roadmap',
      styles: [
        { featureType: 'poi', stylers: [{ visibility: 'off' }] },
        { featureType: 'transit', stylers: [{ visibility: 'off' }] }
      ]
    };

    mapFullscreen = new google.maps.Map(elFs, Object.assign({}, mapOptions, {
      zoom: 13,
      draggable: true,
      scrollwheel: true,
      gestureHandling: 'greedy'
    }));
    mapBeranda = new google.maps.Map(elBeranda, Object.assign({}, mapOptions, {
      zoom: 13,
      draggable: true,
      scrollwheel: true,
      gestureHandling: 'greedy'
    }));

    // 1:1 Map Elements based on mockup:
    // Green line, Yellow line, Red line, Red pins, Big Police Car

    // Hardcoded Coordinates to match Central Jakarta outline
    const p1 = { lat: -6.1800, lng: 106.8200 };
    const p2 = { lat: -6.1950, lng: 106.8150 };
    const p3 = { lat: -6.2100, lng: 106.8180 };
    const p4 = { lat: -6.2150, lng: 106.8300 };
    const p5 = { lat: -6.1950, lng: 106.8350 };
    const p6 = { lat: -6.1850, lng: 106.8300 };

    // Function to fetch road-snapped route from OSRM and draw on both maps
    async function fetchRouteAndDraw(waypoints, color) {
      const coords = waypoints.map(p => `${p.lng},${p.lat}`).join(';');
      const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=polyline`;
      try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.routes && data.routes.length > 0) {
          const decodedPath = google.maps.geometry.encoding.decodePath(data.routes[0].geometry);
          new google.maps.Polyline({ path: decodedPath, strokeColor: color, strokeWeight: 6, strokeOpacity: 1.0, map: mapFullscreen });
          new google.maps.Polyline({ path: decodedPath, strokeColor: color, strokeWeight: 4, strokeOpacity: 1.0, map: mapBeranda });
        }
      } catch (err) {
        console.error('OSRM fetch error:', err);
        // Fallback to straight lines if API fails
        new google.maps.Polyline({ path: waypoints, strokeColor: color, strokeWeight: 6, strokeOpacity: 1.0, map: mapFullscreen });
        new google.maps.Polyline({ path: waypoints, strokeColor: color, strokeWeight: 4, strokeOpacity: 1.0, map: mapBeranda });
      }
    }

    fetchRouteAndDraw([p1, p2, p3], '#10B981'); // Green
    fetchRouteAndDraw([p3, p4], '#EF4444');     // Red
    fetchRouteAndDraw([p4, p5, p6], '#F59E0B'); // Orange

    // Draw classic Red Pins
    const redPin = {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: '#EF4444',
      fillOpacity: 1,
      strokeColor: '#FFFFFF',
      strokeWeight: 2,
      scale: 8
    };
    new google.maps.Marker({ position: p1, map: mapFullscreen });
    new google.maps.Marker({ position: p3, map: mapFullscreen });
    new google.maps.Marker({ position: p6, map: mapFullscreen });

    // Big Police Car Icon with "POLISI" text untuk anggota lapangan
    const policeIcon = {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="100" height="50" viewBox="0 0 100 50">
          <path d="M10,30 L20,15 L70,15 L85,30 L95,30 L95,45 L5,45 L5,30 Z" fill="#153E75"/>
          <path d="M25,18 L65,18 L75,28 L20,28 Z" fill="#60A5FA"/>
          <circle cx="25" cy="45" r="8" fill="#1E293B"/>
          <circle cx="75" cy="45" r="8" fill="#1E293B"/>
          <text x="50" y="38" font-family="Arial" font-size="12" font-weight="bold" fill="white" text-anchor="middle">SAYA</text>
        </svg>
      `),
      anchor: new google.maps.Point(50, 25)
    };
    const urlParams = new URLSearchParams(window.location.search);
    const role = urlParams.get('role');
    const sessionUser = (typeof getActiveSessionUser === 'function') ? getActiveSessionUser() : null;
    const isPimpinan = (role === 'pimpinan' || role === 'atasan' || role === 'pawas' || (sessionUser && (sessionUser.role === 'pimpinan' || sessionUser.role === 'pawas' || sessionUser.nrp === '88010234')));

    // Untuk pimpinan, sembunyikan toggle "Lihat Sebaran Personel Lain" karena defaultnya sudah tampil semua
    const toggleContainer = document.getElementById('container-toggle-personel') || document.getElementById('toggle-personel')?.closest('label');
    if (toggleContainer) {
      toggleContainer.style.display = isPimpinan ? 'none' : 'flex';
    }

    // Circular Badge Pin dengan Glowing Halo Ring Sesuai Mockup Gambar 2
    const makeHaloBadgeIcon = (emoji, strokeColor, haloColor) => ({
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 52 52">
              <!-- Outer Pulsing Halo Ring -->
              <circle cx="26" cy="26" r="23" fill="${haloColor}" fill-opacity="0.32" stroke="${strokeColor}" stroke-width="1.5" stroke-dasharray="4,2"/>
              <!-- Inner Solid White Circle -->
              <circle cx="26" cy="26" r="16.5" fill="#FFFFFF" stroke="${strokeColor}" stroke-width="2.5"/>
              <!-- Centered Emoji/Icon -->
              <text x="26" y="32" font-size="18" text-anchor="middle" font-family="'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif">${emoji}</text>
            </svg>
          `),
      scaledSize: new google.maps.Size(52, 52),
      anchor: new google.maps.Point(26, 26)
    });

    if (isPimpinan) {

      // 1. Data Lengkap 4 Unit Samapta R-4 (Sesuai Label "🚔 4 Samapta R-4")
      const samaptaUnits = [
        {
          key: 'samapta1',
          pos: p4, // { lat: -6.2150, lng: 106.8300 } - Menteng Atas / Kuningan
          iconEmoji: '🚔',
          title: 'Patroli Samapta 110-A',
          petugas: 'Bripka Ahmad Subagyo (NRP 95020123)',
          sub: 'Sat Samapta (Sektor Timur) • Sedan R4-Samapta-81',
          status: 'Status: SIAGA',
          statusColor: '#10B981',
          tugas: 'Tugas: Patroli Rute Beat 1 (Pasar & Bank)',
          telemetri: 'Kecepatan: 35 km/jam • Sinyal GPS Prima'
        },
        {
          key: 'samapta2',
          pos: { lat: -6.2050, lng: 106.8250 }, // Karet / Sudirman
          iconEmoji: '🚔',
          title: 'Patroli Samapta 110-B',
          petugas: 'Aipda Eko Prasetyo (NRP 82040512)',
          sub: 'Sat Samapta (Sektor Pusat) • Double Cabin R4-Samapta-12',
          status: 'Status: PATROLI KOTA',
          statusColor: '#2563EB',
          tugas: 'Tugas: Patroli Jalur Protokol & Objek Vital Perbankan',
          telemetri: 'Kecepatan: 40 km/jam • Sinyal GPS Prima'
        },
        {
          key: 'samapta3',
          pos: { lat: -6.1920, lng: 106.8380 }, // Salemba / Matraman
          iconEmoji: '🚔',
          title: 'Patroli Samapta 110-C',
          petugas: 'Bripka Doni Hendrawan (NRP 87090214)',
          sub: 'Sat Samapta (Sektor Timur) • Sedan R4-Samapta-83',
          status: 'Status: SIAGA BEAT 2',
          statusColor: '#10B981',
          tugas: 'Tugas: Patroli Pemukiman Padat & Sentra Ekonomi',
          telemetri: 'Kecepatan: 28 km/jam • Sinyal GPS Prima'
        },
        {
          key: 'samapta4',
          pos: { lat: -6.1780, lng: 106.8120 }, // Petojo / Cideng
          iconEmoji: '🚔',
          title: 'Patroli Samapta 110-D',
          petugas: 'Aipda Rian Saputra (NRP 84110329)',
          sub: 'Sat Samapta (Sektor Barat) • Double Cabin R4-Samapta-15',
          status: 'Status: PATROLI BLUE LIGHT',
          statusColor: '#2563EB',
          tugas: 'Tugas: Pengawasan Kawasan Perkantoran & Niaga',
          telemetri: 'Kecepatan: 32 km/jam • Sinyal GPS Prima'
        }
      ];

      // 2. Data Lengkap 6 Unit Perintis R-2 (Sesuai Label "🏍️ 6 Perintis R-2")
      const perintisUnits = [
        {
          key: 'perintis1',
          pos: { lat: -6.2200, lng: 106.8150 }, // Kota Kasablanka
          iconEmoji: '🏍️',
          title: 'Tim Perintis Presisi R-2 (Alpha)',
          petugas: 'Briptu Dian Wicaksono (NRP 95020123)',
          sub: 'Tim Perintis Presisi (Sektor Barat) • Sepeda Motor R2-Trail-06',
          status: 'Status: MERESPON TKP (DARURAT 110)',
          statusColor: '#D97706',
          tugas: 'Tugas: Respon Cepat Kerumunan Pelajar Jl. Panglima Polim',
          telemetri: 'Kecepatan: 50 km/jam • Sinyal GPS Prima'
        },
        {
          key: 'perintis2',
          pos: { lat: -6.2120, lng: 106.8280 }, // Setiabudi / Rasuna Said
          iconEmoji: '🏍️',
          title: 'Tim Perintis Presisi R-2 (Bravo)',
          petugas: 'Briptu Fajar Pratama (NRP 96080441)',
          sub: 'Tim Perintis Presisi (Sektor Selatan) • Sepeda Motor R2-Trail-08',
          status: 'Status: PATROLI PREVENTIF',
          statusColor: '#10B981',
          tugas: 'Tugas: Patroli Lorong & Gang Rawan Tawuran Warga',
          telemetri: 'Kecepatan: 35 km/jam • Sinyal GPS Prima'
        },
        {
          key: 'perintis3',
          pos: { lat: -6.1880, lng: 106.8260 }, // Menteng / Cikini
          iconEmoji: '🏍️',
          title: 'Tim Perintis Presisi R-2 (Charlie)',
          petugas: 'Bripda Rizki Maulana (NRP 98030219)',
          sub: 'Tim Perintis Presisi (Sektor Pusat) • Sepeda Motor R2-Trail-02',
          status: 'Status: SIAGA TITIK PANTAU',
          statusColor: '#10B981',
          tugas: 'Tugas: Sterilisasi Jalur Kereta & Jembatan Layang',
          telemetri: 'Kecepatan: 0 km/jam (Stasioner) • Sinyal GPS Prima'
        },
        {
          key: 'perintis4',
          pos: { lat: -6.1720, lng: 106.8280 }, // Pasar Baru / Juanda
          iconEmoji: '🏍️',
          title: 'Tim Perintis Presisi R-2 (Delta)',
          petugas: 'Bripka Sigit Purnomo (NRP 89050117)',
          sub: 'Tim Perintis Presisi (Sektor Utara) • Sepeda Motor R2-Trail-11',
          status: 'Status: PATROLI KEWILAYAHAN',
          statusColor: '#2563EB',
          tugas: 'Tugas: Antisipasi Balap Liar & 3C Malam Hari',
          telemetri: 'Kecepatan: 42 km/jam • Sinyal GPS Prima'
        },
        {
          key: 'perintis5',
          pos: { lat: -6.2020, lng: 106.8120 }, // Benhil / Karet Tengsin
          iconEmoji: '🏍️',
          title: 'Tim Perintis Presisi R-2 (Echo)',
          petugas: 'Briptu Aris Munandar (NRP 94120332)',
          sub: 'Tim Perintis Presisi (Sektor Barat) • Sepeda Motor R2-Trail-14',
          status: 'Status: PATROLI DIALOGIS',
          statusColor: '#10B981',
          tugas: 'Tugas: Sambang Pos Satkamling & Sentra Kuliner',
          telemetri: 'Kecepatan: 20 km/jam • Sinyal GPS Prima'
        },
        {
          key: 'perintis6',
          pos: { lat: -6.2250, lng: 106.8220 }, // Gatot Subroto / Pancoran
          iconEmoji: '🏍️',
          title: 'Tim Perintis Presisi R-2 (Foxtrot)',
          petugas: 'Bripda Bagus Santoso (NRP 99010554)',
          sub: 'Tim Perintis Presisi (Sektor Selatan) • Sepeda Motor R2-Trail-19',
          status: 'Status: MERESPON ADUAN 110',
          statusColor: '#D97706',
          tugas: 'Tugas: Cek Lokasi Gangguan Kamtibmas Permukiman',
          telemetri: 'Kecepatan: 45 km/jam • Sinyal GPS Prima'
        }
      ];

      // 3. Data Lengkap 4 Unit Lantas R-4 (Sesuai Label "🚓 4 Lantas R-4")
      const lantasUnits = [
        {
          key: 'lantas1',
          pos: { lat: -6.1850, lng: 106.8100 }, // Tanah Abang / Thamrin
          iconEmoji: '🚓',
          title: 'Patroli Turjawali Satlantas 01',
          petugas: 'Aiptu Bambang Irawan (NRP 78050321)',
          sub: 'Satlantas Polres (Sektor Protokol) • Sedan Lantas-01',
          status: 'Status: PENJAGAAN & PENGATURAN',
          statusColor: '#0284C7',
          tugas: 'Tugas: Penguraian Arus Lalu Lintas Simpang Protokol',
          telemetri: 'Kecepatan: 15 km/jam • Sinyal GPS Prima'
        },
        {
          key: 'lantas2',
          pos: { lat: -6.2180, lng: 106.8040 }, // Semanggi / Senayan
          iconEmoji: '🚓',
          title: 'Patroli Turjawali Satlantas 02',
          petugas: 'Aipda Dwi Haryanto (NRP 83070619)',
          sub: 'Satlantas Polres (Sektor Selatan) • Sedan Lantas-04',
          status: 'Status: PENGATURAN ARUS',
          statusColor: '#0284C7',
          tugas: 'Tugas: Pengamanan Jalur Protokol & Rekayasa Lalin',
          telemetri: 'Kecepatan: 22 km/jam • Sinyal GPS Prima'
        },
        {
          key: 'lantas3',
          pos: { lat: -6.1750, lng: 106.8320 }, // Senen / Gunung Sahari
          iconEmoji: '🚓',
          title: 'Patroli Turjawali Satlantas 03',
          petugas: 'Bripka Kurniawan (NRP 86090432)',
          sub: 'Satlantas Polres (Sektor Timur) • Sedan Lantas-07',
          status: 'Status: PENGAWASAN KELANCARAN',
          statusColor: '#10B981',
          tugas: 'Tugas: Sterilisasi Jalur Busway & Penertiban Parkir Liar',
          telemetri: 'Kecepatan: 18 km/jam • Sinyal GPS Prima'
        },
        {
          key: 'lantas4',
          pos: { lat: -6.1980, lng: 106.8420 }, // Salemba Raya
          iconEmoji: '🚓',
          title: 'Patroli Turjawali Satlantas 04',
          petugas: 'Aipda Tri Wahyudi (NRP 81120543)',
          sub: 'Satlantas Polres (Sektor Rumah Sakit) • Sedan Lantas-09',
          status: 'Status: SIAGA KAWAL AMBULANS',
          statusColor: '#10B981',
          tugas: 'Tugas: Prioritas Jalur Darurat Koridor Medis Salemba',
          telemetri: 'Kecepatan: 25 km/jam • Sinyal GPS Prima'
        }
      ];

      // 4. Data 3 Titik Hotspot Rawan (Sesuai Label "🔴 3 Titik Hotspot")
      const hotspotUnits = [
        {
          key: 'hotspot1',
          pos: p1, // -6.1800, 106.8200
          iconEmoji: '🔴',
          title: 'Titik Hotspot 1 (Manggarai)',
          petugas: 'Wilayah Polsek Tebet / Sektor Timur',
          sub: 'Kategori: Rawan Tawuran Warga & Gesekan Kelompok',
          status: 'Status: PENGAWASAN PRIORITAS (RAWAN)',
          statusColor: '#DC2626',
          tugas: 'Jadwal Rawan: 23.00 - 04.30 WIB',
          telemetri: 'Unit Terdekat: Patroli Samapta 110-A (600m)'
        },
        {
          key: 'hotspot2',
          pos: p3, // -6.2100, 106.8180
          iconEmoji: '🔴',
          title: 'Titik Hotspot 2 (Sudirman)',
          petugas: 'Wilayah Polsek Setiabudi / Sektor Pusat',
          sub: 'Kategori: Rawan Balap Liar',
          status: 'Status: SIAGA PATROLI BLUE LIGHT',
          statusColor: '#D97706',
          tugas: 'Jadwal Rawan: 00.30 - 05.00 WIB',
          telemetri: 'Unit Terdekat: Patroli Samapta 110-B (450m)'
        },
        {
          key: 'hotspot3',
          pos: p6, // -6.1850, 106.8300
          iconEmoji: '🔴',
          title: 'Titik Hotspot 3 (Panglima Polim)',
          petugas: 'Wilayah Polsek Kebayoran Baru / Sektor Selatan',
          sub: 'Kategori: Rawan Tawuran Pelajar Ber-sajam',
          status: 'Status: INSIDEN DARURAT AKTIF (SIAGA 110)',
          statusColor: '#DC2626',
          tugas: 'Laporan Masuk: 12:20 WIB',
          telemetri: 'Unit Terdekat: Tim Perintis Presisi R-2 (3 Menit)'
        }
      ];

      // 5. Mako Polres Metro
      const makoUnit = {
        key: 'mako',
        pos: { lat: -6.2220, lng: 106.8020 },
        iconEmoji: '🏢',
        title: 'Mako Polres Metro Jakarta Pusat',
        petugas: 'Komando & Pengendalian Operasi (KODAL)',
        sub: 'Jl. Kramat Raya No.61, Senen',
        status: 'Status: MAKO SIAGA 1',
        statusColor: '#10B981',
        tugas: 'Pusat Komando & SPKT Pelayanan 110 Terpadu',
        telemetri: '46 Personel Piket Aktif • 14 Armada Operasional'
      };

      const addInteractiveMarker = (targetMap, pos, icon, data, title) => {
        const marker = new google.maps.Marker({
          position: pos,
          map: targetMap,
          icon: icon,
          title: title,
          cursor: 'pointer'
        });
        google.maps.event.addListener(marker, 'click', () => {
          bukaModalMapUnit(data, marker, targetMap);
        });
        return marker;
      };

      const iconSamapta = makeHaloBadgeIcon('🚔', '#0284C7', '#38BDF8');
      const iconPerintis = makeHaloBadgeIcon('🏍️', '#D97706', '#FBBF24');
      const iconLantas = makeHaloBadgeIcon('🚓', '#1D4ED8', '#60A5FA');
      const iconHotspot = makeHaloBadgeIcon('🔴', '#DC2626', '#F87171');
      const iconMako = makeHaloBadgeIcon('🏢', '#1E3A8A', '#93C5FD');

      window.markerDataMap = {};

      function registerAndAddMarker(data, icon) {
        window.markerDataMap[data.key] = data;
        data._markerB = addInteractiveMarker(mapBeranda, data.pos, icon, data, data.title);
        data._markerFs = addInteractiveMarker(mapFullscreen, data.pos, icon, data, data.title);
      }

      // Render seluruh armada sehingga persis sesuai label & sidebar (4 Samapta, 6 Perintis, 4 Lantas, 3 Hotspot, 1 Mako)
      samaptaUnits.forEach(u => registerAndAddMarker(u, iconSamapta));
      perintisUnits.forEach(u => registerAndAddMarker(u, iconPerintis));
      lantasUnits.forEach(u => registerAndAddMarker(u, iconLantas));
      hotspotUnits.forEach(u => registerAndAddMarker(u, iconHotspot));
      registerAndAddMarker(makoUnit, iconMako);

      // Render unit tambahan hasil pendaftaran baru atau scan QR device HP
      try {
        const registeredList = JSON.parse(localStorage.getItem('simapres_registered_units') || '[]');
        const latestScan = JSON.parse(localStorage.getItem('simapres_latest_hp_scan') || 'null');
        
        let hasScannedDeviceRendered = false;
        registeredList.forEach((reg, idx) => {
          const isLantas = (reg.unitId === 'lantas');
          const isReskrim = (reg.unitId === 'reskrim');
          const isIntel = (reg.unitId === 'intel');
          const isBinmas = (reg.unitId === 'binmas');
          const iconCustom = makeHaloBadgeIcon(
            isLantas ? '🚓' : (isReskrim ? '🕵️' : (isIntel ? '👁️' : (isBinmas ? '👮' : '🚔'))),
            isLantas ? '#1D4ED8' : (isReskrim ? '#DC2626' : (isIntel ? '#475569' : '#059669')),
            '#60A5FA'
          );
          const unitObj = {
            key: 'pimpinan_reg_' + idx,
            nrp: reg.nrp,
            pos: reg.gpsCoords || { lat: -6.2100 + (idx * 0.005), lng: 106.8400 + (idx * 0.004) },
            iconEmoji: isLantas ? '🚓' : (isReskrim ? '🕵️' : '🚔'),
            title: `Unit ${reg.satuanNama || reg.unitId} (${reg.kelompokRegu || 'Patroli'})`,
            petugas: `${reg.nama} (NRP ${reg.nrp})`,
            sub: `${reg.satuanNama} • Device: ${reg.deviceID || 'DEV-HP'}`,
            status: 'Status: SIAGA AKTIF (GPS TERHUBUNG)',
            statusColor: '#10B981',
            tugas: `Tugas: Siaga Patroli & Respon 110`,
            telemetri: `Device ID: ${reg.deviceID || '-'} • Telemetri HP Terhubung`
          };
          registerAndAddMarker(unitObj, iconCustom);
          if (latestScan && reg.deviceID === latestScan.deviceID) hasScannedDeviceRendered = true;
        });

        // Jika ada scan HP langsung namun belum terdaftar di tabel, tampilkan sebagai Pin Live HP
        if (latestScan && latestScan.coords && !hasScannedDeviceRendered) {
          const iconScanLive = makeHaloBadgeIcon('📍', '#10B981', '#34D399');
          const scanObj = {
            key: 'live_scanned_hp_unit',
            nrp: latestScan.nrp || 'SCAN-HP',
            pos: latestScan.coords,
            iconEmoji: '📍',
            title: `📍 Unit Terdeteksi (Scan HP ${latestScan.brand || 'Fisik'})`,
            petugas: `Personel Lapangan (Device: ${latestScan.deviceID})`,
            sub: `Satelit HP: ${latestScan.coords.lat.toFixed(6)}, ${latestScan.coords.lng.toFixed(6)}`,
            status: 'Status: LIVE GPS TERHUBUNG',
            statusColor: '#10B981',
            tugas: 'Tugas: Patroli Wilayah Terkini',
            telemetri: `Device ID: ${latestScan.deviceID} • Terkoneksi: ${latestScan.timestamp}`
          };
          registerAndAddMarker(scanObj, iconScanLive);
        }
      } catch (err) {
        console.warn('Gagal memuat unit terdaftar ke radar pimpinan:', err);
      }

      // Tutup modal InfoWindow ketika mengklik area peta
      google.maps.event.addListener(mapBeranda, 'click', () => {
        tutupModalMapUnit();
      });
      google.maps.event.addListener(mapFullscreen, 'click', () => {
        tutupModalMapUnit();
      });
    } else {
      new google.maps.Marker({ position: p1, map: mapBeranda, icon: redPin });
      new google.maps.Marker({ position: p4, map: mapFullscreen, icon: policeIcon, title: "Posisi Saya" });
      new google.maps.Marker({ position: p4, map: mapBeranda, icon: policeIcon, title: "Posisi Saya" });
    }

    // =========================================================================
    // 4. SEBARAN PERSONEL LAIN (REKAN LAPANGAN DI WILAYAH SEKITAR)
    // =========================================================================
    // Untuk pimpinan, seluruh armada sudah tampil otomatis secara default di peta.
    // Sebaran personel lain dengan toggle hanya aktif untuk personel lapangan.
    if (!isPimpinan) {
      const iconSamaptaRekan = (typeof makeHaloBadgeIcon === 'function') ? makeHaloBadgeIcon('🚔', '#0284C7', '#38BDF8') : null;
      const iconPerintisRekan = (typeof makeHaloBadgeIcon === 'function') ? makeHaloBadgeIcon('🏍️', '#D97706', '#FBBF24') : null;
      const iconLantasRekan = (typeof makeHaloBadgeIcon === 'function') ? makeHaloBadgeIcon('🚓', '#1D4ED8', '#60A5FA') : null;

      // Master seluruh armada operasional presisi (14 Unit Identik Maps Pimpinan)
      const masterRekan = [
      // 4 Unit Samapta R-4
      {
        key: 'samapta1',
        nrp: '95020123',
        pos: p4,
        iconEmoji: '🚔',
        icon: iconSamaptaRekan,
        title: 'Patroli Samapta 110-A',
        petugas: 'Bripka Ahmad Subagyo (NRP 95020123)',
        sub: 'Sat Samapta (Sektor Timur) • Sedan R4-Samapta-81',
        status: 'Status: SIAGA',
        statusColor: '#10B981',
        tugas: 'Tugas: Patroli Rute Beat 1 (Pasar & Bank)',
        telemetri: 'Kecepatan: 35 km/jam • Sinyal GPS Prima'
      },
      {
        key: 'samapta2',
        nrp: '82040512',
        pos: { lat: -6.2050, lng: 106.8250 },
        iconEmoji: '🚔',
        icon: iconSamaptaRekan,
        title: 'Patroli Samapta 110-B',
        petugas: 'Aipda Eko Prasetyo (NRP 82040512)',
        sub: 'Sat Samapta (Sektor Pusat) • Double Cabin R4-Samapta-12',
        status: 'Status: PATROLI KOTA',
        statusColor: '#2563EB',
        tugas: 'Tugas: Patroli Jalur Protokol & Objek Vital Perbankan',
        telemetri: 'Kecepatan: 40 km/jam • Sinyal GPS Prima'
      },
      {
        key: 'samapta3',
        nrp: '87090214',
        pos: { lat: -6.1920, lng: 106.8380 },
        iconEmoji: '🚔',
        icon: iconSamaptaRekan,
        title: 'Patroli Samapta 110-C',
        petugas: 'Bripka Doni Hendrawan (NRP 87090214)',
        sub: 'Sat Samapta (Sektor Timur) • Sedan R4-Samapta-83',
        status: 'Status: SIAGA BEAT 2',
        statusColor: '#10B981',
        tugas: 'Tugas: Patroli Pemukiman Padat & Sentra Ekonomi',
        telemetri: 'Kecepatan: 28 km/jam • Sinyal GPS Prima'
      },
      {
        key: 'samapta4',
        nrp: '84110329',
        pos: { lat: -6.1780, lng: 106.8120 },
        iconEmoji: '🚔',
        icon: iconSamaptaRekan,
        title: 'Patroli Samapta 110-D',
        petugas: 'Aipda Rian Saputra (NRP 84110329)',
        sub: 'Sat Samapta (Sektor Barat) • Double Cabin R4-Samapta-15',
        status: 'Status: PATROLI BLUE LIGHT',
        statusColor: '#2563EB',
        tugas: 'Tugas: Pengawasan Kawasan Perkantoran & Niaga',
        telemetri: 'Kecepatan: 32 km/jam • Sinyal GPS Prima'
      },
      // 6 Unit Perintis R-2
      {
        key: 'perintis1',
        nrp: '50129841',
        pos: { lat: -6.2200, lng: 106.8150 },
        iconEmoji: '🏍️',
        icon: iconPerintisRekan,
        title: 'Tim Perintis Presisi R-2 (Alpha)',
        petugas: 'Aipda Rudi Hartono (NRP 50129841)',
        sub: 'Tim Perintis Presisi (Sektor Barat) • Sepeda Motor R2-Trail-06',
        status: 'Status: MERESPON TKP (DARURAT 110)',
        statusColor: '#D97706',
        tugas: 'Tugas: Respon Cepat Kerumunan Pelajar Jl. Panglima Polim',
        telemetri: 'Kecepatan: 50 km/jam • Sinyal GPS Prima'
      },
      {
        key: 'perintis2',
        nrp: '96080441',
        pos: { lat: -6.2120, lng: 106.8280 },
        iconEmoji: '🏍️',
        icon: iconPerintisRekan,
        title: 'Tim Perintis Presisi R-2 (Bravo)',
        petugas: 'Briptu Fajar Pratama (NRP 96080441)',
        sub: 'Tim Perintis Presisi (Sektor Selatan) • Sepeda Motor R2-Trail-08',
        status: 'Status: PATROLI PREVENTIF',
        statusColor: '#10B981',
        tugas: 'Tugas: Patroli Lorong & Gang Rawan Tawuran Warga',
        telemetri: 'Kecepatan: 35 km/jam • Sinyal GPS Prima'
      },
      {
        key: 'perintis3',
        nrp: '98030219',
        pos: { lat: -6.1880, lng: 106.8260 },
        iconEmoji: '🏍️',
        icon: iconPerintisRekan,
        title: 'Tim Perintis Presisi R-2 (Charlie)',
        petugas: 'Bripda Rizki Maulana (NRP 98030219)',
        sub: 'Tim Perintis Presisi (Sektor Pusat) • Sepeda Motor R2-Trail-02',
        status: 'Status: SIAGA TITIK PANTAU',
        statusColor: '#10B981',
        tugas: 'Tugas: Sterilisasi Jalur Kereta & Jembatan Layang',
        telemetri: 'Kecepatan: 0 km/jam (Stasioner) • Sinyal GPS Prima'
      },
      {
        key: 'perintis4',
        nrp: '89050117',
        pos: { lat: -6.1720, lng: 106.8280 },
        iconEmoji: '🏍️',
        icon: iconPerintisRekan,
        title: 'Tim Perintis Presisi R-2 (Delta)',
        petugas: 'Bripka Sigit Purnomo (NRP 89050117)',
        sub: 'Tim Perintis Presisi (Sektor Utara) • Sepeda Motor R2-Trail-11',
        status: 'Status: PATROLI KEWILAYAHAN',
        statusColor: '#2563EB',
        tugas: 'Tugas: Antisipasi Balap Liar & 3C Malam Hari',
        telemetri: 'Kecepatan: 42 km/jam • Sinyal GPS Prima'
      },
      {
        key: 'perintis5',
        nrp: '94120332',
        pos: { lat: -6.2020, lng: 106.8120 },
        iconEmoji: '🏍️',
        icon: iconPerintisRekan,
        title: 'Tim Perintis Presisi R-2 (Echo)',
        petugas: 'Briptu Aris Munandar (NRP 94120332)',
        sub: 'Tim Perintis Presisi (Sektor Barat) • Sepeda Motor R2-Trail-14',
        status: 'Status: PATROLI DIALOGIS',
        statusColor: '#10B981',
        tugas: 'Tugas: Sambang Pos Satkamling & Sentra Kuliner',
        telemetri: 'Kecepatan: 20 km/jam • Sinyal GPS Prima'
      },
      {
        key: 'perintis6',
        nrp: '99010554',
        pos: { lat: -6.2250, lng: 106.8220 },
        iconEmoji: '🏍️',
        icon: iconPerintisRekan,
        title: 'Tim Perintis Presisi R-2 (Foxtrot)',
        petugas: 'Bripda Bagus Santoso (NRP 99010554)',
        sub: 'Tim Perintis Presisi (Sektor Selatan) • Sepeda Motor R2-Trail-19',
        status: 'Status: MERESPON ADUAN 110',
        statusColor: '#D97706',
        tugas: 'Tugas: Cek Lokasi Gangguan Kamtibmas Permukiman',
        telemetri: 'Kecepatan: 45 km/jam • Sinyal GPS Prima'
      },
      // 4 Unit Lantas R-4
      {
        key: 'lantas1',
        nrp: '49112233',
        pos: { lat: -6.1850, lng: 106.8100 },
        iconEmoji: '🚓',
        icon: iconLantasRekan,
        title: 'Patroli Turjawali Satlantas 01',
        petugas: 'Aiptu Bambang Sudrajat (NRP 49112233)',
        sub: 'Satlantas Polres (Sektor Protokol) • Sedan Lantas-01',
        status: 'Status: PENJAGAAN & PENGATURAN',
        statusColor: '#0284C7',
        tugas: 'Tugas: Penguraian Arus Lalu Lintas Simpang Protokol',
        telemetri: 'Kecepatan: 15 km/jam • Sinyal GPS Prima'
      },
      {
        key: 'lantas2',
        nrp: '83070619',
        pos: { lat: -6.2180, lng: 106.8040 },
        iconEmoji: '🚓',
        icon: iconLantasRekan,
        title: 'Patroli Turjawali Satlantas 02',
        petugas: 'Aipda Dwi Haryanto (NRP 83070619)',
        sub: 'Satlantas Polres (Sektor Selatan) • Sedan Lantas-04',
        status: 'Status: PENGATURAN ARUS',
        statusColor: '#0284C7',
        tugas: 'Tugas: Pengamanan Jalur Protokol & Rekayasa Lalin',
        telemetri: 'Kecepatan: 22 km/jam • Sinyal GPS Prima'
      },
      {
        key: 'lantas3',
        nrp: '86090432',
        pos: { lat: -6.1750, lng: 106.8320 },
        iconEmoji: '🚓',
        icon: iconLantasRekan,
        title: 'Patroli Turjawali Satlantas 03',
        petugas: 'Bripka Kurniawan (NRP 86090432)',
        sub: 'Satlantas Polres (Sektor Timur) • Sedan Lantas-07',
        status: 'Status: PENGAWASAN KELANCARAN',
        statusColor: '#10B981',
        tugas: 'Tugas: Sterilisasi Jalur Busway & Penertiban Parkir Liar',
        telemetri: 'Kecepatan: 18 km/jam • Sinyal GPS Prima'
      },
      {
        key: 'lantas4',
        nrp: '81120543',
        pos: { lat: -6.1980, lng: 106.8420 },
        iconEmoji: '🚓',
        icon: iconLantasRekan,
        title: 'Patroli Turjawali Satlantas 04',
        petugas: 'Aipda Tri Wahyudi (NRP 81120543)',
        sub: 'Satlantas Polres (Sektor Rumah Sakit) • Sedan Lantas-09',
        status: 'Status: SIAGA KAWAL AMBULANS',
        statusColor: '#10B981',
        tugas: 'Tugas: Prioritas Jalur Darurat Koridor Medis Salemba',
        telemetri: 'Kecepatan: 25 km/jam • Sinyal GPS Prima'
      }
    ];

    // Ambil tambahan unit terdaftar dari localStorage jika ada
    try {
      const registeredList = JSON.parse(localStorage.getItem('simapres_registered_units') || '[]');
      registeredList.forEach((reg, idx) => {
        if (!masterRekan.some(m => m.nrp === reg.nrp)) {
          const isLantas = (reg.unitId === 'lantas');
          const isReskrim = (reg.unitId === 'reskrim');
          masterRekan.push({
            key: 'reg_unit_' + idx,
            nrp: reg.nrp,
            pos: reg.gpsCoords || { lat: -6.2100 + (idx * 0.005), lng: 106.8400 + (idx * 0.004) },
            iconEmoji: isLantas ? '🚓' : (isReskrim ? '🕵️' : '🚔'),
            icon: isLantas ? iconLantasRekan : iconSamaptaRekan,
            title: `Unit ${reg.satuanNama} (${reg.kelompokRegu || 'Patroli'})`,
            petugas: `${reg.nama} (NRP ${reg.nrp})`,
            sub: `${reg.satuanNama} • Device: ${reg.deviceID || 'DEV-GPS'}`,
            status: 'Status: SIAGA AKTIF (GPS TERKUNCI)',
            statusColor: '#10B981',
            tugas: `Tugas: Siaga Patroli & Respon 110 • Sektor Presisi`,
            telemetri: `Device ID: ${reg.deviceID || '-'} • Telemetri HP Terhubung`
          });
        }
      });
    } catch (e) {
      console.warn('Gagal load registered units ke peta:', e);
    }

    const activeRekan = masterRekan.filter(r => r.nrp !== userNrp);

      window.otherMarkers = activeRekan.map(rekanData => {
        if (window.markerDataMap) window.markerDataMap[rekanData.key] = rekanData;
        const marker = new google.maps.Marker({
          position: rekanData.pos,
          map: null,
          icon: rekanData.icon,
          title: rekanData.title,
          cursor: 'pointer'
        });
        google.maps.event.addListener(marker, 'click', () => {
          bukaModalMapUnit(rekanData, marker, mapFullscreen);
        });
        rekanData._markerFs = marker;
        return marker;
      });
    } else {
      window.otherMarkers = [];
    }
  } catch (e) {
    console.warn('Inisialisasi peta ditunda/gagal:', e);
  }
}

function toggleSebaranPersonel() {
  const chk = document.getElementById('toggle-personel');
  const isChecked = chk ? chk.checked : false;
  if (window.otherMarkers && Array.isArray(window.otherMarkers)) {
    window.otherMarkers.forEach(m => {
      m.setMap(isChecked ? mapFullscreen : null);
    });
  }
}

function zoomMapBeranda(delta) {
  if (mapBeranda) {
    const curZoom = mapBeranda.getZoom() || 13;
    mapBeranda.setZoom(curZoom + delta);
  }
}

function resetCenterMapBeranda() {
  if (mapBeranda) {
    let liveCenter = { lat: -6.1980, lng: 106.8245 };
    let liveZoom = 13;
    try {
      const scan = JSON.parse(localStorage.getItem('simapres_latest_hp_scan') || sessionStorage.getItem('simapres_scanned_device') || 'null');
      if (scan && scan.coords) {
        liveCenter = scan.coords;
        liveZoom = 14;
      }
    } catch(e) {}
    mapBeranda.setZoom(liveZoom);
    mapBeranda.panTo(liveCenter);
  }
}

function renderUnitModalHtml(data) {
  return `
        <div style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; width:300px; padding:2px 2px 4px 2px; color:#1E293B; line-height:1.4;">
          <div style="font-size:15px; font-weight:800; color:#0284C7; display:flex; align-items:center; gap:7px; margin-bottom:5px;">
            <span style="font-size:16px;">${data.iconEmoji || '🚔'}</span>
            <span>${data.title || 'Patroli Unit'}</span>
          </div>
          <div style="font-size:13.5px; font-weight:700; color:#1E293B; line-height:1.3; margin-bottom:2px;">
            ${data.petugas || '-'}
          </div>
          <div style="font-size:11.5px; color:#64748B; margin-bottom:8px; line-height:1.4;">
            ${data.sub || '-'}
          </div>
          <div style="border-top:1px solid #E2E8F0; margin:8px 0 6px 0;"></div>
          <div style="font-size:13px; font-weight:800; color:${data.statusColor || '#10B981'}; margin-bottom:3px;">
            ${data.status || 'Status: SIAGA'}
          </div>
          <div style="font-size:12px; color:#475569; margin-bottom:3px; line-height:1.4;">
            ${data.tugas || '-'}
          </div>
          <div style="font-size:11.5px; color:#64748B;">
            ${data.telemetri || '-'}
          </div>
        </div>
      `;
}

function bukaModalMapUnit(data, marker, targetMap) {
  if (!data) return;

  const viewPeta = document.getElementById('view-peta');
  const isPetaActive = viewPeta && viewPeta.classList.contains('active');
  const activeMap = targetMap || (isPetaActive ? mapFullscreen : mapBeranda);
  const activeMarker = marker || (isPetaActive ? (data._markerFs || data._markerB) : (data._markerB || data._markerFs));

  if (activeMap && activeMarker) {
    if (!window.mapUnitInfoWindow) {
      window.mapUnitInfoWindow = new google.maps.InfoWindow({
        maxWidth: 340,
        disableAutoPan: false
      });
    }
    window.mapUnitInfoWindow.setContent(renderUnitModalHtml(data));
    window.mapUnitInfoWindow.open({
      anchor: activeMarker,
      map: activeMap
    });
    activeMap.panTo(data.pos);
  }
}

function tutupModalMapUnit() {
  if (window.mapUnitInfoWindow) {
    window.mapUnitInfoWindow.close();
  }
  const modalB = document.getElementById('modal-map-unit-detail');
  if (modalB) modalB.style.display = 'none';
  const modalFs = document.getElementById('modal-map-unit-detail-fs');
  if (modalFs) modalFs.style.display = 'none';
}

function fokusUnitMap(tipe) {
  if (!window.markerDataMap) return;
  if (tipe === 'samapta' && window.markerDataMap.samapta1) {
    bukaModalMapUnit(window.markerDataMap.samapta1);
  } else if (tipe === 'perintis' && window.markerDataMap.perintis1) {
    bukaModalMapUnit(window.markerDataMap.perintis1);
  } else if (tipe === 'lantas' && window.markerDataMap.lantas1) {
    bukaModalMapUnit(window.markerDataMap.lantas1);
  } else if (tipe === 'hotspot' && window.markerDataMap.hotspot3) {
    bukaModalMapUnit(window.markerDataMap.hotspot3);
  }
}

window.onload = () => {
  initMaps();
  initCharts();
};

function switchTab(viewId, navElement) {
  const urlParams = new URLSearchParams(window.location.search);
  const role = urlParams.get('role');
  const activeUser = (typeof getActiveSessionUser === 'function') ? getActiveSessionUser() : null;
  const isSuperCmd = (role === 'pawas' || role === 'pimpinan' || (activeUser && (activeUser.role === 'pawas' || activeUser.role === 'pimpinan' || activeUser.unitId === 'pawas_spkt')));

  // Jika super user komando, seluruh tab (Validasi, Operator SPKT, Beranda, Peta) dapat diakses penuh bebas hambatan
  if (!isSuperCmd && role === 'operator' && (viewId === 'view-validasi' || viewId === 'view-tolak')) {
    alert('Akses Dibatasi: Halaman Validasi Atasan khusus untuk Perwira Pengawas (PAWAS).');
    viewId = 'view-operator';
  }

  document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
  const targetEl = document.getElementById(viewId);
  if (targetEl) targetEl.classList.add('active');

  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

  if (navElement) {
    navElement.classList.add('active');
  } else {
    // Find corresponding bottom nav item to highlight if clicked from elsewhere
    let targetIndex = -1;
    if (viewId === 'view-beranda') targetIndex = 0;
    else if (viewId === 'view-peta') targetIndex = 1;
    else if (viewId === 'view-log' || viewId === 'view-validasi') targetIndex = 2;
    else if (viewId === 'view-laporan') targetIndex = 3;
    else if (viewId === 'view-profil') targetIndex = 4;

    if (targetIndex >= 0) {
      const navItems = document.querySelectorAll('.nav-item');
      if (navItems[targetIndex]) navItems[targetIndex].classList.add('active');
    }
  }

  // Resize map if needed
  if (viewId === 'view-beranda' && mapBeranda && typeof google !== 'undefined') {
    google.maps.event.trigger(mapBeranda, 'resize');
    let liveCenter = { lat: -6.1980, lng: 106.8245 };
    let liveZoom = 13;
    try {
      const scan = JSON.parse(localStorage.getItem('simapres_latest_hp_scan') || sessionStorage.getItem('simapres_scanned_device') || 'null');
      if (scan && scan.coords) {
        liveCenter = scan.coords;
        liveZoom = 14;
      }
    } catch(e) {}
    mapBeranda.setCenter(liveCenter);
    mapBeranda.setZoom(liveZoom);
  }
  if (viewId === 'view-peta' && mapFullscreen && typeof google !== 'undefined') {
    google.maps.event.trigger(mapFullscreen, 'resize');
    let liveCenter = { lat: -6.1950, lng: 106.8200 };
    let liveZoom = 13;
    try {
      const scan = JSON.parse(localStorage.getItem('simapres_latest_hp_scan') || sessionStorage.getItem('simapres_scanned_device') || 'null');
      if (scan && scan.coords) {
        liveCenter = scan.coords;
        liveZoom = 14;
      }
    } catch(e) {}
    mapFullscreen.setCenter(liveCenter);
    mapFullscreen.setZoom(liveZoom);
  }
  if (viewId === 'view-operator') {
    renderEbOperatorQueue();
  }
  if (viewId === 'view-log') {
    if (typeof initViewLogKegiatan === 'function') initViewLogKegiatan();
  }
  if (viewId === 'view-profil') {
    syncProfileData(role);
    renderRiwayatLogLengkap();
    mulaiJamLiveProfil();
  }
  if (viewId === 'view-laporan') {
    const isPim = (role === 'pimpinan' || role === 'atasan' || role === 'pawas');
    const lapPim = document.getElementById('laporan-pimpinan-container');
    const lapAng = document.getElementById('laporan-anggota-container');
    if (isPim) {
      if (lapPim) lapPim.style.display = 'block';
      if (lapAng) lapAng.style.display = 'none';
      renderPimpinanExecutiveDashboard();
    initPawasKinerjaCharts();
      renderPawasInsidenTable();
    } else {
      if (lapPim) lapPim.style.display = 'none';
      if (lapAng) lapAng.style.display = 'block';
    }
  }
}

function openRespon(jenis) {
  // Set field jenis kegiatan di Screen 6
  const jenisEl = document.getElementById('respon-jenis');
  if (jenisEl) {
    jenisEl.value = jenis;
  }
  // Buka halaman formulir respon
  switchTab('view-respon');
}

// ==========================================
// CENTRALIZED DATA MODEL & LOCAL STORAGE
// ==========================================

function getDefaultLogs() {
  const defaultList = [
    // =========================================================================
    // 13 DATA MENUNGGU TINDAKAN (ID 1 - 13)
    // Komposisi: 4 SOS Panic + 4 Layanan 110 + 4 Portal Warga + 1 Personel Polri
    // =========================================================================
    {
      id: 1,
      platform: 'sos',
      platformBadge: '🚨 SOS PANIC',
      kategoriInsiden: 'Kamtibmas',
      kategoriBadge: '💥 Kamtibmas & Tawuran',
      tipePelapor: 'sos',
      nama: 'Sdr. Kevin Wardana',
      noTelpPelapor: '0812-9911-2233',
      nikPelapor: '3174052108960002',
      gpsCoords: '-6.2421, 106.7982',
      sumberLaporan: '🚨 Tombol Darurat SOS Presisi (Live GPS)',
      sumberSingkat: 'SOS PANIC',
      avatar: SVG_AVATAR_WARGA,
      status: 'menunggu',
      statusText: 'Menunggu Tindakan',
      title: '🚨 Peringatan SOS: Tawuran Remaja Bawa Senjata Tajam di Halte',
      deskripsi: 'Aktivasi Panic Button SOS oleh warga: Gerombolan 15+ remaja berkumpul membawa balok & sajam di dekat halte bus. Warga ketakutan melintas, butuh pencegatan darurat regu Samapta.',
      jenisInsiden: 'Tawuran & Senjata Tajam',
      sektor: 'Sektor Selatan',
      waktu: '07:14 WIB',
      urgensi: '🚨 Darurat',
      fotoLampiran: 'assets/images/polri_insiden_tawuran.jpg',
      fotoPengaduan: 'assets/images/polri_insiden_tawuran.jpg',
      lokasiKejadian: 'Jl. Panglima Polim Raya No. 42 (Dekat Halte Bus), Kebayoran Baru',
      alasanTolak: ''
    },
    {
      id: 2,
      platform: 'warga',
      platformBadge: '📱 PORTAL WARGA',
      kategoriInsiden: 'Laka Lantas',
      kategoriBadge: '🚗 Laka Lantas',
      tipePelapor: 'warga',
      nama: 'Budi Santoso, S.T.',
      noTelpPelapor: '0856-9123-8842',
      nikPelapor: '3171021405820001',
      gpsCoords: '-6.2398, 106.8245',
      sumberLaporan: '📱 Portal Presisi Pengaduan Warga (Online)',
      sumberSingkat: 'PORTAL WARGA',
      avatar: SVG_AVATAR_WARGA,
      status: 'menunggu',
      statusText: 'Menunggu Tindakan',
      title: 'Truk Kontainer Mogok Patah As Roda di Jalur Underpass',
      deskripsi: 'Laporan Pengemudi via Portal: Patah as roda pada truk kontainer muatan berat menutup 2 lajur arah Kuningan. Macet mengular 2,5 km, butuh bantuan mobil derek kepolisian.',
      jenisInsiden: 'Gangguan Lalu Lintas & Derek',
      sektor: 'Sektor Selatan',
      waktu: '07:22 WIB',
      urgensi: '⚠️ Sedang',
      fotoLampiran: 'assets/images/polri_insiden_lakalantas.jpg',
      fotoPengaduan: 'assets/images/polri_insiden_lakalantas.jpg',
      lokasiKejadian: 'Underpass Mampang Prapatan, Jakarta Selatan',
      alasanTolak: ''
    },
    {
      id: 3,
      platform: 'layanan110',
      platformBadge: '📞 LAYANAN 110',
      kategoriInsiden: 'Kriminalitas',
      kategoriBadge: '⚔️ Kriminalitas',
      tipePelapor: 'layanan110',
      nama: 'Sdri. Rina Indah Wulandari',
      noTelpPelapor: '0813-1456-9901',
      nikPelapor: '3174094408910005',
      gpsCoords: '-6.2812, 106.7924',
      sumberLaporan: '📞 Panggilan Darurat 110 (Call Center)',
      sumberSingkat: 'LAYANAN 110',
      avatar: SVG_AVATAR_WARGA,
      status: 'menunggu',
      statusText: 'Menunggu Tindakan',
      title: 'Panggilan 110: Percobaan Curanmor Roda-2 di Parkiran Toko',
      deskripsi: 'Laporan Warga 110 (Sdri. Rina): Karyawati toko melihat 2 pria tak dikenal merusak kunci kontak motor Beat di parkiran ruko. Pelaku kabur ke arah Cilandak saat ditegur satpam.',
      jenisInsiden: 'Tindak Pidana Curanmor',
      sektor: 'Sektor Selatan',
      waktu: '07:35 WIB',
      urgensi: '🚨 Darurat',
      fotoLampiran: 'assets/images/polri_insiden_curanmor.jpg',
      fotoPengaduan: 'assets/images/polri_insiden_curanmor.jpg',
      lokasiKejadian: 'Komplek Ruko Grand Fatmawati Blok B No. 7',
      alasanTolak: ''
    },
    {
      id: 4,
      platform: 'personel',
      platformBadge: '👮 PATROLI POLRI',
      kategoriInsiden: 'PATROLI',
      kategoriBadge: '🚔 Patroli Wilayah',
      tipePelapor: 'internal',
      nama: 'Aipda Ridwan (NRP: 78040112)',
      nrp: '78040112',
      kesatuan: 'Unit Patroli Samapta Presisi R-4',
      sumberLaporan: '👮 Inisiatif Patroli Mandiri Personel Polri',
      sumberSingkat: 'PATROLI POLRI',
      avatar: 'assets/images/avatar_polisi.jpg',
      status: 'menunggu',
      statusText: 'Menunggu Tindakan',
      title: 'Patroli Dialogis Perbankan & Gerai ATM 24 Jam',
      deskripsi: 'Giat Inisiatif Patroli Samapta: Pengecekan CCTV & sambang sekuriti gedung perbankan. Memastikan tidak ada alat skimming atau aktivitas mencurigakan di area ATM.',
      jenisInsiden: 'Pengamanan Objek Vital Perbankan',
      sektor: 'Sektor Pusat',
      waktu: '07:48 WIB',
      urgensi: 'ℹ️ Normal',
      fotoLampiran: 'assets/images/polri_insiden_tawuran.jpg',
      fotoPengaduan: 'assets/images/polri_insiden_tawuran.jpg',
      lokasiKejadian: 'Kawasan Bisnis Sudirman Kav. 24-26, Senayan',
      alasanTolak: ''
    },
    {
      id: 5,
      platform: 'layanan110',
      platformBadge: '📞 LAYANAN 110',
      kategoriInsiden: 'Kamtibmas',
      kategoriBadge: '💥 Kamtibmas & Tawuran',
      tipePelapor: 'layanan110',
      nama: 'Pak Hendro Wicaksono (Ketua RT)',
      noTelpPelapor: '0818-0921-4475',
      nikPelapor: '3173012503710002',
      gpsCoords: '-6.1732, 106.7915',
      sumberLaporan: '📞 Panggilan Darurat 110 (Call Center)',
      sumberSingkat: 'LAYANAN 110',
      avatar: SVG_AVATAR_WARGA,
      status: 'menunggu',
      statusText: 'Menunggu Tindakan',
      title: 'Panggilan 110: Cekcok Warga Mengenai Parkir Liar Akses Rumah',
      deskripsi: 'Laporan Pengurus RT: Adu mulut antar warga akibat mobil tamu parkir sembarangan menutup akses gerbang rumah warga. Memohon kehadiran Bhabinkamtibmas untuk mediasi damai.',
      jenisInsiden: 'Mediasi Kamtibmas Warga',
      sektor: 'Sektor Barat',
      waktu: '08:05 WIB',
      urgensi: 'ℹ️ Normal',
      fotoLampiran: 'assets/images/polri_insiden_tawuran.jpg',
      fotoPengaduan: 'assets/images/polri_insiden_tawuran.jpg',
      lokasiKejadian: 'Jl. Tomang Asri Blok C RT 03/RW 05, Grogol',
      alasanTolak: ''
    },
    {
      id: 6,
      platform: 'sos',
      platformBadge: '🚨 SOS PANIC',
      kategoriInsiden: 'Kriminalitas',
      kategoriBadge: '⚔️ Kriminalitas',
      tipePelapor: 'sos',
      nama: 'Sdri. Clarissa Putri (Pengendara Motor)',
      noTelpPelapor: '0821-3344-5566',
      nikPelapor: '3173066107870004',
      gpsCoords: '-6.1668, 106.7891',
      sumberLaporan: '🚨 Tombol Darurat SOS Presisi (Live GPS)',
      sumberSingkat: 'SOS PANIC',
      avatar: SVG_AVATAR_WARGA,
      status: 'menunggu',
      statusText: 'Menunggu Tindakan',
      title: '🚨 Peringatan SOS: Dugaan Penguntitan & Percobaan Begal Jalanan',
      deskripsi: 'Aktivasi SOS Darurat: Pengendara wanita merasa dibuntuti 2 motor tanpa plat nomor di flyover sepi. Korban berhenti di dekat SPBU dan mengaktifkan suar darurat SIMAPRES.',
      jenisInsiden: 'Ancaman Kejahatan Jalanan',
      sektor: 'Sektor Barat',
      waktu: '08:18 WIB',
      urgensi: '🚨 Darurat',
      fotoLampiran: 'assets/images/polri_insiden_curanmor.jpg',
      fotoPengaduan: 'assets/images/polri_insiden_curanmor.jpg',
      lokasiKejadian: 'Flyover Roxy Mas Arah Grogol, Jakarta Barat',
      alasanTolak: ''
    },
    {
      id: 7,
      platform: 'warga',
      platformBadge: '📱 PORTAL WARGA',
      kategoriInsiden: 'Darurat Bencana',
      kategoriBadge: '🔥 Darurat Bencana',
      tipePelapor: 'warga',
      nama: 'Ibu Ratna Dewi (Warga Rawamangun)',
      noTelpPelapor: '0812-3456-7890',
      nikPelapor: '3175034107850002',
      gpsCoords: '-6.1954, 106.8832',
      sumberLaporan: '📱 Portal Presisi Pengaduan Warga (Online)',
      sumberSingkat: 'PORTAL WARGA',
      avatar: SVG_AVATAR_WARGA,
      status: 'menunggu',
      statusText: 'Menunggu Tindakan',
      title: 'Laporan Warga: Pohon Rindang Tumbang Timpa Jaringan Kabel Listrik',
      deskripsi: 'Laporan Warga via Portal: Dahan pohon trembesi besar patah melintang di jalan raya menimpa jaringan kabel listrik PLN dan kabel optik. Arus lalin tersendat, butuh pengamanan lokasi.',
      jenisInsiden: 'Bencana Pohon Tumbang',
      sektor: 'Sektor Timur',
      waktu: '08:32 WIB',
      urgensi: '⚠️ Sedang',
      fotoLampiran: 'assets/images/polri_insiden_pohontumbang.jpg',
      fotoPengaduan: 'assets/images/polri_insiden_pohontumbang.jpg',
      lokasiKejadian: 'Jl. Pemuda No. 88, Rawamangun, Pulo Gadung',
      alasanTolak: ''
    },
    {
      id: 8,
      platform: 'sos',
      platformBadge: '🚨 SOS PANIC',
      kategoriInsiden: 'Kriminalitas',
      kategoriBadge: '⚔️ Kriminalitas',
      tipePelapor: 'sos',
      nama: 'Pak Bambang Hidayat',
      noTelpPelapor: '0812-7788-9900',
      nikPelapor: '3175041002760001',
      gpsCoords: '-6.2341, 106.8762',
      sumberLaporan: '🚨 Tombol Darurat SOS Presisi (Live GPS)',
      sumberSingkat: 'SOS PANIC',
      avatar: SVG_AVATAR_WARGA,
      status: 'menunggu',
      statusText: 'Menunggu Tindakan',
      title: '🚨 Peringatan SOS: Temuan Sepeda Motor Ditinggal di Semak Bantaran Kali',
      deskripsi: 'Warga menekan tombol SOS: Menemukan 1 unit sepeda motor matic tanpa plat nomor ditinggalkan di semak tepi kali sejak subuh. Diduga hasil curanmor yang disembunyikan.',
      jenisInsiden: 'Temuan Kendaraan Curian',
      sektor: 'Sektor Timur',
      waktu: '08:45 WIB',
      urgensi: '⚠️ Sedang',
      fotoLampiran: 'assets/images/polri_insiden_curanmor.jpg',
      fotoPengaduan: 'assets/images/polri_insiden_curanmor.jpg',
      lokasiKejadian: 'Bantaran Saluran Kalimalang KM 3.5, Cipinang',
      alasanTolak: ''
    },
    {
      id: 9,
      platform: 'layanan110',
      platformBadge: '📞 LAYANAN 110',
      kategoriInsiden: 'Kriminalitas',
      kategoriBadge: '⚔️ Kriminalitas',
      tipePelapor: 'layanan110',
      nama: 'Ahmad Fauzi (Pedagang Pasar)',
      noTelpPelapor: '0877-6543-2109',
      nikPelapor: '3175082006880007',
      gpsCoords: '-6.2731, 106.8681',
      sumberLaporan: '📞 Panggilan Darurat 110 (Call Center)',
      sumberSingkat: 'LAYANAN 110',
      avatar: SVG_AVATAR_WARGA,
      status: 'menunggu',
      statusText: 'Menunggu Tindakan',
      title: 'Panggilan 110: Premanisme & Dugaan Pungli Bongkar Muat Pasar',
      deskripsi: 'Laporan Pedagang Pasar ke 110: Oknum preman meminta uang bongkar muat secara paksa kepada sopir pikap. Pelaku mengancam merusak ban jika tidak diberikan uang tunai.',
      jenisInsiden: 'Penertiban Premanisme & Pungli',
      sektor: 'Sektor Timur',
      waktu: '09:05 WIB',
      urgensi: '⚠️ Sedang',
      fotoLampiran: 'assets/images/polri_insiden_tawuran.jpg',
      fotoPengaduan: 'assets/images/polri_insiden_tawuran.jpg',
      lokasiKejadian: 'Pintu Masuk Barat Pasar Induk Kramat Jati',
      alasanTolak: ''
    },
    {
      id: 10,
      platform: 'warga',
      platformBadge: '📱 PORTAL WARGA',
      kategoriInsiden: 'Kamtibmas',
      kategoriBadge: '💥 Kamtibmas & Tawuran',
      tipePelapor: 'warga',
      nama: 'Irfan Hakim, S.Kom.',
      noTelpPelapor: '0817-2233-4455',
      nikPelapor: '3172011904940002',
      gpsCoords: '-6.1389, 106.8691',
      sumberLaporan: '📱 Portal Presisi Pengaduan Warga (Online)',
      sumberSingkat: 'PORTAL WARGA',
      avatar: SVG_AVATAR_WARGA,
      status: 'menunggu',
      statusText: 'Menunggu Tindakan',
      title: 'Aduan Warga: Gangguan Musik Kafe Bising Melebihi Batas Waktu',
      deskripsi: 'Laporan Warga via Portal Presisi: Kafe live music memutar sound system bass dentuman keras hingga pukul 02:00 dini hari di samping komplek perumahan warga.',
      jenisInsiden: 'Gangguan Ketertiban Umum',
      sektor: 'Sektor Utara',
      waktu: '09:22 WIB',
      urgensi: 'ℹ️ Normal',
      fotoLampiran: 'assets/images/polri_insiden_tawuran.jpg',
      fotoPengaduan: 'assets/images/polri_insiden_tawuran.jpg',
      lokasiKejadian: 'Kawasan Danau Sunter Utara, Tanjung Priok',
      alasanTolak: ''
    },
    {
      id: 11,
      platform: 'warga',
      platformBadge: '📱 PORTAL WARGA',
      kategoriInsiden: 'Laka Lantas',
      kategoriBadge: '🚗 Laka Lantas',
      tipePelapor: 'warga',
      nama: 'dr. Tirta Prasetya',
      noTelpPelapor: '0819-5566-7788',
      nikPelapor: '3171042306890001',
      gpsCoords: '-6.1845, 106.8423',
      sumberLaporan: '📱 Portal Presisi Pengaduan Warga (Online)',
      sumberSingkat: 'PORTAL WARGA',
      avatar: SVG_AVATAR_WARGA,
      status: 'menunggu',
      statusText: 'Menunggu Tindakan',
      title: 'Laporan Warga: Tabrakan Beruntun 3 Minibus di TL Lampu Merah',
      deskripsi: 'Laporan Pengendara via Portal: Tabrakan beruntun di lampu merah akibat rem blong. Tidak ada korban jiwa namun kendaraan melintang di lajur utama menyebabkan kemacetan parah.',
      jenisInsiden: 'Kecelakaan Lalu Lintas Beruntun',
      sektor: 'Sektor Pusat',
      waktu: '09:38 WIB',
      urgensi: '⚠️ Sedang',
      fotoLampiran: 'assets/images/polri_insiden_lakalantas.jpg',
      fotoPengaduan: 'assets/images/polri_insiden_lakalantas.jpg',
      lokasiKejadian: 'Simpang Lima Senen / TL Coca Cola, Jakarta Pusat',
      alasanTolak: ''
    },
    {
      id: 12,
      platform: 'sos',
      platformBadge: '🚨 SOS PANIC',
      kategoriInsiden: 'Pelayanan Publik',
      kategoriBadge: '🤝 Pelayanan Publik',
      tipePelapor: 'sos',
      nama: 'Ibu Dewi Lestari (Ibu Korban)',
      noTelpPelapor: '0819-8765-4321',
      nikPelapor: '3171035508890006',
      gpsCoords: '-6.1754, 106.8272',
      sumberLaporan: '🚨 Tombol Darurat SOS Presisi (Live GPS)',
      sumberSingkat: 'SOS PANIC',
      avatar: SVG_AVATAR_WARGA,
      status: 'menunggu',
      statusText: 'Menunggu Tindakan',
      title: '🚨 Peringatan SOS: Anak Balita Terpisah dari Ibu di Keramaian Monas',
      deskripsi: 'Aktivasi SOS Darurat Ibu: Balita usia 4 tahun terpisah di area taman Monas pintu barat daya saat ramai pengunjung. Ciri-ciri: kaos kuning, celana biru dongker, membawa botol minum.',
      jenisInsiden: 'Pencarian Anak Hilang',
      sektor: 'Sektor Pusat',
      waktu: '09:55 WIB',
      urgensi: '🚨 Darurat',
      fotoLampiran: 'assets/images/polri_insiden_pelayanan_publik.jpg',
      fotoPengaduan: 'assets/images/polri_insiden_pelayanan_publik.jpg',
      lokasiKejadian: 'Plaza Monumen Nasional Pintu Barat Daya',
      alasanTolak: ''
    },
    {
      id: 13,
      platform: 'layanan110',
      platformBadge: '📞 LAYANAN 110',
      kategoriInsiden: 'Kamtibmas',
      kategoriBadge: '💥 Kamtibmas & Tawuran',
      tipePelapor: 'layanan110',
      nama: 'Pak Joko Subroto (Warga RT 08)',
      noTelpPelapor: '0812-1133-5577',
      nikPelapor: '3174062104750003',
      gpsCoords: '-6.2345, 106.7821',
      sumberLaporan: '📞 Panggilan Darurat 110 (Call Center)',
      sumberSingkat: 'LAYANAN 110',
      avatar: SVG_AVATAR_WARGA,
      status: 'menunggu',
      statusText: 'Menunggu Tindakan',
      title: 'Panggilan 110: Sekelompok Pemuda Pesta Miras Oplosan di Pos Ronda',
      deskripsi: 'Laporan Warga via 110: Kerumunan pemuda tak dikenal berkumpul di pos ronda kosong meminum miras oplosan dan mengganggu pengendara wanita yang melintas.',
      jenisInsiden: 'Penertiban Miras & Kamtibmas',
      sektor: 'Sektor Selatan',
      waktu: '10:15 WIB',
      urgensi: '⚠️ Sedang',
      fotoLampiran: 'assets/images/polri_insiden_tawuran.jpg',
      fotoPengaduan: 'assets/images/polri_insiden_tawuran.jpg',
      lokasiKejadian: 'Pos Kamling RW 08 Permata Hijau, Kebayoran Lama',
      alasanTolak: ''
    },

    // =========================================================================
    // 2 DATA DITOLAK / PERLU REVISI (ID 14, 15)
    // Komposisi: 1 SOS (Salah Pencet) + 1 Portal Warga (Kurang Bukti)
    // =========================================================================
    {
      id: 14,
      platform: 'sos',
      platformBadge: '🚨 SOS PANIC',
      kategoriInsiden: 'Pelayanan Publik',
      kategoriBadge: '🤝 Pelayanan Publik',
      tipePelapor: 'sos',
      nama: 'Sdr. Denny Pratama',
      noTelpPelapor: '0857-8899-0011',
      nikPelapor: '3175021208980004',
      gpsCoords: '-6.2112, 106.8431',
      sumberLaporan: '🚨 Tombol Darurat SOS Presisi (Live GPS)',
      sumberSingkat: 'SOS PANIC',
      avatar: SVG_AVATAR_WARGA,
      status: 'ditolak',
      statusText: 'Ditolak / Revisi',
      title: '🚨 Peringatan SOS: Tombol Panik Tertekan Tidak Sengaja di Rumah',
      deskripsi: 'Alarm SOS menyala dari aplikasi warga. Saat dikonfirmasi operator 110, telepon dipegang anak balita dan bukan kondisi darurat sebenarnya.',
      jenisInsiden: 'Panggilan Panik Tidak Disengaja',
      sektor: 'Sektor Timur',
      waktu: '08:10 WIB',
      urgensi: 'ℹ️ Normal',
      fotoLampiran: 'assets/images/polri_insiden_pelayanan_publik.jpg',
      fotoPengaduan: 'assets/images/polri_insiden_pelayanan_publik.jpg',
      lokasiKejadian: 'Komplek Perumahan Jatinegara Baru Blok A, Jakarta Timur',
      alasanTolak: 'Aktivasi Palsu / Tidak Disengaja - Konfirmasi telepon menyatakan tombol tertekan anak kecil, situasi rumah tangga aman dan kondusif.'
    },
    {
      id: 15,
      platform: 'warga',
      platformBadge: '📱 PORTAL WARGA',
      kategoriInsiden: 'Kriminalitas',
      kategoriBadge: '⚔️ Kriminalitas',
      tipePelapor: 'warga',
      nama: 'Wahyu Setiawan',
      noTelpPelapor: '0857-1122-3344',
      nikPelapor: '3173041908850002',
      gpsCoords: '-6.1523, 106.7214',
      sumberLaporan: '📱 Portal Presisi Pengaduan Warga (Online)',
      sumberSingkat: 'PORTAL WARGA',
      avatar: SVG_AVATAR_WARGA,
      status: 'ditolak',
      statusText: 'Ditolak / Revisi',
      title: 'Pengaduan Portal: Kehilangan Helm di Parkiran Swalayan Tanpa Saksi',
      deskripsi: 'Warga melapor helm hilang di parkiran swalayan namun tidak mencantumkan rekaman CCTV, waktu pasti, maupun kontak petugas sekuriti setempat.',
      jenisInsiden: 'Pencurian Ringan',
      sektor: 'Sektor Barat',
      waktu: '09:00 WIB',
      urgensi: 'ℹ️ Normal',
      fotoLampiran: 'assets/images/polri_insiden_curanmor.jpg',
      fotoPengaduan: 'assets/images/polri_insiden_curanmor.jpg',
      lokasiKejadian: 'Parkiran Swalayan Daan Mogot KM 12',
      alasanTolak: 'Informasi Tidak Lengkap - Mohon lampirkan rekaman CCTV atau nomor saksi sekuriti yang bertugas saat kejadian berlangsung.'
    },

    // =========================================================================
    // 1 DATA SEDANG DIPROSES / DITANGANI (ID 16)
    // Komposisi: 1 SOS Panic Button (Live Tracking Menuju TKP)
    // =========================================================================
    {
      id: 16,
      platform: 'sos',
      platformBadge: '🚨 SOS PANIC',
      kategoriInsiden: 'Kriminalitas',
      kategoriBadge: '⚔️ Kriminalitas',
      tipePelapor: 'sos',
      nama: 'Sdri. Maya Indriani',
      noTelpPelapor: '0812-9988-7766',
      nikPelapor: '3174085104800008',
      gpsCoords: '-6.2289, 106.7892',
      sumberLaporan: '🚨 Tombol Darurat SOS Presisi (Live GPS)',
      sumberSingkat: 'SOS PANIC',
      avatar: SVG_AVATAR_WARGA,
      status: 'menunggu_pengesahan',
      statusText: 'Menunggu Pengesahan Pawas',
      tahap: 5,
      bapTerkirim: true,
      waktuSelesai: '20:06 WIB',
      catatanSelesai: 'Pelaku dan barang bukti motor telah berhasil diamankan',
      waktuTiba: '20:06 WIB',
      deskripsiTindakan: 'Mengamankan lokasi kejadian dan melakukan pengejaran pelaku',
      waktuMeluncur: '18:14 WIB',
      catatanPersiapan: 'Personel lengkap, perlengkapan dinas siap, segera meluncur menuju TKP.',
      fotoPersiapan: 'assets/images/polri_patrol_car.jpg',
      fotoTindakan: 'assets/images/polri_tindakan_tkp.jpg',
      fotoSelesai: 'assets/images/polri_situasi_selesai.jpg',
      title: '🚨 Peringatan SOS: Upaya Pencegatan Curas oleh 4 OTK di Simprug',
      deskripsi: 'Aktivasi SOS Darurat: Pengemudi mobil merasa dipepet 2 motor berboncengan saat melintas di jalanan sepi. Unit Patroli Samapta Presisi telah tuntas melakukan penanganan di TKP.',
      jenisInsiden: 'Percobaan Curas & Kejahatan Jalanan',
      sektor: 'Sektor Selatan',
      waktu: '13:05 WIB',
      urgensi: '🚨 Darurat',
      fotoLampiran: 'assets/images/polri_insiden_curanmor.jpg',
      fotoPengaduan: 'assets/images/polri_insiden_curanmor.jpg',
      lokasiKejadian: 'Jl. Simprug Golf Raya No. 15, Kebayoran Lama',
      alasanTolak: ''
    },

    // =========================================================================
    // 12 DATA SELESAI (ID 17 - 28)
    // Komposisi: 2 SOS + 5 Layanan 110 + 4 Portal Warga + 1 Personel Polri
    // =========================================================================
    {
      id: 17,
      platform: 'layanan110',
      platformBadge: '📞 LAYANAN 110',
      kategoriInsiden: 'Laka Lantas',
      kategoriBadge: '🚗 Laka Lantas',
      tipePelapor: 'layanan110',
      nama: 'Pak Sukardi (Pengemudi Taksi)',
      noTelpPelapor: '0813-8899-0011',
      nikPelapor: '3171011203650004',
      gpsCoords: '-6.1951, 106.8231',
      sumberLaporan: '📞 Panggilan Darurat 110 (Call Center)',
      sumberSingkat: 'LAYANAN 110',
      avatar: SVG_AVATAR_WARGA,
      status: 'selesai',
      statusText: 'Kasus Selesai',
      tahap: 5,
      title: 'Panggilan 110: Mediasi Damai Senggolan Kendaraan Bundaran HI',
      deskripsi: 'Kedua pihak pengemudi sepakat berdamai dan ganti rugi diselesaikan secara kekeluargaan di Pos Polantas Bundaran HI.',
      jenisInsiden: 'Penyelesaian Laka Lantas',
      sektor: 'Sektor Pusat',
      waktu: '06:15 WIB',
      fotoLampiran: 'assets/images/polri_insiden_lakalantas.jpg',
      fotoPengaduan: 'assets/images/polri_insiden_lakalantas.jpg',
      fotoTindakan: 'assets/images/polri_tindakan_tkp.jpg',
      lokasiKejadian: 'Pos Polantas Bundaran HI, Jakarta Pusat',
      alasanTolak: ''
    },
    {
      id: 18,
      platform: 'warga',
      platformBadge: '📱 PORTAL WARGA',
      kategoriInsiden: 'Kamtibmas',
      kategoriBadge: '💥 Kamtibmas & Tawuran',
      tipePelapor: 'warga',
      nama: 'Sdri. Nadia Utami (Pengunjung Taman)',
      noTelpPelapor: '0812-4433-2211',
      nikPelapor: '3174075509920003',
      gpsCoords: '-6.2442, 106.7971',
      sumberLaporan: '📱 Portal Presisi Pengaduan Warga (Online)',
      sumberSingkat: 'PORTAL WARGA',
      avatar: SVG_AVATAR_WARGA,
      status: 'selesai',
      statusText: 'Kasus Selesai',
      tahap: 5,
      title: 'Laporan Portal: Pembubaran Pesta Miras Oplosan di Taman Barito',
      deskripsi: 'Barang bukti 3 botol miras disita dan 6 pemuda diberikan pembinaan di hadapan orang tua serta ketua RT setempat.',
      jenisInsiden: 'Penertiban Miras & Kamtibmas',
      sektor: 'Sektor Selatan',
      waktu: '06:30 WIB',
      fotoLampiran: 'assets/images/polri_insiden_tawuran.jpg',
      fotoPengaduan: 'assets/images/polri_insiden_tawuran.jpg',
      lokasiKejadian: 'Taman Ayodya Barito, Kebayoran Baru',
      alasanTolak: ''
    },
    {
      id: 19,
      platform: 'layanan110',
      platformBadge: '📞 LAYANAN 110',
      kategoriInsiden: 'Pelayanan Publik',
      kategoriBadge: '🤝 Pelayanan Publik',
      tipePelapor: 'layanan110',
      nama: 'Anisa Fitri, S.Pd.',
      noTelpPelapor: '0812-3344-5577',
      nikPelapor: '3174064508930009',
      gpsCoords: '-6.2391, 106.7981',
      sumberLaporan: '📞 Panggilan Darurat 110 (Call Center)',
      sumberSingkat: 'LAYANAN 110',
      avatar: SVG_AVATAR_WARGA,
      status: 'selesai',
      statusText: 'Kasus Selesai',
      tahap: 5,
      title: 'Panggilan 110: Pengembalian Dompet & Berkas Ketinggalan di Halte',
      deskripsi: 'Warga menemukan dompet berisi uang dan KTP di halte busway. Diserahkan ke pos polisi dan berhasil dikembalikan ke pemilik sah.',
      jenisInsiden: 'Pelayanan Temuan Barang Warga',
      sektor: 'Sektor Selatan',
      waktu: '06:45 WIB',
      fotoLampiran: 'assets/images/polri_insiden_pelayanan_publik.jpg',
      fotoPengaduan: 'assets/images/polri_insiden_pelayanan_publik.jpg',
      lokasiKejadian: 'Halte CSW ASEAN, Kebayoran Baru',
      alasanTolak: ''
    },
    {
      id: 20,
      platform: 'warga',
      platformBadge: '📱 PORTAL WARGA',
      kategoriInsiden: 'Laka Lantas',
      kategoriBadge: '🚗 Laka Lantas',
      tipePelapor: 'warga',
      nama: 'H. Syamsul Arifin (Pengguna KRL)',
      noTelpPelapor: '0858-9900-1122',
      nikPelapor: '3173051402680001',
      gpsCoords: '-6.2078, 106.7972',
      sumberLaporan: '📱 Portal Presisi Pengaduan Warga (Online)',
      sumberSingkat: 'PORTAL WARGA',
      avatar: SVG_AVATAR_WARGA,
      status: 'selesai',
      statusText: 'Kasus Selesai',
      tahap: 5,
      title: 'Aduan Portal: Penertiban Angkot Ngetem Bikin Macet Stasiun',
      deskripsi: 'Arus lalin di depan pintu stasiun ditertibkan, sopir angkot diarahkan masuk ke lajur penurunan resmi dan tidak mengunci badan jalan.',
      jenisInsiden: 'Penertiban Lalu Lintas',
      sektor: 'Sektor Barat',
      waktu: '07:00 WIB',
      fotoLampiran: 'assets/images/polri_insiden_lakalantas.jpg',
      fotoPengaduan: 'assets/images/polri_insiden_lakalantas.jpg',
      lokasiKejadian: 'Pintu Keluar Stasiun Palmerah, Jakarta Barat',
      alasanTolak: ''
    },
    {
      id: 21,
      platform: 'sos',
      platformBadge: '🚨 SOS PANIC',
      kategoriInsiden: 'Kamtibmas',
      kategoriBadge: '💥 Kamtibmas & Tawuran',
      tipePelapor: 'sos',
      nama: 'H. Mansyur (Tokoh Masyarakat SOS)',
      noTelpPelapor: '0811-2233-4411',
      nikPelapor: '3173021005580001',
      gpsCoords: '-6.1751, 106.7812',
      sumberLaporan: '🚨 Tombol Darurat SOS Presisi (Live GPS)',
      sumberSingkat: 'SOS PANIC',
      avatar: SVG_AVATAR_WARGA,
      status: 'selesai',
      statusText: 'Kasus Selesai',
      tahap: 5,
      title: '🚨 Peringatan SOS: Pencegahan Cekcok Antar Remaja di Balai Warga',
      deskripsi: 'Respon cepat suar SOS warga: Bhabinkamtibmas dan regu patroli tiba dalam 5 menit, berhasil memediasi kesalahpahaman remaja disaksikan pengurus RW.',
      jenisInsiden: 'Problem Solving Kamtibmas',
      sektor: 'Sektor Barat',
      waktu: '07:15 WIB',
      fotoLampiran: 'assets/images/polri_insiden_tawuran.jpg',
      fotoPengaduan: 'assets/images/polri_insiden_tawuran.jpg',
      lokasiKejadian: 'Balai Warga RW 04 Tanjung Duren Utara',
      alasanTolak: ''
    },
    {
      id: 22,
      platform: 'warga',
      platformBadge: '📱 PORTAL WARGA',
      kategoriInsiden: 'Pelayanan Publik',
      kategoriBadge: '🤝 Pelayanan Publik',
      tipePelapor: 'warga',
      nama: 'Sdri. Felicia Wijaya (Penyewa Toko)',
      noTelpPelapor: '0813-7788-9911',
      nikPelapor: '3172054907910003',
      gpsCoords: '-6.1582, 106.9081',
      sumberLaporan: '📱 Portal Presisi Pengaduan Warga (Online)',
      sumberSingkat: 'PORTAL WARGA',
      avatar: SVG_AVATAR_WARGA,
      status: 'selesai',
      statusText: 'Kasus Selesai',
      tahap: 5,
      title: 'Aduan Portal: Pengamanan & Sterilisasi Keramaian Mall Jelang Buka',
      deskripsi: 'Sterilisasi area parkir dan eskalator mall jelang jam buka akhir pekan, situasi tertib, aman dan nihil gangguan kamtibmas.',
      jenisInsiden: 'Pengamanan Objek Wisata & Niaga',
      sektor: 'Sektor Utara',
      waktu: '07:30 WIB',
      fotoLampiran: 'assets/images/polri_insiden_patroli_obvit.jpg',
      fotoPengaduan: 'assets/images/polri_insiden_patroli_obvit.jpg',
      lokasiKejadian: 'Mall Kelapa Gading 3, Jakarta Utara',
      alasanTolak: ''
    },
    {
      id: 23,
      platform: 'layanan110',
      platformBadge: '📞 LAYANAN 110',
      kategoriInsiden: 'Pelayanan Publik',
      kategoriBadge: '🤝 Pelayanan Publik',
      tipePelapor: 'layanan110',
      nama: 'Dedi Kurniawan (Pejalan Kaki)',
      noTelpPelapor: '0878-1234-5678',
      nikPelapor: '3172041807900003',
      gpsCoords: '-6.1421, 106.8712',
      sumberLaporan: '📞 Panggilan Darurat 110 (Call Center)',
      sumberSingkat: 'LAYANAN 110',
      avatar: SVG_AVATAR_WARGA,
      status: 'selesai',
      statusText: 'Kasus Selesai',
      tahap: 5,
      title: 'Panggilan 110: Bantuan Evakuasi Hewan Terjebak Rangka Jembatan',
      deskripsi: 'Bantuan kemanusiaan personel kepolisian bersama petugas Dishub berhasil mengevakuasi hewan terjebak di ketinggian rangka JPO.',
      jenisInsiden: 'Bantuan Kemanusiaan & Pelayanan',
      sektor: 'Sektor Utara',
      waktu: '07:45 WIB',
      fotoLampiran: 'assets/images/polri_insiden_pelayanan_publik.jpg',
      fotoPengaduan: 'assets/images/polri_insiden_pelayanan_publik.jpg',
      lokasiKejadian: 'JPO Halte Sunter Karya, Tanjung Priok',
      alasanTolak: ''
    },
    {
      id: 24,
      platform: 'personel',
      platformBadge: '👮 PATROLI POLRI',
      kategoriInsiden: 'SAMBANG',
      kategoriBadge: '🤝 Sambang Warga',
      tipePelapor: 'internal',
      nama: 'Bripda Kevin Ananda (NRP: 99010432)',
      nrp: '99010432',
      kesatuan: 'Tim Perintis Presisi R-2',
      sumberLaporan: '👮 Inisiatif Patroli Mandiri Personel Polri',
      sumberSingkat: 'PATROLI POLRI',
      avatar: 'assets/images/avatar_polisi.jpg',
      status: 'selesai',
      statusText: 'Kasus Selesai',
      tahap: 5,
      title: 'Penyuluhan Hukum Tawuran & Narkoba di Karang Taruna',
      deskripsi: 'Edukasi hukum kepada 30 pemuda karang taruna tentang bahaya tawuran dan ancaman pidana kepemilikan senjata tajam.',
      jenisInsiden: 'Penyuluhan Hukum & Kamtibmas',
      sektor: 'Sektor Timur',
      waktu: '08:00 WIB',
      fotoLampiran: 'assets/images/polri_insiden_tawuran.jpg',
      fotoPengaduan: 'assets/images/polri_insiden_tawuran.jpg',
      lokasiKejadian: 'Sekretariat Karang Taruna Kelurahan Cipinang Cempedak',
      alasanTolak: ''
    },
    {
      id: 25,
      platform: 'layanan110',
      platformBadge: '📞 LAYANAN 110',
      kategoriInsiden: 'Kriminalitas',
      kategoriBadge: '⚔️ Kriminalitas',
      tipePelapor: 'layanan110',
      nama: 'Ibu Ratna Sari (Jamaah Masjid)',
      noTelpPelapor: '0813-9876-5432',
      nikPelapor: '3175024409860005',
      gpsCoords: '-6.2312, 106.9012',
      sumberLaporan: '📞 Panggilan Darurat 110 (Call Center)',
      sumberSingkat: 'LAYANAN 110',
      avatar: SVG_AVATAR_WARGA,
      status: 'selesai',
      statusText: 'Kasus Selesai',
      tahap: 5,
      title: 'Panggilan 110: Olah TKP Pembobolan Kotak Amal Rumah Ibadah',
      deskripsi: 'Pemeriksaan rekaman CCTV masjid dan olah TKP awal berhasil mengamankan terduga pelaku di dekat pasar dalam waktu 40 menit.',
      jenisInsiden: 'Tindak Pidana Pencurian',
      sektor: 'Sektor Timur',
      waktu: '08:15 WIB',
      fotoLampiran: 'assets/images/polri_insiden_curanmor.jpg',
      fotoPengaduan: 'assets/images/polri_insiden_curanmor.jpg',
      lokasiKejadian: 'Masjid Jami Al-Hidayah, Duren Sawit',
      alasanTolak: ''
    },
    {
      id: 26,
      platform: 'warga',
      platformBadge: '📱 PORTAL WARGA',
      kategoriInsiden: 'Pelayanan Publik',
      kategoriBadge: '🤝 Pelayanan Publik',
      tipePelapor: 'warga',
      nama: 'Bambang Irawan (Pengurus RW)',
      noTelpPelapor: '0812-7711-2288',
      nikPelapor: '3174061502690001',
      gpsCoords: '-6.2512, 106.7845',
      sumberLaporan: '📱 Portal Presisi Pengaduan Warga (Online)',
      sumberSingkat: 'PORTAL WARGA',
      avatar: SVG_AVATAR_WARGA,
      status: 'selesai',
      statusText: 'Kasus Selesai',
      tahap: 5,
      title: 'Aduan Portal: Pengawalan Penyaluran Bantuan Sosial Lansia',
      deskripsi: 'Penyaluran beras bantuan pangan kepada 120 kepala keluarga lansia berlangsung tertib, aman dan tepat sasaran didampingi Bhabinkamtibmas.',
      jenisInsiden: 'Pengamanan Bantuan Sosial',
      sektor: 'Sektor Selatan',
      waktu: '08:30 WIB',
      fotoLampiran: 'assets/images/polri_insiden_pelayanan_publik.jpg',
      fotoPengaduan: 'assets/images/polri_insiden_pelayanan_publik.jpg',
      lokasiKejadian: 'Kantor Kelurahan Kebayoran Lama Selatan',
      alasanTolak: ''
    },
    {
      id: 27,
      platform: 'sos',
      platformBadge: '🚨 SOS PANIC',
      kategoriInsiden: 'Darurat Bencana',
      kategoriBadge: '🔥 Darurat Bencana',
      tipePelapor: 'sos',
      nama: 'Joko Prasetyo (Warga Johar Baru)',
      noTelpPelapor: '0812-4455-6677',
      nikPelapor: '3171052101790002',
      gpsCoords: '-6.1892, 106.8521',
      sumberLaporan: '🚨 Tombol Darurat SOS Presisi (Live GPS)',
      sumberSingkat: 'SOS PANIC',
      avatar: SVG_AVATAR_WARGA,
      status: 'selesai',
      statusText: 'Kasus Selesai',
      tahap: 5,
      title: '🚨 Peringatan SOS: Evakuasi Cepat Pohon Tumbang Robohkan Pagar Rumah',
      deskripsi: 'Respon cepat alarm SOS: Personel kepolisian bersama Damkar dan warga memotong batang pohon tumbang serta mengamankan jalur evakuasi.',
      jenisInsiden: 'Evakuasi Gangguan Pohon Tumbang',
      sektor: 'Sektor Pusat',
      waktu: '08:45 WIB',
      fotoLampiran: 'assets/images/polri_insiden_pohontumbang.jpg',
      fotoPengaduan: 'assets/images/polri_insiden_pohontumbang.jpg',
      lokasiKejadian: 'Jl. Percetakan Negara IX No. 12, Johar Baru',
      alasanTolak: ''
    },
    {
      id: 28,
      platform: 'layanan110',
      platformBadge: '📞 LAYANAN 110',
      kategoriInsiden: 'Kamtibmas',
      kategoriBadge: '💥 Kamtibmas & Tawuran',
      tipePelapor: 'layanan110',
      nama: 'Ibu Maryam (Warga Dekat PJL)',
      noTelpPelapor: '0818-4455-6688',
      nikPelapor: '3171086203810005',
      gpsCoords: '-6.1724, 106.8482',
      sumberLaporan: '📞 Panggilan Darurat 110 (Call Center)',
      sumberSingkat: 'LAYANAN 110',
      avatar: SVG_AVATAR_WARGA,
      status: 'selesai',
      statusText: 'Kasus Selesai',
      tahap: 5,
      title: 'Panggilan 110: Sterilisasi Jalur Rel Kereta Api dari Kerumunan',
      deskripsi: 'Penertiban kerumunan anak-anak dan pemuda yang nongkrong berbahaya di dekat perlintasan rel kereta api sebidang untuk cegah kecelakaan.',
      jenisInsiden: 'Pengamanan Objek Vital Perkeretaapian',
      sektor: 'Sektor Pusat',
      waktu: '09:00 WIB',
      fotoLampiran: 'assets/images/polri_insiden_tawuran.jpg',
      fotoPengaduan: 'assets/images/polri_insiden_tawuran.jpg',
      lokasiKejadian: 'Perlintasan Sebidang PJL 24 Pasar Senen',
      alasanTolak: ''
    }
  ];

  defaultList.forEach(l => {
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

let appLogs = [];
let selectedLogId = null;
let activeWizardLogId = null;


function getFotoPengaduanByKategori(log) {
  if (!log) return 'assets/images/polri_pengaduan_tkp.jpg';
  const t = ((log.title || '') + ' ' + (log.jenisInsiden || '') + ' ' + (log.kategoriInsiden || '') + ' ' + (log.deskripsi || '') + ' ' + (log.lokasiKejadian || '')).toLowerCase();

  // 1. Tawuran Remaja, Sajam, Premanisme, Pungli, Rel Kereta
  if (t.includes('tawuran') || t.includes('sajam') || t.includes('senjata') || t.includes('preman') || t.includes('pungli') || t.includes('kerumunan') || t.includes('rel kereta') || t.includes('karang taruna')) {
    return 'assets/images/polri_insiden_tawuran.jpg';
  }
  // 2. Curanmor, Kunci Kontak Rusak, Pencurian, Helm, Kotak Amal
  if (t.includes('curanmor') || t.includes('motor') || t.includes('helm') || t.includes('curian') || t.includes('kotak amal') || t.includes('pencurian') || t.includes('kriminalitas')) {
    return 'assets/images/polri_insiden_curanmor.jpg';
  }
  // 3. Darurat Bencana & Pohon Tumbang Timpa Kabel/Jalan
  if (t.includes('pohon') || t.includes('tumbang') || t.includes('bencana') || t.includes('kabel') || t.includes('banjir')) {
    return 'assets/images/polri_insiden_pohontumbang.jpg';
  }
  // 4. Laka Lantas, Senggolan, Truk Mogok, Tabrakan, Angkot
  if (t.includes('laka') || t.includes('tabrakan') || t.includes('truk') || t.includes('angkot') || t.includes('senggolan') || t.includes('rem blong') || t.includes('lalu lintas')) {
    return 'assets/images/polri_insiden_lakalantas.jpg';
  }
  // 5. Patroli Objek Vital Perbankan, ATM, Kawasan Mall
  if (t.includes('atm') || t.includes('bank') || t.includes('mall') || t.includes('perbankan') || t.includes('vital') || t.includes('skimming')) {
    return 'assets/images/polri_insiden_patroli_obvit.jpg';
  }
  // 6. Penertiban Miras Oplosan, Parkir Liar, Musik Bising, Cekcok
  if (t.includes('miras') || t.includes('oplosan') || t.includes('parkir') || t.includes('kafe') || t.includes('bising') || t.includes('cekcok')) {
    return 'assets/images/polri_insiden_miras_oplosan.jpg';
  }
  // 7. Pelayanan Kemanusiaan, Anak Hilang Monas, Dompet Temuan, Bansos
  if (t.includes('anak') || t.includes('balita') || t.includes('dompet') || t.includes('hewan') || t.includes('bansos') || t.includes('sosial') || t.includes('hilang') || t.includes('kemanusiaan')) {
    return 'assets/images/polri_insiden_pelayanan_publik.jpg';
  }
  // 8. Begal, Percobaan Curas, Penguntitan, SOS Darurat Malam Hari
  return 'assets/images/polri_pengaduan_tkp.jpg';
}

function loadLogsFromStorage() {
  const sampleBuktiPengaduan = [
    'assets/images/polri_pengaduan_tkp.jpg',
    'assets/images/polri_insiden_lakalantas.jpg',
    'assets/images/polri_insiden_curanmor.jpg',
    'assets/images/polri_insiden_tawuran.jpg'
  ];
  const sampleBuktiPersiapan = [
    'assets/images/polri_patrol_car.jpg'
  ];
  const sampleBuktiTindakan = [
    'assets/images/polri_tindakan_tkp.jpg'
  ];
  const sampleBuktiSelesai = [
    'assets/images/polri_situasi_selesai.jpg'
  ];

  try {
    const saved = localStorage.getItem('simapres_app_logs_v1');
    if (saved) {
      appLogs = JSON.parse(saved);
      // Auto-upgrade: jika data di storage masih berisi data dummy lawas atau belum memiliki platform lengkap (SOS, Warga, Layanan 110, Personel)
      const hasLegacyDummy = appLogs.some(l =>
        !l.platform ||
        !l.kategoriInsiden ||
        (l.id === 1 && l.platform !== 'sos') ||
        (l.title && l.title.includes('Patroli Dialogis Pasar Jaya')) ||
        (l.fotoLampiran && l.fotoLampiran.includes('Disetujui')) ||
        (l.title && l.title.includes('belum direview'))
      );
      if (hasLegacyDummy) {
        appLogs = getDefaultLogs();
      }

      // Sinkronisasi Kasus ID 16: Kasus penanganan aktif di lapangan (TIKET-110-16X2F)
      const log16 = appLogs.find(l => l.id === 16);
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

      const log28 = appLogs.find(l => l.id === 28);
      if (log28) {
        if (!log28.waktuTiba) log28.waktuTiba = '08:48 WIB';
        if (!log28.waktuSelesai) log28.waktuSelesai = '09:00 WIB';
      }
    } else {
      appLogs = getDefaultLogs();
    }

    // Ensure defaults for tracking timeline & evidence photos
    appLogs.forEach(l => {
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
      if (!l.nomorTiket) l.nomorTiket = 'TIKET-110-' + (l.id < 10 ? '0' + l.id : l.id) + 'X2F';
      if (!l.jenisInsiden) l.jenisInsiden = l.title;

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

      if (!l.lokasiKejadian) l.lokasiKejadian = l.sektor ? l.sektor + ', Jakarta' : 'Jl. Jend. Sudirman, Jakarta';
      if (!l.sumberLaporan) l.sumberLaporan = (l.id % 2 === 0 ? '📞 Panggilan 110 (Call Center)' : '👮 Patroli Mandiri Personel');

      if (!l.riwayatValidasi) {
        l.riwayatValidasi = [
          { waktu: l.waktu || '10:00 WIB', aktor: 'Operator SPKT', aksi: 'Perekaman Laporan', catatan: 'Laporan terdata dari ' + l.sumberLaporan }
        ];
        if (l.status === 'disetujui' || l.status === 'diproses' || l.status === 'selesai') {
          l.riwayatValidasi.push({ waktu: l.waktu || '10:15 WIB', aktor: 'Kompol Hendra (Pawas)', aksi: 'Disetujui', catatan: 'Berkas lengkap dan sesuai SOP' });
        }
        if (l.status === 'ditolak') {
          l.riwayatValidasi.push({ waktu: l.waktu || '10:15 WIB', aktor: 'Kompol Hendra (Pawas)', aksi: 'Ditolak / Revisi', catatan: l.alasanTolak || 'Dokumentasi belum memenuhi standar' });
        }
      }
      // MIGRASI: Hapus data ratingKepuasan yang sebelumnya di-auto-assign (data palsu)
      // ratingKepuasan hanya valid jika diisi langsung oleh warga di portal warga (masyarakat.html)
      const TEKS_RATING_PALSU = [
        'Respon cepat dan penanganan kepolisian profesional',
        'Penanganan kepolisian sangat cepat dan memuaskan.',
        'Penanganan cepat dan memuaskan.'
      ];
      if (l.ratingKepuasan && TEKS_RATING_PALSU.includes(l.ratingKepuasan.ulasan)) {
        l.ratingKepuasan = null;
      }
      if (typeof enrichLogsWithCitizenReviews === 'function') {
        enrichLogsWithCitizenReviews([l]);
      }

      if (l.status === 'diproses') {
        if (!l.disposisi || !l.disposisi.komandan || l.disposisi.komandan.includes('Maya Indriani')) {
          l.disposisi = {
            unit: 'Unit Patroli Samapta Presisi (Unit Roda 4)',
            komandan: 'Bripka Ahmad & Regu Alpha (Unit Samapta Presisi)',
            arahan: 'Datangi TKP dengan sirine biru, amankan perimeter, prioritaskan keselamatan korban.',
            waktuDisposisi: l.waktu || '13:05 WIB',
            targetSlaMenit: 10,
            estimasiJarak: '1.4 km',
            estimasiEta: '± 5 Menit',
            posisiAwal: 'Pos Polisi Subsektor Simprug',
            kekuatan: '4 Personel Lengkap, Alutsista & Bodycam Aktif'
          };
        }
        if (l.disposisi && l.disposisi.arahanTambahan) {
          delete l.disposisi.arahanTambahan;
        }
      }

      // Hanya isi foto/keterangan selesai jika status kasus memang sudah selesai
      if (l.status === 'selesai' || l.tahap >= 5) {
        if (!l.fotoTindakan) l.fotoTindakan = 'assets/images/polri_tindakan_tkp.jpg';
        if (!l.fotoSelesai) l.fotoSelesai = 'assets/images/polri_situasi_selesai.jpg';
        if (!l.fotoPersiapan) l.fotoPersiapan = 'assets/images/polri_patrol_car.jpg';
        if (!l.koordinatGps) l.koordinatGps = '-6.2345, 106.8423';
        if (!l.catatanPersiapan) l.catatanPersiapan = 'Personel lengkap, perlengkapan dinas siap siaga, meluncur menuju TKP.';
      } else if (l.status === 'diproses' && l.tahap === 3 && !l.waktuMeluncur) {
        // Kasus baru didisposisi (belum disubmit Meluncur oleh personel di Wizard)
        delete l.waktuMeluncur;
        delete l.waktuTiba;
        delete l.waktuSelesai;
        delete l.deskripsiTindakan;
        delete l.catatanSelesai;
      }

      // Foto Pengaduan Awal warga (110) selalu ada sejak awal laporan diterima
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
    });
    saveLogsToStorage();
  } catch (e) {
    console.warn('Gagal memuat dari storage, menggunakan data default', e);
    appLogs = getDefaultLogs();
    appLogs.forEach(l => {
      l.fotoPengaduan = getFotoPengaduanByKategori(l);
      l.fotoLampiran = l.fotoPengaduan;
      if (l.status === 'selesai' || l.tahap >= 5) {
        if (!l.fotoPersiapan) l.fotoPersiapan = 'assets/images/polri_patrol_car.jpg';
        if (!l.fotoTindakan) l.fotoTindakan = 'assets/images/polri_tindakan_tkp.jpg';
        if (!l.fotoSelesai) l.fotoSelesai = 'assets/images/polri_situasi_selesai.jpg';
        if (!l.koordinatGps) l.koordinatGps = '-6.2345, 106.8423';
        if (!l.catatanPersiapan) l.catatanPersiapan = 'Personel lengkap, perlengkapan dinas siap siaga, meluncur menuju TKP.';
      }
      if (l.tipePelapor === 'personel' || l.kesatuan || l.nrp) {
        l.avatar = 'assets/images/avatar_polisi.jpg';
      } else if (!l.avatar || l.avatar.includes('unsplash.com')) {
        l.avatar = SVG_AVATAR_WARGA;
      }
      if (typeof enrichLogsWithCitizenReviews === 'function') {
        enrichLogsWithCitizenReviews([l]);
      }
    });
    saveLogsToStorage();
  }
}

function saveLogsToStorage() {
  try {
    localStorage.setItem('simapres_app_logs_v1', JSON.stringify(appLogs));
    sessionStorage.setItem('simapres_app_logs_v1', JSON.stringify(appLogs));

    // Sinkronkan pengaduan aktif secara spesifik ke sessionStorage
    const currentId = (typeof activeWizardLogId !== 'undefined' && activeWizardLogId) || selectedLogId;
    if (currentId) {
      const activeLog = appLogs.find(l => l.id === currentId);
      if (activeLog) {
        sessionStorage.setItem('active_pengaduan', JSON.stringify(activeLog));
        sessionStorage.setItem('active_tiket', activeLog.nomorTiket || ('TIKET-110-' + activeLog.id));
        sessionStorage.setItem('active_tahap', String(activeLog.tahap || 3));
        sessionStorage.setItem('active_status', activeLog.status);
      }
    }
  } catch (e) {
    console.warn('Storage tidak tersedia', e);
  }
}

function resetDemoData() {
  if (confirm('Reset ulang data log ke kondisi default awal (13 Menunggu Tindakan, 2 Ditolak, 1 Sedang Ditangani, 12 Selesai)?')) {
    localStorage.removeItem('simapres_app_logs_v1');
    appLogs = getDefaultLogs();
    saveLogsToStorage();
    updateRekapCounts();
    openValidasiList(isUserPawas() ? 'menunggu' : 'diproses');
  }
}

// Load awal
loadLogsFromStorage();

let currentValidasiFilter = 'menunggu';
let currentPlatformFilter = 'all';
let currentKategoriFilter = 'all';

function updateRekapCounts() {
  const urlParams = new URLSearchParams(window.location.search);
  const role = urlParams.get('role');
  const isPim = (role === 'pimpinan' || role === 'atasan' || role === 'pawas');
  const isOp = (role === 'operator');
  const activeUser = typeof getActiveSessionUser === 'function' ? getActiveSessionUser() : null;

  // 1. GLOBAL SUMMARY (Untuk Beranda & Stat Keseluruhan)
  const cTotal = appLogs.length;
  const cMenunggu = appLogs.filter(l => l.status === 'menunggu').length;
  const cDitolak = appLogs.filter(l => l.status === 'ditolak').length;
  const cDiproses = (isPim || !activeUser)
    ? appLogs.filter(l => l.status === 'diproses').length
    : appLogs.filter(l => l.status === 'diproses' && (typeof isLogAssignedToUser === 'function' ? isLogAssignedToUser(l, activeUser) : true)).length;
  const cPengesahan = (isPim || !activeUser)
    ? appLogs.filter(l => l.status === 'menunggu_pengesahan').length
    : appLogs.filter(l => l.status === 'menunggu_pengesahan' && (typeof isLogAssignedToUser === 'function' ? isLogAssignedToUser(l, activeUser) : true)).length;
  const cSelesai = appLogs.filter(l => l.status === 'selesai').length;

  const cSos = appLogs.filter(l => l.platform === 'sos').length;
  const cWarga = appLogs.filter(l => l.platform === 'warga').length;
  const c110 = appLogs.filter(l => l.platform === 'layanan110').length;
  const cPolri = appLogs.filter(l => l.platform === 'personel').length;

  // Update Card Rekapitulasi di Beranda
  const elTotal = document.getElementById('rekap-total-val');
  const elLabelTotal = document.getElementById('rekap-label-total');
  const elMenunggu = document.getElementById('rekap-menunggu-val');
  const elDisetujui = document.getElementById('rekap-disetujui-val');
  const elDitolak = document.getElementById('rekap-ditolak-val');
  const elDiproses = document.getElementById('rekap-diproses-val');
  const elPengesahan = document.getElementById('rekap-pengesahan-val');
  const elSelesai = document.getElementById('rekap-selesai-val');

  if (elTotal) elTotal.innerText = isPim ? cTotal : (cDiproses + cPengesahan);
  if (elLabelTotal) elLabelTotal.innerText = isPim ? 'TOTAL LAPORAN' : 'TOTAL TUGAS SAYA';
  if (elMenunggu) elMenunggu.innerText = cMenunggu;
  if (elDisetujui) elDisetujui.innerText = '0';
  if (elDitolak) elDitolak.innerText = cDitolak;
  if (elDiproses) elDiproses.innerText = cDiproses;
  if (elPengesahan) elPengesahan.innerText = cPengesahan;
  if (elSelesai) elSelesai.innerText = cSelesai;

  // Role-guard: Sembunyikan Menunggu Tindakan, Ditolak, dan Selesai dari Beranda Personel
  const cardMenunggu = document.getElementById('rekap-box-menunggu');
  const cardDitolak = document.getElementById('rekap-box-ditolak');
  const cardSelesai = document.getElementById('rekap-box-selesai');
  const breakdownPlatform = document.getElementById('rekap-platform-breakdown');

  if (cardMenunggu) cardMenunggu.style.display = isPim ? '' : 'none';
  if (cardDitolak) cardDitolak.style.display = isPim ? '' : 'none';
  if (cardSelesai) cardSelesai.style.display = isPim ? '' : 'none';
  if (breakdownPlatform) breakdownPlatform.style.display = isPim ? 'grid' : 'none';

  // Update 4 Platform Breakdown di Beranda
  const elSos = document.getElementById('rekap-sos-val');
  if (elSos) elSos.innerText = cSos;
  const elWarga = document.getElementById('rekap-warga-val');
  if (elWarga) elWarga.innerText = cWarga;
  const el110 = document.getElementById('rekap-110-val');
  if (el110) el110.innerText = c110;
  const elPolri = document.getElementById('rekap-polri-val');
  if (elPolri) elPolri.innerText = cPolri;

  // 2. STATUS TABS COUNTS (Saling terhubung dengan Platform & Kategori yang sedang aktif)
  const logsForStatusTabs = appLogs.filter(l => {
    const matchPlatform = (currentPlatformFilter === 'all') || (l.platform === currentPlatformFilter);
    const matchKat = (currentKategoriFilter === 'all') || (l.kategoriInsiden === currentKategoriFilter);
    return matchPlatform && matchKat;
  });

  const bSemua = document.getElementById('val-badge-semua');
  const cTugasPersonel = logsForStatusTabs.filter(l => {
    if (!isPim && activeUser && typeof isLogAssignedToUser === 'function' && !isLogAssignedToUser(l, activeUser)) return false;
    return l.status === 'diproses' || l.status === 'menunggu_pengesahan';
  }).length;
  if (bSemua) bSemua.innerText = isPim ? logsForStatusTabs.length : cTugasPersonel;

  const bMenunggu = document.getElementById('val-badge-menunggu');
  if (bMenunggu) bMenunggu.innerText = logsForStatusTabs.filter(l => l.status === 'menunggu').length;
  const bDisetujui = document.getElementById('val-badge-disetujui');
  if (bDisetujui) bDisetujui.innerText = '0';
  const bDitolak = document.getElementById('val-badge-ditolak');
  if (bDitolak) bDitolak.innerText = logsForStatusTabs.filter(l => l.status === 'ditolak').length;
  const bDiproses = document.getElementById('val-badge-diproses');
  if (bDiproses) bDiproses.innerText = logsForStatusTabs.filter(l => {
    if (!isPim && activeUser && typeof isLogAssignedToUser === 'function' && !isLogAssignedToUser(l, activeUser)) return false;
    return l.status === 'diproses';
  }).length;
  const bPengesahan = document.getElementById('val-badge-menunggu_pengesahan');
  if (bPengesahan) bPengesahan.innerText = logsForStatusTabs.filter(l => {
    if (!isPim && activeUser && typeof isLogAssignedToUser === 'function' && !isLogAssignedToUser(l, activeUser)) return false;
    return l.status === 'menunggu_pengesahan';
  }).length;
  const bSelesai = document.getElementById('val-badge-selesai');
  if (bSelesai) bSelesai.innerText = logsForStatusTabs.filter(l => l.status === 'selesai').length;

  // Role-guard: Sembunyikan tab Menunggu Tindakan, Ditolak, dan Selesai di Halaman Validasi untuk Personel
  const tabMenunggu = document.getElementById('val-tab-menunggu');
  const tabDitolak = document.getElementById('val-tab-ditolak');
  const tabSelesai = document.getElementById('val-tab-selesai');
  const tabSemua = document.getElementById('val-tab-semua');
  const barSecondary = document.getElementById('val-filter-secondary-bar');

  if (tabMenunggu) tabMenunggu.style.display = isPim ? '' : 'none';
  if (tabDitolak) tabDitolak.style.display = isPim ? '' : 'none';
  if (tabSelesai) tabSelesai.style.display = isPim ? '' : 'none';
  if (barSecondary) barSecondary.style.display = isPim ? '' : 'none';

  if (tabSemua) {
    tabSemua.innerHTML = isPim
      ? `Semua <span class="val-tab-badge" id="val-badge-semua">${logsForStatusTabs.length}</span>`
      : `Semua Tugas Saya <span class="val-tab-badge primary" id="val-badge-semua">${cTugasPersonel}</span>`;
  }

  // Penyesuaian Header Halaman Validasi / Tugas Lapangan
  const valTitle = document.getElementById('val-page-title');
  const valBadge = document.getElementById('val-page-badge');
  const valDesc = document.getElementById('val-page-desc');
  const valBadgeText = document.getElementById('val-header-badge-text');

  if (isPim) {
    if (valTitle) valTitle.innerText = 'Konsol Monitoring & Komando Pawas';
    if (valBadge) {
      valBadge.innerText = 'SUPERVISI PIKET';
      valBadge.style.background = '#EFF6FF';
      valBadge.style.color = '#1D4ED8';
      valBadge.style.borderColor = '#BFDBFE';
    }
    if (valDesc) valDesc.innerText = 'Supervisi Operasional: Validasi, Disposisi Satuan Lapangan & Otorisasi Penutupan Kasus';
    if (valBadgeText) valBadgeText.innerText = 'Piket Pawas Siaga 24 Jam';
  } else {
    if (valTitle) valTitle.innerText = 'Daftar Penugasan Lapangan';
    if (valBadge) {
      valBadge.innerText = 'TUGAS OPERASIONAL';
      valBadge.style.background = '#F0FDF4';
      valBadge.style.color = '#15803D';
      valBadge.style.borderColor = '#BBF7D0';
    }
    if (valDesc) valDesc.innerText = 'Monitoring Penugasan Lapangan: Respon TKP, Pengisian BAP & Pengajuan Pengesahan';
    if (valBadgeText) valBadgeText.innerText = 'Petugas Patroli Reaksi Cepat';
  }

  // 3. PLATFORM FILTER BAR COUNTS (Saling terhubung dengan Status Tab & Kategori yang sedang aktif)
  const logsForPlatform = appLogs.filter(l => {
    const matchStatus = (currentValidasiFilter === 'semua') || (l.status === currentValidasiFilter);
    const matchKat = (currentKategoriFilter === 'all') || (l.kategoriInsiden === currentKategoriFilter);
    return matchStatus && matchKat;
  });

  const fcAll = document.getElementById('filter-count-all');
  if (fcAll) fcAll.innerText = logsForPlatform.length;
  const fcSos = document.getElementById('filter-count-sos');
  if (fcSos) fcSos.innerText = logsForPlatform.filter(l => l.platform === 'sos').length;
  const fcWarga = document.getElementById('filter-count-warga');
  if (fcWarga) fcWarga.innerText = logsForPlatform.filter(l => l.platform === 'warga').length;
  const fc110 = document.getElementById('filter-count-110');
  if (fc110) fc110.innerText = logsForPlatform.filter(l => l.platform === 'layanan110').length;
  const fcPersonel = document.getElementById('filter-count-personel');
  if (fcPersonel) fcPersonel.innerText = logsForPlatform.filter(l => l.platform === 'personel').length;

  // 4. JENIS ADUAN / GIAT FILTER BAR COUNTS
  if (typeof renderFilterKategoriBar === 'function') {
    renderFilterKategoriBar();
  }

  renderPimpinanExecutiveDashboard();
}

function isUserPawas() {
  const urlParams = new URLSearchParams(window.location.search);
  const role = urlParams.get('role');
  return (role === 'pimpinan' || role === 'pawas' || role === 'atasan');
}

let selectedPawasDisposisiLogId = null;
let currentModalArmadaList = [];

// Fungsi Hitung Estimasi Jarak GPS & Waktu Tiba (ETA) Realistis Berdasarkan TKP Kasus
function hitungEstimasiArmadaUntukLog(log) {
  const sektor = (log.sektor || 'Sektor Selatan').toLowerCase();
  const judul = (log.title || '').toLowerCase();

  return DAFTAR_ARMADA_PRESISI.map((armada) => {
    let jarak = armada.jarakBase;
    let eta = armada.etaBase;

    // Penyesuaian jarak berdasarkan kedekatan sektor wilayah
    if (sektor.includes('selatan')) {
      if (armada.sektorUtama === 'Sektor Selatan') {
        jarak = armada.id === 'samapta-r4-selatan' ? 1.2 : 1.7;
        eta = armada.id === 'samapta-r4-selatan' ? 3 : 4;
      } else {
        jarak += 1.4;
        eta += 3;
      }
    } else if (sektor.includes('barat')) {
      if (armada.sektorUtama === 'Sektor Barat') {
        jarak = 1.3;
        eta = 4;
      } else {
        jarak += 1.2;
        eta += 2;
      }
    } else if (sektor.includes('timur')) {
      if (armada.sektorUtama === 'Sektor Timur') {
        jarak = 1.4;
        eta = 4;
      } else {
        jarak += 1.6;
        eta += 3;
      }
    } else if (sektor.includes('utara')) {
      jarak = +(jarak + 0.9).toFixed(1);
      eta += 2;
    }

    // Penyesuaian tipe kasus (Laka Lantas -> Satlantas, Tawuran/Darurat -> Raimas / Samapta, Curanmor/Narkoba -> Reskrim)
    if (judul.includes('laka') || judul.includes('lalu lintas') || judul.includes('macet') || judul.includes('kendaraan')) {
      if (armada.id === 'lantas' || armada.satuanId === 'lantas') {
        jarak = 1.1;
        eta = 3;
      }
    } else if (judul.includes('tawuran') || judul.includes('balap') || judul.includes('darurat') || judul.includes('senjata')) {
      if (armada.id === 'samapta' || armada.satuanId === 'samapta') {
        jarak = 1.0;
        eta = 3; // Reaksi Cepat Samapta
      }
    } else if (judul.includes('curat') || judul.includes('curanmor') || judul.includes('narkoba') || judul.includes('pencurian')) {
      if (armada.id === 'reskrim' || armada.satuanId === 'reskrim') {
        jarak = Math.max(1.8, +(jarak * 0.6).toFixed(1));
        eta = Math.max(4, eta - 3);
      }
    }

    const jarakFinal = +jarak.toFixed(1);
    const etaFinal = Math.max(2, Math.round(eta));
    const jarakTeks = jarakFinal + ' km';
    const etaTeks = '± ' + etaFinal + ' Menit';

    return {
      ...armada,
      jarakCalc: jarakFinal,
      etaCalc: etaFinal,
      jarakTeks: jarakTeks,
      etaTeks: etaTeks,
      isSlaAman: etaFinal <= 10
    };
  }).sort((a, b) => a.jarakCalc - b.jarakCalc); // Urutkan yang paling dekat di urutan teratas
}

// Update Tampilan Preview Armada Terpilih
function renderPawasFleetPreview(armada) {
  if (!armada) return;

  const dotEl = document.getElementById('pawas-card-status-dot');
  const textEl = document.getElementById('pawas-card-status-text');
  const recBadgeEl = document.getElementById('pawas-card-rec-badge');
  const jarakEl = document.getElementById('pawas-card-jarak');
  const jarakNoteEl = document.getElementById('pawas-card-jarak-note');
  const etaEl = document.getElementById('pawas-card-eta');
  const slaBadgeEl = document.getElementById('pawas-card-sla-badge');
  const komandanEl = document.getElementById('pawas-card-komandan');
  const posisiEl = document.getElementById('pawas-card-posisi');
  const kekuatanEl = document.getElementById('pawas-card-kekuatan');
  const personelInput = document.getElementById('pawas-disp-personel');

  if (jarakEl) jarakEl.innerText = armada.jarakTeks;
  if (etaEl) etaEl.innerText = armada.etaTeks;
  if (komandanEl) komandanEl.innerText = armada.komandan;
  if (posisiEl) posisiEl.innerText = armada.posisiSaatIni;
  if (kekuatanEl) kekuatanEl.innerText = armada.kekuatan;

  // Otomatis sinkronisasi input nama personel
  if (personelInput) personelInput.value = armada.komandan;

  // Penyesuaian note jarak
  if (jarakNoteEl) {
    if (armada.jarakCalc <= 1.5) {
      jarakNoteEl.innerText = '(Zona Sangat Dekat)';
      jarakNoteEl.style.color = '#16A34A';
    } else if (armada.jarakCalc <= 3.0) {
      jarakNoteEl.innerText = '(Radius Standar)';
      jarakNoteEl.style.color = '#2563EB';
    } else {
      jarakNoteEl.innerText = '(Sektor Luar)';
      jarakNoteEl.style.color = '#D97706';
    }
  }

  // Penyesuaian badge SLA
  if (slaBadgeEl) {
    if (armada.isSlaAman) {
      slaBadgeEl.innerText = '(SLA Aman ✅)';
      slaBadgeEl.style.color = '#059669';
    } else {
      slaBadgeEl.innerText = '(SLA Mepet ⚠️)';
      slaBadgeEl.style.color = '#DC2626';
    }
  }

  // Badge Rekomendasi Terdekat
  if (recBadgeEl) {
    if (currentModalArmadaList.length > 0 && armada.id === currentModalArmadaList[0].id) {
      recBadgeEl.innerText = '⚡ REKOMENDASI TERDEKAT';
      recBadgeEl.style.background = '#DCFCE7';
      recBadgeEl.style.color = '#15803D';
      recBadgeEl.style.borderColor = '#BBF7D0';
    } else {
      recBadgeEl.innerText = 'ARMADA CADANGAN';
      recBadgeEl.style.background = '#F1F5F9';
      recBadgeEl.style.color = '#475569';
      recBadgeEl.style.borderColor = '#CBD5E1';
    }
  }
}

// Event Handler saat Dropdown Armada Dipilih
function onPawasArmadaSelectChange() {
  const selectEl = document.getElementById('pawas-disp-unit');
  if (!selectEl) return;
  const selectedId = selectEl.value;
  const armada = currentModalArmadaList.find(a => a.id === selectedId) || currentModalArmadaList[0];
  renderPawasFleetPreview(armada);
}

// Toggle Input Manual Nama Personel
function toggleEditPersonelPawas() {
  const wrap = document.getElementById('pawas-edit-personel-wrap');
  const input = document.getElementById('pawas-disp-personel');
  if (!wrap) return;
  if (wrap.style.display === 'none' || !wrap.style.display) {
    wrap.style.display = 'block';
    if (input) input.focus();
  } else {
    wrap.style.display = 'none';
  }
}

// Template Arahan Cepat
function tambahArahanCepatPawas(teks) {
  const arahanEl = document.getElementById('pawas-disp-arahan');
  if (!arahanEl) return;
  if (!arahanEl.value.trim()) {
    arahanEl.value = teks;
  } else {
    arahanEl.value = arahanEl.value.trim() + ' ' + teks;
  }
}

function bukaModalDisposisiPawas(id) {
  const log = appLogs.find(l => l.id === id);
  if (!log) return;
  selectedPawasDisposisiLogId = id;

  const nomorTiket = log.nomorTiket || ('TIKET-110-' + (log.id < 10 ? '0' + log.id : log.id) + 'X2F');
  log.nomorTiket = nomorTiket;

  const noTiketEl = document.getElementById('pawas-disp-nomor-tiket');
  if (noTiketEl) noTiketEl.innerText = nomorTiket;

  const judulEl = document.getElementById('pawas-disp-judul-kasus');
  if (judulEl) judulEl.innerText = log.title;

  const lokasiEl = document.getElementById('pawas-disp-lokasi-tkp');
  if (lokasiEl) lokasiEl.innerText = '📍 ' + (log.sektor ? log.sektor + ', Jakarta' : 'Jl. Jend. Sudirman, Jakarta');

  const pelaporBadgeEl = document.getElementById('pawas-disp-pelapor-badge');
  const pelaporInfoEl = document.getElementById('pawas-disp-pelapor-info');
  const isWarga = (log.tipePelapor === 'warga');
  if (pelaporBadgeEl) {
    pelaporBadgeEl.innerHTML = isWarga ? '👤 Laporan Warga 110' : '👮 Patroli Internal';
    pelaporBadgeEl.style.background = isWarga ? '#EFF6FF' : '#FEF3C7';
    pelaporBadgeEl.style.color = isWarga ? '#1D4ED8' : '#92400E';
    pelaporBadgeEl.style.borderColor = isWarga ? '#BFDBFE' : '#FDE68A';
  }
  if (pelaporInfoEl) {
    pelaporInfoEl.innerHTML = isWarga
      ? `👤 Pelapor: <strong>${log.nama}</strong> (${log.noTelpPelapor || ''}) via ${log.sumberLaporan || 'Call Center 110'}`
      : `👮 Pelapor: <strong>${log.nama}</strong> (NRP: ${log.nrp || ''}) • ${log.kesatuan || ''}`;
    pelaporInfoEl.style.background = isWarga ? '#EFF6FF' : '#FFFBEB';
    pelaporInfoEl.style.borderColor = isWarga ? '#93C5FD' : '#FCD34D';
    pelaporInfoEl.style.color = isWarga ? '#1E40AF' : '#92400E';
  }

  // Hitung daftar armada terdekat dan urutkan
  currentModalArmadaList = hitungEstimasiArmadaUntukLog(log);

  // Render Dropdown Terpadu
  const unitSelect = document.getElementById('pawas-disp-unit');
  if (unitSelect) {
    unitSelect.innerHTML = currentModalArmadaList.map((a, index) => {
      const isNearest = index === 0;
      const labelTerdekat = isNearest ? ' ★ TERDEKAT' : '';
      return `<option value="${a.id}" ${isNearest ? 'selected' : ''}>
            ${a.icon} ${a.namaSingkat} — ${a.komandan.split('(')[0].trim()} [📍 ${a.jarakTeks} • ${a.etaTeks}${labelTerdekat}]
          </option>`;
    }).join('');
  }

  // Pastikan wrapper edit personel tertutup secara default
  const wrapEdit = document.getElementById('pawas-edit-personel-wrap');
  if (wrapEdit) wrapEdit.style.display = 'none';

  // Render preview armada pertama (terdekat)
  if (currentModalArmadaList.length > 0) {
    renderPawasFleetPreview(currentModalArmadaList[0]);
  }

  const modal = document.getElementById('modal-disposisi-pawas');
  if (modal) modal.style.display = 'flex';
}

function tutupModalDisposisiPawas() {
  const modal = document.getElementById('modal-disposisi-pawas');
  if (modal) modal.style.display = 'none';
  selectedPawasDisposisiLogId = null;
}

function konfirmasiDisposisiPawas() {
  if (!selectedPawasDisposisiLogId) return;
  const log = appLogs.find(l => l.id === selectedPawasDisposisiLogId);
  if (!log) return;

  const unitSelect = document.getElementById('pawas-disp-unit');
  const selectedArmadaId = unitSelect ? unitSelect.value : (currentModalArmadaList[0]?.id || 'samapta');
  const armada = currentModalArmadaList.find(a => a.id === selectedArmadaId) || currentModalArmadaList[0] || DAFTAR_ARMADA_PRESISI[0];

  const unitVal = armada.nama;
  const personelVal = document.getElementById('pawas-disp-personel').value.trim() || armada.komandan;
  const arahanVal = document.getElementById('pawas-disp-arahan').value.trim() || 'Segera datangi TKP, amankan perimeter & prioritaskan keselamatan warga.';
  const jarakVal = armada.jarakTeks;
  const etaVal = armada.etaTeks;
  const posisiVal = armada.posisiSaatIni;
  const kekuatanVal = armada.kekuatan;

  const waktuSekarang = formatWaktuHhMmWib();

  log.status = 'diproses';
  log.statusText = 'Sedang Diproses';
  log.tahap = 3; // Meluncur ke TKP

  // Normalisasi id satuan (5 Satuan Utama: reskrim, intel, lantas, binmas, sabhara)
  const rawId = (armada.satuanId || armada.id || '').toLowerCase();
  const sId = rawId.includes('reskrim') ? 'reskrim' : (rawId.includes('intel') ? 'intel' : (rawId.includes('lantas') ? 'lantas' : (rawId.includes('binmas') || rawId.includes('polsek') ? 'binmas' : 'sabhara')));

  log.assignedUnitId = sId;
  log.assignedSatuan = armada.satuan || unitVal;
  log.assignedNrp = armada.nrpKomandan || '95020123';
  log.assignedNama = personelVal;
  log.acceptedNrps = []; // Wadah bagi setiap personel satuan yang menerima tugas
  log.acceptedPersonels = []; // Detail nama dan pangkat personel yang bergabung

  log.disposisi = {
    unit: unitVal,
    unitId: sId,
    satuan: armada.satuan || unitVal,
    komandan: personelVal,
    nrpKomandan: log.assignedNrp,
    estimasiJarak: jarakVal,
    estimasiEta: etaVal,
    posisiAwal: posisiVal,
    kekuatan: kekuatanVal,
    arahan: arahanVal,
    waktuDisposisi: waktuSekarang,
    pawasNama: (typeof getActiveSessionUser === 'function' && getActiveSessionUser() && getActiveSessionUser().nama ? getActiveSessionUser().nama + ' (Pawas / Kapolres)' : 'Kombes Pol Budi Santoso (Pawas)'),
    targetSlaMenit: 10
  };

  if (!log.riwayatValidasi) log.riwayatValidasi = [];
  log.riwayatValidasi.push({
    waktu: waktuSekarang,
    aktor: (typeof getActiveSessionUser === 'function' && getActiveSessionUser() && getActiveSessionUser().nama ? getActiveSessionUser().nama + ' (Pawas)' : 'Kombes Pol Budi Santoso (Pawas)'),
    aksi: 'Disposisi Satuan Diterbitkan (Broadcast Persatuan)',
    catatan: 'Disiarkan ke: ' + (armada.satuan || unitVal) + ' • Estimasi Jarak: ' + jarakVal + ' (' + etaVal + ' ke TKP). Arahan: "' + arahanVal + '"'
  });

  log._updatedAt = Date.now();
  saveLogsToStorage();
  updateRekapCounts();
  if (typeof renderPimpinanExecutiveDashboard === 'function') {
    renderPimpinanExecutiveDashboard();
  }
  tutupModalDisposisiPawas();

  openValidasiList('diproses');
  selectLogCard(log.id);

  // Buka Modal Sukses Disposisi Presisi Modern (Menggantikan Alert Bawaan Browser)
  bukaModalSuksesDisposisi({
    nomorTiket: log.nomorTiket,
    unit: unitVal,
    komandan: personelVal,
    jarak: jarakVal,
    eta: etaVal,
    posisi: posisiVal
  });

  // Tampilkan toast notifikasi halus
  if (typeof tampilkanToast === 'function') {
    tampilkanToast(`✓ Tiket ${log.nomorTiket} berhasil didisposisikan ke ${unitVal}`, 'success');
  }
}

function bukaModalSuksesDisposisi(data) {
  const modal = document.getElementById('modal-sukses-disposisi');
  if (!modal) return;

  const tiketEl = document.getElementById('sukses-disp-nomor-tiket');
  const unitEl = document.getElementById('sukses-disp-unit');
  const komandanEl = document.getElementById('sukses-disp-komandan');
  const jarakEl = document.getElementById('sukses-disp-jarak');
  const etaEl = document.getElementById('sukses-disp-eta');
  const posisiEl = document.getElementById('sukses-disp-posisi');

  if (tiketEl) tiketEl.innerText = data.nomorTiket || 'TIKET-110';
  if (unitEl) unitEl.innerText = data.unit || 'Patroli Samapta Presisi';
  if (komandanEl) komandanEl.innerText = data.komandan || (typeof getActiveSessionUser === 'function' && getActiveSessionUser() ? getActiveSessionUser().nama : 'Petugas Lapangan');
  if (jarakEl) jarakEl.innerText = data.jarak || '1.2 km';
  if (etaEl) etaEl.innerText = '(ETA: ' + (data.eta || '± 3 Menit') + ')';
  if (posisiEl) posisiEl.innerText = data.posisi || 'Pos Pantau / Mobile';

  modal.style.display = 'flex';
}

function tutupModalSuksesDisposisi() {
  const modal = document.getElementById('modal-sukses-disposisi');
  if (modal) modal.style.display = 'none';
}

// ============================================================
// AUDIO SINTESIS SIAP-SIAGA PRESISI (WEB AUDIO API NATIVE)
// Tidak bergantung pada file mp3 eksternal, bebas error 404
// ============================================================
let audioCtxPresisi = null;

function putarSirineDisposisiSatuan() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    if (!audioCtxPresisi || audioCtxPresisi.state === 'suspended') {
      audioCtxPresisi = new AudioContextClass();
    }
    const ctx = audioCtxPresisi;
    const now = ctx.currentTime;

    // Beep 1 (Tone Tinggi 880 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now);
    osc1.frequency.exponentialRampToValueAtTime(1175, now + 0.18);
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.23);

    // Beep 2 (Tone Harmoni 1175 Hz -> 1318 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1046, now + 0.25);
    osc2.frequency.exponentialRampToValueAtTime(1318, now + 0.45);
    gain2.gain.setValueAtTime(0.35, now + 0.25);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.25);
    osc2.stop(now + 0.52);
  } catch (err) {
    console.warn('AudioContext belum dapat bersuara (perlu interaksi user):', err);
  }
}

// ============================================================
// BROADCAST DISPOSISI PERSATUAN REAL-TIME (MULTI-USER RESPONSE)
// ============================================================
let currentBroadcastLogId = null;

function normSatuanETribrata(satuanStr) {
  const s = String(satuanStr || '').toLowerCase();
  if (s.includes('lantas') || s.includes('lalu') || s.includes('pjr') || s.includes('turjawali')) return 'lantas';
  if (s.includes('samapta') || s.includes('sabhara') || s.includes('raimas') || s.includes('patroli')) return 'samapta';
  if (s.includes('reskrim') || s.includes('reserse') || s.includes('penyidik') || s.includes('opsnal') || s.includes('resmob')) return 'reskrim';
  if (s.includes('polsek') || s.includes('bhabin')) return 'polsek';
  return 'samapta';
}

function cekNotifikasiBroadcastSatuan() {
  const user = (typeof getActiveSessionUser === 'function') ? getActiveSessionUser() : null;
  if (!user || user.role === 'pimpinan' || user.role === 'operator') {
    return; // Hanya personel satuan lapangan
  }

  const userCategory = user.unitId || normSatuanETribrata(user.satuan || user.jabatan);

  const matchingLog = appLogs.find(l => {
    if (l.status !== 'diproses') return false;
    const targetSatuan = l.assignedUnitId || normSatuanETribrata(l.disposisi?.satuan || l.disposisi?.unit || l.assignedSatuan);
    if (targetSatuan !== userCategory) return false;

    const isAlreadyAccepted = Array.isArray(l.acceptedNrps) && l.acceptedNrps.includes(user.nrp);
    const isDismissed = sessionStorage.getItem('bcast_dismissed_' + l.id);

    return !isAlreadyAccepted && !isDismissed;
  });

  if (matchingLog) {
    bukaModalBroadcastSatuan(matchingLog);
  }
}

function bukaModalBroadcastSatuan(log) {
  const modal = document.getElementById('modal-broadcast-satuan');
  if (!modal) return;

  currentBroadcastLogId = log.id;

  const noTiketEl = document.getElementById('bcast-no-tiket');
  const satuanNameEl = document.getElementById('bcast-satuan-name');
  const sumberEl = document.getElementById('bcast-sumber');
  const judulEl = document.getElementById('bcast-judul');
  const lokasiEl = document.getElementById('bcast-lokasi');
  const arahanEl = document.getElementById('bcast-arahan');
  const petugasListEl = document.getElementById('bcast-petugas-list');
  const btnTerima = document.getElementById('btn-terima-tugas-bcast');

  if (noTiketEl) noTiketEl.innerText = log.nomorTiket || ('TIKET-110-' + log.id);
  if (satuanNameEl) satuanNameEl.innerText = log.disposisi?.satuan || log.disposisi?.unit || 'Satuan Tugas Presisi';
  if (sumberEl) sumberEl.innerText = log.platform === 'sos' ? '🚨 SINYAL SOS WARGA' : 'Call Center 110';
  if (judulEl) judulEl.innerText = log.title || log.jenisInsiden || 'Laporan Pengaduan Masyarakat';
  if (lokasiEl) lokasiEl.innerHTML = `<span>📍 TKP:</span> <strong>${log.lokasiKejadian || log.sektor || 'Wilayah Penugasan'}</strong>`;
  if (arahanEl) arahanEl.innerText = `"${log.disposisi?.arahan || 'Segera meluncur ke TKP dan lakukan tindakan taktis.'}"`;

  if (petugasListEl) {
    if (Array.isArray(log.acceptedPersonels) && log.acceptedPersonels.length > 0) {
      const names = log.acceptedPersonels.map(p => `👮 ${p.nama} (${p.pangkat || 'Personel'})`).join('<br>');
      petugasListEl.innerHTML = `<span style="color:#15803D; font-weight:800;">${log.acceptedPersonels.length} Anggota Telah Siap:</span><br>${names}`;
    } else {
      petugasListEl.innerHTML = `<span style="color:#B45309; font-weight:700;">Belum ada anggota yang klik terima (Jadilah personel pertama yang merespon)</span>`;
    }
  }

  if (btnTerima) {
    btnTerima.innerHTML = '<span>🛡️</span> TERIMA PENGADUAN INI ➔';
    btnTerima.disabled = false;
  }

  modal.style.display = 'flex';
  putarSirineDisposisiSatuan();
}

function tutupModalBroadcastSatuan() {
  const modal = document.getElementById('modal-broadcast-satuan');
  if (modal) modal.style.display = 'none';
  if (currentBroadcastLogId) {
    sessionStorage.setItem('bcast_dismissed_' + currentBroadcastLogId, 'true');
  }
  currentBroadcastLogId = null;
}

function terimaTugasSatuanDariModal() {
  if (!currentBroadcastLogId) return;
  const log = appLogs.find(l => l.id === currentBroadcastLogId);
  if (!log) return;

  const user = (typeof getActiveSessionUser === 'function') ? getActiveSessionUser() : null;
  const userNrp = user ? user.nrp : '95020123';
  const userNama = user ? user.nama : 'Petugas Lapangan';
  const userPangkat = user ? user.pangkat : 'BRIGADIR POLISI';

  if (!Array.isArray(log.acceptedNrps)) log.acceptedNrps = [];
  if (!Array.isArray(log.acceptedPersonels)) log.acceptedPersonels = [];

  if (!log.acceptedNrps.includes(userNrp)) {
    log.acceptedNrps.push(userNrp);
    log.acceptedPersonels.push({
      nrp: userNrp,
      nama: userNama,
      pangkat: userPangkat,
      waktuTerima: formatWaktuHhMmWib()
    });

    if (!log.riwayatValidasi) log.riwayatValidasi = [];
    log.riwayatValidasi.push({
      waktu: formatWaktuHhMmWib(),
      aktor: `${userNama} (${userPangkat})`,
      aksi: 'Personel Satuan Menerima Tugas',
      catatan: `Personel bergabung dalam penanganan terpadu untuk Satuan: ${log.disposisi?.satuan || 'Satuan Tugas'}`
    });

    log._updatedAt = Date.now();
    saveLogsToStorage();
    updateRekapCounts();
  }

  const modal = document.getElementById('modal-broadcast-satuan');
  if (modal) modal.style.display = 'none';

  if (typeof openValidasiList === 'function') {
    openValidasiList('diproses', true);
  }
  if (typeof selectLogCard === 'function') {
    selectLogCard(log.id);
  }

  if (typeof tampilkanModalAlertPresisi === 'function') {
    tampilkanModalAlertPresisi(
      `✓ Tugas Pengaduan Diterima!\n\n` +
      `Anda (${userNama}) telah resmi bergabung menangani tiket ${log.nomorTiket || log.id}.\n` +
      `Seluruh rekan di satuan Anda dapat melihat status keterlibatan ini secara real-time.`
    );
  } else {
    alert(`Tugas ${log.nomorTiket} berhasil diterima.`);
  }

  currentBroadcastLogId = null;
}

// ============================================================
// SISTEM NOTIFIKASI MODAL ALERT & PROMPT MODERN PRESISI
// (PENGGANTI WINDOW.ALERT & WINDOW.PROMPT BAWAAN BROWSER)
// ============================================================
let currentAlertCallback = null;

function tampilkanModalAlertPresisi(pesan, callback = null) {
  currentAlertCallback = callback;
  const modal = document.getElementById('modal-alert-presisi');
  if (!modal) {
    if (window._nativeAlert) window._nativeAlert(pesan);
    if (callback) callback();
    return;
  }

  const headerEl = document.getElementById('alert-presisi-header');
  const iconEl = document.getElementById('alert-presisi-icon');
  const titleEl = document.getElementById('alert-presisi-title');
  const headlineEl = document.getElementById('alert-presisi-headline');
  const bulletsEl = document.getElementById('alert-presisi-bullets');
  const noteEl = document.getElementById('alert-presisi-note');
  const btnOk = document.getElementById('alert-presisi-btn-ok');

  const teks = String(pesan ?? '');
  const rawLines = teks.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  // Deteksi Tipe & Sentimen Notifikasi
  let tipe = 'info';
  let defaultTitle = 'Pemberitahuan Sistem Presisi';
  let icon = 'ℹ️';

  const lower = teks.toLowerCase();
  if (teks.includes('✓') || teks.includes('✅') || teks.includes('🏆') || lower.includes('berhasil') || lower.includes('disetujui') || lower.includes('selesai') || lower.includes('sah ')) {
    tipe = 'success';
    defaultTitle = 'Tindakan Berhasil Disimpan';
    icon = '✓';
  } else if (teks.includes('✕') || teks.includes('❌') || lower.includes('ditolak') || lower.includes('gagal') || lower.includes('batal')) {
    tipe = 'danger';
    defaultTitle = 'Laporan Ditolak / Dibatalkan';
    icon = '✕';
  } else if (teks.includes('⚠️') || lower.includes('peringatan') || lower.includes('mohon') || lower.includes('terkunci') || lower.includes('wajib')) {
    tipe = 'warning';
    defaultTitle = 'Peringatan Validasi Sistem';
    icon = '⚠️';
  } else if (teks.includes('📻')) {
    tipe = 'radio';
    defaultTitle = 'Saluran Radio HT Metro Aktif';
    icon = '📻';
  } else if (teks.includes('📸')) {
    tipe = 'camera';
    defaultTitle = 'Dokumentasi Digital Terverifikasi';
    icon = '📸';
  } else if (teks.includes('🚨') || lower.includes('arahan taktis') || lower.includes('instruksi taktis') || lower.includes('puskodal 110')) {
    tipe = 'emergency';
    defaultTitle = 'Pusat Komando & Pengendalian Operasi (Puskodal 110)';
    icon = '🚨';
  }

  // Penataan Tema Warna Header
  if (headerEl) {
    if (tipe === 'success') {
      headerEl.style.background = 'linear-gradient(135deg, #064E3B 0%, #065F46 100%)';
    } else if (tipe === 'danger') {
      headerEl.style.background = 'linear-gradient(135deg, #881337 0%, #9F1239 100%)';
    } else if (tipe === 'warning') {
      headerEl.style.background = 'linear-gradient(135deg, #78350F 0%, #92400E 100%)';
    } else if (tipe === 'radio') {
      headerEl.style.background = 'linear-gradient(135deg, #0F766E 0%, #115E59 100%)';
    } else if (tipe === 'camera') {
      headerEl.style.background = 'linear-gradient(135deg, #1E3A8A 0%, #1E40AF 100%)';
    } else if (tipe === 'emergency') {
      headerEl.style.background = 'linear-gradient(135deg, #7F1D1D 0%, #991B1B 100%)';
    } else {
      headerEl.style.background = 'linear-gradient(135deg, #153E75 0%, #0F2A52 100%)';
    }
  }

  if (iconEl) iconEl.innerText = icon;
  if (titleEl) titleEl.innerText = defaultTitle;

  // Filter baris
  const firstLine = rawLines.length > 0 ? rawLines[0] : teks;
  const bulletLines = rawLines.filter(l => l.startsWith('•') || l.startsWith('-') || l.startsWith('*'));
  const noteLines = rawLines.filter((l, idx) => idx > 0 && !l.startsWith('•') && !l.startsWith('-') && !l.startsWith('*'));

  if (headlineEl) {
    headlineEl.innerText = firstLine.replace(/^[✓✅✕❌⚠️ℹ️🏆📸📻⚡\s]+/, '');
  }

  if (bulletsEl) {
    if (bulletLines.length > 0) {
      bulletsEl.style.display = 'flex';
      bulletsEl.innerHTML = bulletLines.map(b => {
        const raw = b.replace(/^[•\-*]\s*/, '');
        const parts = raw.split(':');
        if (parts.length > 1) {
          return `<div style="display:flex; justify-content:space-between; align-items:baseline; font-size:12px; gap:8px;">
                <span style="color:#64748B; font-weight:600;">${parts[0]}:</span>
                <span style="color:#0F172A; font-weight:700; text-align:right;">${parts.slice(1).join(':').trim()}</span>
              </div>`;
        }
        return `<div style="font-size:12px; color:#334155; font-weight:600;">• ${raw}</div>`;
      }).join('');
    } else {
      bulletsEl.style.display = 'none';
      bulletsEl.innerHTML = '';
    }
  }

  if (noteEl) {
    noteEl.innerText = noteLines.join('\n');
    noteEl.style.display = noteLines.length > 0 ? 'block' : 'none';
  }

  modal.style.display = 'flex';
  if (btnOk) {
    btnOk.focus();
  }
}

function tutupModalAlertPresisi() {
  const modal = document.getElementById('modal-alert-presisi');
  if (modal) modal.style.display = 'none';
  if (currentAlertCallback) {
    const cb = currentAlertCallback;
    currentAlertCallback = null;
    try { cb(); } catch (e) { console.error(e); }
  }
}

// OVERRIDE GLOBAL WINDOW.ALERT:
// Menjamin bahwa SELURUH notifikasi alert di aplikasi otomatis tampil dalam modal modern!
if (!window._nativeAlert) {
  window._nativeAlert = window.alert;
}
window.alert = function (pesan) {
  tampilkanModalAlertPresisi(pesan);
};

// PROMPT PRESISI HANDLER
let currentPromptResolve = null;

function tampilkanPromptPresisi({ judul, keterangan, nilaiAwal, onConfirm }) {
  currentPromptResolve = onConfirm;
  const modal = document.getElementById('modal-prompt-presisi');
  if (!modal) {
    const res = prompt(keterangan, nilaiAwal);
    if (onConfirm) onConfirm(res);
    return;
  }

  const titleEl = document.getElementById('prompt-presisi-title');
  const labelEl = document.getElementById('prompt-presisi-label');
  const inputEl = document.getElementById('prompt-presisi-input');

  if (titleEl) titleEl.innerText = judul || 'Instruksi Pawas';
  if (labelEl) labelEl.innerText = keterangan || 'Masukkan instruksi / catatan:';
  if (inputEl) {
    inputEl.value = nilaiAwal || '';
    setTimeout(() => {
      inputEl.focus();
      inputEl.select();
    }, 80);
  }

  modal.style.display = 'flex';
}

function batalModalPromptPresisi() {
  const modal = document.getElementById('modal-prompt-presisi');
  if (modal) modal.style.display = 'none';
  if (currentPromptResolve) {
    const fn = currentPromptResolve;
    currentPromptResolve = null;
    fn(null);
  }
}

function konfirmasiModalPromptPresisi() {
  const modal = document.getElementById('modal-prompt-presisi');
  const inputEl = document.getElementById('prompt-presisi-input');
  const val = inputEl ? inputEl.value : '';
  if (modal) modal.style.display = 'none';
  if (currentPromptResolve) {
    const fn = currentPromptResolve;
    currentPromptResolve = null;
    fn(val);
  }
}

function pawasKirimBackup(id) {
  const log = appLogs.find(l => l.id === id);
  if (!log) return;

  tampilkanPromptPresisi({
    judul: '🚔 PENGERAHAN UNIT CADANGAN / BACK-UP',
    keterangan: 'Pilih atau sesuaikan unit bantuan yang ingin dikerahkan ke lokasi TKP:',
    nilaiAwal: 'Unit Cadangan Reaksi Cepat Samapta (Regu Charlie) & Turjawali Lantas',
    onConfirm: (unitBackup) => {
      if (!unitBackup || !unitBackup.trim()) return;

      const waktuSekarang = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
      if (!log.disposisi) log.disposisi = {};
      log.disposisi.unitBackup = unitBackup.trim();

      if (!log.riwayatValidasi) log.riwayatValidasi = [];
      log.riwayatValidasi.push({
        waktu: waktuSekarang,
        aktor: (typeof getActiveSessionUser === 'function' && getActiveSessionUser() && getActiveSessionUser().nama ? getActiveSessionUser().nama + ' (Pawas)' : ''),
        aksi: 'Pengerahan Unit Back-Up',
        catatan: 'Dikerahkan bantuan perkuatan: ' + unitBackup.trim()
      });

      saveLogsToStorage();
      tampilkanModalAlertPresisi('✓ UNIT BACK-UP TELAH DIKERAHKAN!\n\nUnit "' + unitBackup.trim() + '" bergerak menuju lokasi TKP untuk memperkuat regu utama.');
      displayLogDetail(id);
    }
  });
}

function simulasiPersonelKirimBeritaAcara(id) {
  const log = appLogs.find(l => l.id === id);
  if (!log) return;

  const waktuSekarang = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
  log.tahap = 5;
  log.waktuTiba = log.waktuTiba || '10:52 WIB';
  log.waktuSelesai = waktuSekarang;
  log.deskripsiTindakan = 'Petugas tiba di TKP, mengamankan situasi, mensterilkan perimeter, dan membubarkan kerumunan massa secara humanis dan terukur.';
  log.fotoTindakan = 'assets/images/polri_pengaduan_tkp.jpg';
  log.catatanSelesai = 'Situasi TKP telah kondusif, barang bukti diamankan, berita acara lapangan lengkap. Siap disahkan oleh Pawas.';

  if (!log.riwayatValidasi) log.riwayatValidasi = [];
  const activeUser = typeof getActiveSessionUser === 'function' ? getActiveSessionUser() : null;
  const namaAktorLapangan = log.assignedNama || log.disposisi?.komandan || (log.tipePelapor === 'personel' ? log.nama : (activeUser ? activeUser.nama : 'Petugas Lapangan'));
  log.riwayatValidasi.push({
    waktu: waktuSekarang,
    aktor: namaAktorLapangan + ' (Lapangan)',
    aksi: 'Penyerahan Berita Acara TKP',
    catatan: 'Tindakan lapangan rampung. Menunggu pengesahan resmi Pawas.'
  });

  saveLogsToStorage();
  alert('✓ [SIMULASI PERSONEL LAPANGAN BERHASIL]\n\nPetugas lapangan (' + namaAktorLapangan + ') telah menyerahkan dokumentasi foto TKP dan Berita Acara Tindakan!\n\nStatus laporan kini berada di Tahap 5 dan siap disahkan oleh Pawas.');
  displayLogDetail(id);
}

function pawasSahkanDanTutupKasus(id) {
  const log = appLogs.find(l => l.id === id);
  if (!log) return;

  const confirmSah = confirm('⚖️ OTORISASI PENUTUPAN KASUS (PAWAS)\n\nApakah Anda yakin ingin mengesahkan Berita Acara Penanganan kasus #' + (log.nomorTiket || log.id) + ' dan menutup kasus ini secara resmi?');
  if (!confirmSah) return;

  const waktuSekarang = formatWaktuHhMmWib();
  log.status = 'selesai';
  log.statusText = 'Kasus Selesai (Disahkan Pawas)';
  log.tahap = 5;
  log.waktuSelesai = waktuSekarang;
  const pawasUser = typeof getActiveSessionUser === 'function' ? getActiveSessionUser() : null;
  const namaPawas = (pawasUser && (pawasUser.role === 'pimpinan' || pawasUser.role === 'pawas')) ? pawasUser.nama : (pawasUser ? pawasUser.nama : '');
  log.pengesahanPawas = {
    aktor: namaPawas + ' (Pawas / Kapolres)',
    waktu: waktuSekarang,
    catatan: 'Berita acara lengkap, penanganan tuntas sesuai SOP Polri Presisi 110.'
  };

  if (!log.riwayatValidasi) log.riwayatValidasi = [];
  log.riwayatValidasi.push({
    waktu: waktuSekarang,
    aktor: namaPawas + ' (Pawas)',
    aksi: 'Otorisasi Penutupan Kasus',
    catatan: 'Berita acara penanganan disahkan secara sah, tiket resmi ditutup.'
  });

  log._updatedAt = Date.now();
  saveLogsToStorage();
  updateRekapCounts();
  if (typeof renderPimpinanExecutiveDashboard === 'function') {
    renderPimpinanExecutiveDashboard();
  }

  alert('🏆 KASUS RESMI DISAHKAN & DITUTUP OLEH PAWAS!\n\n• Nomor Tiket: ' + (log.nomorTiket || log.id) + '\n• Otoritas Pengesah: ' + namaPawas + ' (Pawas)\n• Berita Acara: Lengkap & Sah secara Hukum\n• Status Akhir: SELESAI (Masuk ke Arsip Log Selesai)\n\nTerima kasih atas kepemimpinan & pengawasan Presisi!');

  openValidasiList('selesai');
  selectLogCard(log.id);
}

function setujuiLog(id) {
  bukaModalDisposisiPawas(id);
}

function prosesKasusLog(id) {
  bukaModalDisposisiPawas(id);
}

function bukaHalamanTolak(id) {
  const log = appLogs.find(l => l.id === id);
  if (!log) return;

  document.getElementById('tolak-log-id').value = log.id;
  const titleEl = document.getElementById('tolak-preview-title');
  if (titleEl) titleEl.innerText = log.title;
  const descEl = document.getElementById('tolak-preview-desc');
  if (descEl) descEl.innerText = log.deskripsi;
  const petugasEl = document.getElementById('tolak-preview-petugas');
  if (petugasEl) petugasEl.innerText = log.nama + ' (NRP: ' + log.nrp + ')';
  const waktuEl = document.getElementById('tolak-preview-waktu');
  if (waktuEl) waktuEl.innerText = 'Terkirim: Hari ini, ' + log.waktu;
  const avatarEl = document.getElementById('tolak-preview-avatar');
  if (avatarEl) avatarEl.src = log.avatar;

  // Reset form
  const alasanEl = document.getElementById('tolak-alasan-text');
  if (alasanEl) alasanEl.value = '';
  const katEl = document.getElementById('tolak-kategori');
  if (katEl) katEl.selectedIndex = 0;

  switchTab('view-tolak');
}

function submitPenolakan() {
  const logId = parseInt(document.getElementById('tolak-log-id').value);
  const log = appLogs.find(l => l.id === logId);
  if (!log) {
    alert('Data laporan tidak ditemukan!');
    return;
  }

  const kategori = document.getElementById('tolak-kategori').value;
  const alasan = document.getElementById('tolak-alasan-text').value.trim();

  if (!alasan) {
    alert('Mohon isi catatan atau alasan penolakan untuk personel!');
    document.getElementById('tolak-alasan-text').focus();
    return;
  }

  log.status = 'ditolak';
  log.statusText = 'Ditolak / Revisi';
  log.alasanTolak = kategori + ' - ' + alasan;
  saveLogsToStorage();
  updateRekapCounts();

  const remainingMenunggu = appLogs.filter(l => l.status === 'menunggu').length;
  alert('✕ Laporan #' + log.id + ' telah ditolak dengan catatan:\n"' + log.alasanTolak + '"\n\nJumlah "Menunggu Tindakan" berkurang menjadi ' + remainingMenunggu + ' data.\nLaporan telah masuk ke LOG DITOLAK.');

  // Buka tampilan Log Ditolak agar user dapat langsung melihat log yang baru ditolak
  openValidasiList('ditolak');
}

function bukaMobileDrawer() {
  const detailBox = document.getElementById('val-detail-box');
  const backdrop = document.getElementById('mobile-drawer-backdrop');
  if (detailBox) detailBox.classList.add('mobile-drawer-open');
  if (backdrop) backdrop.classList.add('active');
}

function tutupMobileDrawer() {
  const detailBox = document.getElementById('val-detail-box');
  const backdrop = document.getElementById('mobile-drawer-backdrop');
  if (detailBox) detailBox.classList.remove('mobile-drawer-open');
  if (backdrop) backdrop.classList.remove('active');
}

function selectLogCard(id) {
  selectedLogId = id;

  // Highlight kartu yang dipilih
  document.querySelectorAll('.val-card').forEach(card => card.classList.remove('selected'));
  const selectedCard = document.getElementById('card-log-' + id);
  if (selectedCard) {
    selectedCard.classList.add('selected');
  }

  displayLogDetail(id);

  // Jika berada di device mobile (< 768px), otomatis buka bottom drawer
  if (window.innerWidth < 768) {
    bukaMobileDrawer();
  }
}

const TIMELINE_STEPS_DATA = [
  {
    step: 1,
    title: 'Laporan Diterima (SPKT)',
    desc: 'Laporan Anda telah divalidasi oleh operator 110 dan diteruskan ke komando wilayah.',
    time: '10:45 WIB'
  },
  {
    step: 2,
    title: 'Disposisi Personel',
    desc: 'Tugas penanganan telah diserahkan kepada unit terdekat dari lokasi kejadian.',
    time: '10:48 WIB'
  },
  {
    step: 3,
    title: 'Personel Menuju Lokasi',
    desc: 'Tim sedang meluncur ke lokasi kejadian. Harap tetap tenang dan amankan lokasi.',
    time: 'Update: 10:50 WIB',
    hasMap: true
  },
  {
    step: 4,
    title: 'Penanganan di Lokasi',
    desc: 'Personel tiba di lokasi dan sedang melakukan tindakan kepolisian.',
    time: '11:15 WIB'
  },
  {
    step: 5,
    title: 'Kasus Selesai Ditangani',
    desc: 'Penanganan selesai dan log telah disetujui oleh pimpinan.',
    time: '11:45 WIB'
  }
];

function peringatanStepDisabled(step, current, type) {
  if (type === 'completed') {
    alert('ℹ️ Langkah ini sudah selesai dilewati dan tidak dapat diubah kembali.');
  } else if (type === 'active') {
    alert('⚡ Penanganan pada langkah ini sedang aktif berlangsung oleh petugas.');
  } else if (type === 'locked') {
    alert('🔒 Langkah ini masih terkunci!\n\nPenanganan kasus wajib diselesaikan secara bertahap dan berurutan.\nSilakan gunakan tombol "Perbarui Progres Penanganan TKP" di bawah atau buka Wizard Penanganan.');
  }
}

function renderTimelineSteps(log) {
  const container = document.getElementById('tl-steps-container');
  if (!container) return;

  const currentTahap = parseInt(log.tahap) || (log.status === 'selesai' ? 5 : 3);
  let html = '';

  const imgPengaduan = log.fotoPengaduan || log.fotoLampiran || 'assets/images/polri_pengaduan_tkp.jpg';
  const imgTindakan = log.fotoTindakan || 'assets/images/polri_pengaduan_tkp.jpg';

  TIMELINE_STEPS_DATA.forEach(s => {
    let stateClass = 'inactive';
    let titleExtra = '';
    let titleTooltip = '';
    let clickHandler = '';

    const isCaseFinished = (log.status === 'selesai' || Boolean(log.pengesahanPawas));

    if (isCaseFinished || s.step < currentTahap || (s.step === 5 && (log.waktuSelesai || log.catatanSelesai))) {
      stateClass = 'completed';
      titleExtra = '<span style="font-size:10px; color:var(--success); font-weight:700; background:#ECFDF5; padding:2px 6px; border-radius:4px;">✓ SELESAI</span>';
      titleTooltip = `${s.title} sudah selesai`;
      clickHandler = `onclick="peringatanStepDisabled(${s.step}, ${currentTahap}, 'completed')"`;
    } else if (s.step === currentTahap) {
      stateClass = 'active';
      titleExtra = '<span style="font-size:10px; background:#DBEAFE; color:var(--primary); padding:2px 6px; border-radius:4px; font-weight:700;">● SEDANG BERLANGSUNG</span>';
      titleTooltip = `${s.title} sedang berlangsung`;
      clickHandler = `onclick="peringatanStepDisabled(${s.step}, ${currentTahap}, 'active')"`;
    } else {
      // s.step > currentTahap: Step diatas dari current (tidak boleh diklik)
      stateClass = 'locked';
      titleExtra = '<span style="font-size:10px; background:#F1F5F9; color:#64748B; padding:2px 6px; border-radius:4px; font-weight:700;">🔒 TERKUNCI</span>';
      titleTooltip = `${s.title} masih terkunci`;
      clickHandler = `onclick="peringatanStepDisabled(${s.step}, ${currentTahap}, 'locked')"`;
    }

    let mapHtml = '';
    // Tracking map mobil & bukti persiapan HANYA tampil jika personel SUDAH klik Meluncur ke Lokasi (log.waktuMeluncur terisi)
    if (s.step === 3 && log.waktuMeluncur && !isCaseFinished) {
      const fotoPersiapanSrc = log.fotoPersiapan || 'assets/images/polri_patrol_car.jpg';
      const avatarPetugasSrc = log.avatar || 'assets/images/avatar_polisi.jpg';
      mapHtml = `
          <div class="tracking-map" onclick="event.stopPropagation(); previewFotoModal('persiapan')" title="Klik untuk memperbesar Bukti Persiapan & GPS" style="cursor:pointer;">
            <img src="${fotoPersiapanSrc}" alt="Bukti Persiapan & GPS" class="map-placeholder" onerror="this.onerror=null; this.src='assets/images/polri_patrol_car.jpg';">
            <div class="map-overlay">
              <img src="${avatarPetugasSrc}" alt="Police" class="police-avatar" onerror="this.onerror=null; this.src='assets/images/avatar_polisi.jpg';">
              <div class="police-info">
                <h4>${log.personelDitugaskan || log.petugasPenangan || (typeof getActiveSessionUser === 'function' && getActiveSessionUser() ? getActiveSessionUser().nama : '')}</h4>
                <p>Estimasi Tiba: 5 Menit • 🔍 Klik perbesar foto</p>
              </div>
            </div>
          </div>
        `;
    }

    // Baris tanggal & waktu (flex column: atas tanggal, bawah waktu) serta indikator berkas
    let metaRowHtml = '';
    const tanggalKasus = log.tanggal || formatTanggalIndo();

    if (s.step === 1) {
      const waktuLaporanMasuk = log.waktu || '';
      metaRowHtml = `
          <div style="display:flex; align-items:flex-end; justify-content:space-between; margin-top:8px;">
            ${renderDateColumn('Laporan Masuk', waktuLaporanMasuk, tanggalKasus)}
            <span style="font-size:10px; font-weight:700; color:var(--primary); background:#EFF6FF; border:1px solid #BFDBFE; padding:3px 8px; border-radius:4px; cursor:pointer; display:inline-flex; align-items:center; gap:4px;" onclick="event.stopPropagation(); previewFotoModal('pengaduan')" title="Klik untuk lihat bukti foto 110">
              📷 Bukti Laporan 110 ➔
            </span>
          </div>
        `;
    } else if (s.step === 2) {
      const waktuDisposisiRiil = (log.disposisi && log.disposisi.waktuDisposisi) ? log.disposisi.waktuDisposisi : (log.waktu || '');
      metaRowHtml = `
          <div style="display:flex; align-items:flex-end; justify-content:space-between; margin-top:8px;">
            ${renderDateColumn('Disposisi Pawas', waktuDisposisiRiil, tanggalKasus)}
          </div>
        `;
    } else if (s.step === 3) {
      const sudahMeluncur = Boolean(log.waktuMeluncur);
      metaRowHtml = `
          <div style="display:flex; align-items:flex-end; justify-content:space-between; margin-top:8px;">
            ${sudahMeluncur ? renderDateColumn('Meluncur', log.waktuMeluncur, tanggalKasus) : `
              <div style="display:flex; flex-direction:column; gap:2px; line-height:1.2;">
                <span style="font-size:10px; color:#94A3B8; font-weight:600;">📅 ${tanggalKasus}</span>
                <span class="step-time" style="color:#94A3B8; font-style:italic;">Menunggu Konfirmasi Keberangkatan</span>
              </div>
            `}
            ${sudahMeluncur ? `
            <span style="font-size:10px; font-weight:700; color:#1E40AF; background:#EFF6FF; border:1px solid #BFDBFE; padding:3px 8px; border-radius:4px; cursor:pointer; display:inline-flex; align-items:center; gap:4px;" onclick="event.stopPropagation(); previewFotoModal('persiapan')" title="Klik untuk lihat bukti foto persiapan & GPS">
              📷 Bukti Persiapan & GPS ➔
            </span>` : ''}
          </div>
        `;
    } else if (s.step === 4) {
      const sudahTiba = Boolean(log.waktuTiba);
      metaRowHtml = `
          <div style="display:flex; align-items:flex-end; justify-content:space-between; margin-top:8px;">
            ${sudahTiba ? renderDateColumn('Tiba di TKP', log.waktuTiba, tanggalKasus) : `
              <div style="display:flex; flex-direction:column; gap:2px; line-height:1.2;">
                <span style="font-size:10px; color:#94A3B8; font-weight:600;">📅 ${tanggalKasus}</span>
                <span class="step-time" style="color:#94A3B8; font-style:italic;">Menunggu Personel Tiba di TKP</span>
              </div>
            `}
            ${sudahTiba ? `
            <span style="font-size:10px; font-weight:700; color:var(--success); background:#ECFDF5; border:1px solid #A7F3D0; padding:3px 8px; border-radius:4px; cursor:pointer; display:inline-flex; align-items:center; gap:4px;" onclick="event.stopPropagation(); previewFotoModal('tindakan')" title="Klik untuk lihat bukti foto tindakan">
              📸 Bukti Tindakan TKP ➔
            </span>` : ''}
          </div>
        `;
    } else if (s.step === 5) {
      const sudahSelesai = Boolean(log.waktuSelesai || log.catatanSelesai || log.status === 'selesai');
      const waktuSelesaiFinal = log.pengesahanPawas?.waktu || log.waktuSelesai || log.waktu || '';
      const labelSelesai = log.pengesahanPawas ? 'Disahkan' : 'Selesai';
      metaRowHtml = sudahSelesai ? `
          <div style="display:flex; align-items:flex-end; justify-content:space-between; margin-top:8px;">
            ${renderDateColumn(labelSelesai, waktuSelesaiFinal, tanggalKasus)}
            <span style="font-size:10px; font-weight:700; color:#16A34A; background:#ECFDF5; border:1px solid #A7F3D0; padding:3px 8px; border-radius:4px; cursor:pointer; display:inline-flex; align-items:center; gap:4px;" onclick="event.stopPropagation(); previewFotoModal('selesai')" title="Klik untuk lihat bukti foto penyelesaian akhir">
              ✅ Bukti Situasi Akhir ➔
            </span>
          </div>
        ` : `
          <div style="margin-top:8px;">
            <span class="step-time" style="color:#94A3B8; font-style:italic;">Menunggu Otorisasi Penutupan Kasus</span>
          </div>
        `;
    } else {
      metaRowHtml = `
          <div style="margin-top:8px;">
            ${renderDateColumn('Waktu', s.time, tanggalKasus)}
          </div>
        `;
    }

    // Cuplikan data reaktif dari Wizard (HANYA tampil setelah disubmit per step)
    let detailSnippetHtml = '';
    if (s.step === 3 && log.waktuMeluncur && (log.koordinatGps || log.catatanPersiapan)) {
      detailSnippetHtml = `
          <div style="background:#F0FDF4; border:1px solid #BBF7D0; border-radius:6px; padding:6px 10px; margin-top:8px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2px;">
              <span style="font-size:10px; font-weight:700; color:#166534;">📍 GPS KEBERANGKATAN:</span>
              <span style="font-size:9.5px; background:#DCFCE7; color:#15803D; font-weight:700; padding:1px 5px; border-radius:3px;">TERKUNCI</span>
            </div>
            <div style="font-size:11px; font-weight:600; color:#1E293B; font-family:monospace;">${log.koordinatGps}</div>
            ${log.catatanPersiapan ? `<div style="font-size:10.5px; color:#475569; font-style:italic; margin-top:3px;">"${log.catatanPersiapan}"</div>` : ''}
          </div>
        `;
    } else if (s.step === 4 && log.waktuTiba && log.deskripsiTindakan) {
      const teksTindakan = log.deskripsiTindakan;
      detailSnippetHtml = `
          <div style="background:#FEFCE8; border-left:3px solid #EAB308; border-radius:0 6px 6px 0; padding:6px 10px; margin-top:8px; line-height:1.4;">
            <div style="font-size:10px; font-weight:700; color:#854D0E; margin-bottom:2px;">📝 BERITA ACARA TINDAKAN TKP:</div>
            <div style="font-size:11px; color:#1E293B;">"${teksTindakan}"</div>
          </div>
        `;
    } else if (s.step === 5 && (log.waktuSelesai || log.catatanSelesai || log.status === 'selesai')) {
      const teksSelesai = log.catatanSelesai || 'Situasi telah aman dan kondusif. Penanganan lapangan tuntas sesuai SOP.';

      let pawasApprovalHtml = '';
      if (log.pengesahanPawas) {
        pawasApprovalHtml = `
            <div style="background:#F0FDF4; border:1px solid #86EFAC; border-left:4px solid #16A34A; border-radius:6px; padding:7px 10px; margin-top:8px; line-height:1.4;">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:10px; font-weight:800; color:#15803D;">⚖️ PENGESAHAN RESMI PIMPINAN (PAWAS):</span>
                <span style="font-size:9.5px; font-weight:700; background:#DCFCE7; color:#166534; padding:1px 6px; border-radius:3px;">SAH &amp; VALID</span>
              </div>
              <div style="font-size:10.5px; color:#166534; margin-top:2px;">
                <strong>Pengesah:</strong> ${log.pengesahanPawas.aktor || log.pengesahanPawas.nama || ''} • <strong>Waktu:</strong> ${log.pengesahanPawas.waktu}
              </div>
              <div style="font-size:11px; color:#1E293B; font-style:italic; margin-top:2px;">"${log.pengesahanPawas.catatan || 'Berita acara lengkap, penanganan tuntas sesuai SOP Polri Presisi.'}"</div>
            </div>
            `;
      } else if (log.status === 'menunggu_pengesahan') {
        pawasApprovalHtml = `
            <div style="background:#FAF5FF; border:1px solid #DDD6FE; border-left:4px solid #7C3AED; border-radius:6px; padding:7px 10px; margin-top:8px; line-height:1.4;">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:10px; font-weight:800; color:#6D28D9;">⚖️ STATUS BERKAS PERKARA:</span>
                <span style="font-size:9.5px; font-weight:700; background:#EDE9FE; color:#6D28D9; padding:1px 6px; border-radius:3px;">MENUNGGU PENGESAHAN PAWAS</span>
              </div>
              <div style="font-size:10.5px; color:#6D28D9; margin-top:2px;">
                Tindakan lapangan di TKP telah rampung dilaporkan. Menunggu verifikasi &amp; tanda tangan pengesahan resmi oleh Pawas.
              </div>
            </div>
            `;
      }

      detailSnippetHtml = `
          <div style="background:#ECFDF5; border-left:3px solid #10B981; border-radius:0 6px 6px 0; padding:6px 10px; margin-top:8px; line-height:1.4;">
            <div style="font-size:10px; font-weight:700; color:#047857; margin-bottom:2px;">✓ LAPORAN AKHIR PETUGAS:</div>
            <div style="font-size:11px; color:#1E293B;">"${teksSelesai}"</div>
          </div>
          ${pawasApprovalHtml}
        `;
    }

    html += `
        <div class="step ${stateClass}" ${clickHandler} title="${titleTooltip}">
          <div class="step-icon"></div>
          <div class="step-content">
            <div class="step-title">
              <span>${s.step}. ${s.title}</span>
              ${titleExtra}
            </div>
            <div class="step-desc">${s.desc}</div>
            ${metaRowHtml}
            ${mapHtml}
            ${detailSnippetHtml}
          </div>
        </div>
      `;
  });

  container.innerHTML = html;
}

function formatWaktuHhMmWib(d = new Date()) {
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m} WIB`;
}

function formatTanggalIndo(d = new Date()) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function renderDateColumn(label, waktuStr, tanggalStr) {
  const tgl = tanggalStr || formatTanggalIndo();
  return `
        <div style="display:flex; flex-direction:column; gap:2px; line-height:1.2;">
          <span style="font-size:10px; color:#64748B; font-weight:600; display:flex; align-items:center; gap:3px;">
            <span>📅</span> ${tgl}
          </span>
          <span class="step-time" style="font-size:11px; font-weight:700; color:#1E293B;">
            ${label ? label + ': ' : ''}${waktuStr}
          </span>
        </div>
      `;
}

function hitungSelisihMenitTeks(t1, t2) {
  if (!t1 || !t2) return 5;
  try {
    const clean1 = t1.replace(' WIB', '').trim().replace('.', ':');
    const clean2 = t2.replace(' WIB', '').trim().replace('.', ':');
    const parts1 = clean1.split(':').map(Number);
    const parts2 = clean2.split(':').map(Number);
    if (parts1.length >= 2 && parts2.length >= 2 && !isNaN(parts1[0]) && !isNaN(parts2[0])) {
      const totalM1 = parts1[0] * 60 + parts1[1];
      const totalM2 = parts2[0] * 60 + parts2[1];
      let diff = totalM2 - totalM1;
      if (diff < 0) diff += 1440; // Melewati tengah malam
      return diff;
    }
  } catch (e) {
    console.warn('Gagal parse waktu SLA:', e);
  }
  return 5;
}

function hitungDetikDariWaktuTeks(waktuTeks) {
  if (!waktuTeks) return 0;
  try {
    const clean = waktuTeks.replace(' WIB', '').trim().replace('.', ':');
    const parts = clean.split(':').map(Number);
    if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      const now = new Date();
      const target = new Date();
      target.setHours(parts[0], parts[1], 0, 0);
      let diffMs = now.getTime() - target.getTime();
      if (diffMs < 0) diffMs += 24 * 3600 * 1000;
      return Math.floor(diffMs / 1000);
    }
  } catch (e) { }
  return 0;
}

function updateTahapPenanganan(id, newTahap) {
  const log = appLogs.find(l => l.id === id);
  if (!log) return;

  const currentTahap = parseInt(log.tahap) || (log.status === 'selesai' ? 5 : 3);
  newTahap = parseInt(newTahap);

  // Validasi ketat: penanganan harus diselesaikan berurutan satu per satu (+1)
  if (newTahap !== currentTahap + 1 && !(currentTahap === 5 && newTahap === 5)) {
    if (newTahap <= currentTahap) {
      alert('⚠️ Tahap ' + newTahap + ' sudah selesai dilewati dan tidak dapat diubah kembali.');
    } else {
      alert('⚠️ Tahap penanganan harus diselesaikan satu per satu secara berurutan (+1). Tidak boleh melompati tahap atau dikerjakan secara acak!');
    }
    return;
  }

  log.tahap = newTahap;

  const waktuSekarang = formatWaktuHhMmWib();
  if (newTahap >= 4 && !log.waktuTiba) {
    log.waktuTiba = waktuSekarang;
    if (!log.slaDurasiMenit) {
      const startTime = log.waktuMeluncur || log.disposisi?.waktuDisposisi || log.waktu;
      log.slaDurasiMenit = startTime ? hitungSelisihMenitTeks(startTime, waktuSekarang) : 6;
    }
  }

  if (newTahap === 5) {
    log.bapTerkirim = true;
    if (!log.waktuSelesai) log.waktuSelesai = waktuSekarang;
    if (!log.pengesahanPawas) {
      log.status = 'menunggu_pengesahan';
      log.statusText = 'Menunggu Pengesahan Pawas';
    } else {
      log.status = 'selesai';
      log.statusText = 'Kasus Selesai';
    }
  } else if ((log.status === 'selesai' || log.status === 'menunggu_pengesahan') && newTahap < 5) {
    log.status = 'diproses';
    log.statusText = 'Sedang Diproses';
  }

  saveLogsToStorage();
  updateRekapCounts();

  // Re-render detail view
  displayLogDetail(id);

  // Refresh list jika filter saat ini berubah
  openValidasiList(currentValidasiFilter || 'diproses');
}

function selesaikanKasus(id) {
  const log = appLogs.find(l => l.id === id);
  if (!log) return;
  log.tahap = 5;
  log.bapTerkirim = true;
  if (!log.waktuSelesai) log.waktuSelesai = formatWaktuHhMmWib();
  if (!log.pengesahanPawas) {
    log.status = 'menunggu_pengesahan';
    log.statusText = 'Menunggu Pengesahan Pawas';
  } else {
    log.status = 'selesai';
    log.statusText = 'Kasus Selesai';
  }
  saveLogsToStorage();
  updateRekapCounts();
  displayLogDetail(id);
  openValidasiList('menunggu_pengesahan');
  alert('✓ Kasus Berhasil Ditutup di Lapangan!\n\n• Seluruh tindakan di TKP telah tuntas dilaporkan oleh petugas.\n• Berita Acara Pemeriksaan (BAP) diteruskan ke meja Pawas.\n• Status kasus beralih ke: [Menunggu Pengesahan].\n• Kasus siap disahkan & ditutup resmi oleh Perwira Pengawas (Pawas).');
}

// ==========================================
// WIZARD PENANGANAN KASUS (DYNAMIC INTEGRATION)
// ==========================================

function getLiveGPS() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function (position) {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const el = document.getElementById('koordinat-gps');
      if (el) el.value = lat + ", " + lng;
      console.log("GPS Terkunci: ", lat, lng);
    }, function (error) {
      console.log("Gagal mengambil GPS: ", error.message);
    });
  }
}

function openWizardForLog(id) {
  if (!id) id = selectedLogId;
  const log = appLogs.find(l => l.id === id);
  if (!log) return;
  activeWizardLogId = id;

  // Pastikan data tiket & insiden terisi
  if (!log.tahap) log.tahap = (log.status === 'selesai' ? 5 : 3);
  if (!log.nomorTiket) log.nomorTiket = 'TIKET-110-' + (log.id < 10 ? '0' + log.id : log.id) + 'X2F';
  if (!log.jenisInsiden) log.jenisInsiden = log.title;
  if (!log.lokasiKejadian) log.lokasiKejadian = (log.sektor ? log.sektor + ', Jakarta' : 'Jl. Jend. Sudirman, Jakarta');

  // Simpan ke storage (localStorage & sessionStorage)
  saveLogsToStorage();

  // 1. Subtitle ID Kasus
  const idKasusEl = document.getElementById('wiz-id-kasus');
  if (idKasusEl) idKasusEl.innerText = 'ID Kasus: #' + log.nomorTiket;

  // 2. Status Badge Header
  const badgeEl = document.getElementById('wiz-status-badge');
  if (badgeEl) {
    if (log.status === 'selesai') {
      badgeEl.innerText = '✓ Selesai Ditangani';
      badgeEl.style.background = '#DCFCE7';
      badgeEl.style.color = '#16A34A';
    } else if (log.status === 'menunggu_pengesahan') {
      badgeEl.innerText = '⚖️ Menunggu Pengesahan Pawas';
      badgeEl.style.background = '#F3E8FF';
      badgeEl.style.color = '#7C3AED';
    } else {
      const tNames = ['', 'SPKT', 'Disposisi', 'Menuju Lokasi', 'Tindakan di TKP', 'Selesai'];
      badgeEl.innerText = '⚡ Tahap ' + (log.tahap || 3) + ' • ' + (tNames[log.tahap || 3] || 'Diproses');
      badgeEl.style.background = '#EDE9FE';
      badgeEl.style.color = '#6D28D9';
    }
  }

  // 3. Jenis Kegiatan / Header Input
  const respJenis = document.getElementById('wiz-respon-jenis');
  if (respJenis) {
    respJenis.value = (log.jenisInsiden || log.title).toUpperCase();
  }

  // 4. Detail Kasus di masing-masing Step (Jenis, Lokasi, Keterangan Pelapor)
  const jenisText = log.jenisInsiden || log.title;
  const lokasiText = log.lokasiKejadian || (log.sektor ? log.sektor + ', Jakarta' : 'Jl. Jend. Sudirman, Jakarta');
  const ketText = `"${log.deskripsi || log.title}"`;

  ['wiz-step1-jenis', 'wiz-step2-jenis', 'wiz-step3-jenis'].forEach(elId => {
    const el = document.getElementById(elId);
    if (el) el.innerText = jenisText;
  });

  ['wiz-step1-lokasi', 'wiz-step2-lokasi', 'wiz-step3-lokasi'].forEach(elId => {
    const el = document.getElementById(elId);
    if (el) el.innerText = lokasiText;
  });

  ['wiz-step1-ket', 'wiz-step2-ket'].forEach(elId => {
    const el = document.getElementById(elId);
    if (el) el.innerText = ketText;
  });

  // 5. Preview Foto Bukti Pengaduan 110 Warga
  const defaultFotoPengaduan = 'assets/images/polri_pengaduan_tkp.jpg';
  let imgSrc = log.fotoPengaduan || defaultFotoPengaduan;
  if (imgSrc.includes('placehold.co') || imgSrc.includes('549399542')) imgSrc = defaultFotoPengaduan;

  ['wiz-step1-foto', 'wiz-step2-foto'].forEach(elId => {
    const el = document.getElementById(elId);
    if (el) {
      el.onerror = function () {
        this.onerror = null;
        this.src = SVG_FALLBACK_PENGADUAN;
      };
      el.src = imgSrc;
    }
  });

  const metaStr = 'Laporan: ' + (log.waktu || '10:45 WIB') + ' • ' + (log.sektor || 'Wilayah Terverifikasi');
  ['wiz-step1-fotometa', 'wiz-step2-fotometa'].forEach(elId => {
    const el = document.getElementById(elId);
    if (el) el.innerText = metaStr;
  });

  // 5.b Sinkronisasi form wizard dengan data log yang tersimpan (Item 8 & Item 10)
  const step1Catatan = document.getElementById('wiz-step1-catatan');
  if (step1Catatan) step1Catatan.value = log.catatanPersiapan || '';

  if (log.fotoPersiapan) {
    const w1 = document.getElementById('wiz-step1-preview-wrap');
    const i1 = document.getElementById('wiz-step1-preview-img');
    const m1 = document.getElementById('wiz-step1-preview-meta');
    const b1 = document.getElementById('wiz-step1-cam-btn');
    if (w1) w1.style.display = 'block';
    if (i1) i1.src = log.fotoPersiapan;
    if (m1) m1.innerText = `📍 GPS: ${log.koordinatGps || ''} • ${log.waktuMeluncur || log.waktu || 'Siap'}`;
    if (b1) {
      b1.innerText = '✓ Foto Persiapan Terambil (Klik untuk Ganti)';
      b1.style.borderColor = '#16A34A';
      b1.style.color = '#15803D';
    }
  } else {
    const w1 = document.getElementById('wiz-step1-preview-wrap');
    if (w1) w1.style.display = 'none';
    const b1 = document.getElementById('wiz-step1-cam-btn');
    if (b1) {
      b1.innerText = '📸 Ambil / Ganti Foto Persiapan (Watermark GPS)';
      b1.style.borderColor = '';
      b1.style.color = '';
    }
  }

  const step2Catatan = document.getElementById('wiz-step2-catatan');
  if (step2Catatan) step2Catatan.value = log.deskripsiTindakan || '';

  if (log.fotoTindakan) {
    const w2 = document.getElementById('wiz-step2-preview-wrap');
    const i2 = document.getElementById('wiz-step2-preview-img');
    const m2 = document.getElementById('wiz-step2-preview-meta');
    const b2 = document.getElementById('wiz-step2-cam-btn');
    if (w2) w2.style.display = 'block';
    if (i2) i2.src = log.fotoTindakan;
    if (m2) m2.innerText = `📍 TKP Terverifikasi • ${log.waktuTiba || log.waktu || 'Penanganan'}`;
    if (b2) {
      b2.innerText = '✓ Foto Tindakan TKP Terambil (Klik untuk Ganti)';
      b2.style.borderColor = '#16A34A';
      b2.style.color = '#15803D';
    }
  } else {
    const w2 = document.getElementById('wiz-step2-preview-wrap');
    if (w2) w2.style.display = 'none';
    const b2 = document.getElementById('wiz-step2-cam-btn');
    if (b2) {
      b2.innerText = '📸 Ambil / Ganti Foto Kondisi TKP (Watermark GPS)';
      b2.style.borderColor = '';
      b2.style.color = '';
    }
  }

  const step3Catatan = document.getElementById('wiz-step3-catatan');
  if (step3Catatan) step3Catatan.value = log.catatanSelesai || '';

  if (log.fotoSelesai) {
    const w3 = document.getElementById('wiz-step3-preview-wrap');
    const i3 = document.getElementById('wiz-step3-preview-img');
    const b3 = document.getElementById('wiz-step3-cam-btn');
    if (w3) w3.style.display = 'block';
    if (i3) i3.src = log.fotoSelesai;
    if (b3) {
      b3.innerText = '✓ Foto Situasi Akhir Terambil (Klik untuk Ganti)';
      b3.style.borderColor = '#16A34A';
      b3.style.color = '#15803D';
    }
  } else {
    const w3 = document.getElementById('wiz-step3-preview-wrap');
    if (w3) w3.style.display = 'none';
    const b3 = document.getElementById('wiz-step3-cam-btn');
    if (b3) {
      b3.innerText = '📸 Ambil / Ganti Foto Situasi Akhir (Watermark GPS)';
      b3.style.borderColor = '';
      b3.style.color = '';
    }
  }

  // 6. Sinkronkan Step Accordion sesuai tahap saat ini
  const tahap = parseInt(log.tahap) || (log.status === 'selesai' ? 5 : 3);
  syncWizardStepsWithTahap(tahap);

  // Refresh GPS
  getLiveGPS();

  // 7. Buka halaman wizard
  switchTab('view-wizard');
}

function kembaliDariWizard() {
  switchTab('view-validasi');
  if (activeWizardLogId) {
    selectLogCard(activeWizardLogId);
  }
}

function ambilFotoWizard(step) {
  if (!activeWizardLogId) activeWizardLogId = selectedLogId;
  const log = appLogs.find(l => l.id === activeWizardLogId);
  if (!log) return;

  const waktuSekarang = formatWaktuHhMmWib();
  const gpsVal = (document.getElementById('koordinat-gps')?.value) || log.koordinatGps || '';

  const poolPersiapan = [
    'assets/images/polri_patrol_car.jpg'
  ];
  const poolTindakan = [
    'assets/images/polri_tindakan_tkp.jpg'
  ];

  if (step === 1) {
    log.fotoPersiapan = poolPersiapan[log.id % poolPersiapan.length];
    log.koordinatGps = gpsVal;

    const wrap = document.getElementById('wiz-step1-preview-wrap');
    const img = document.getElementById('wiz-step1-preview-img');
    const meta = document.getElementById('wiz-step1-preview-meta');
    const btn = document.getElementById('wiz-step1-cam-btn');
    if (wrap) wrap.style.display = 'block';
    if (img) img.src = log.fotoPersiapan;
    if (meta) meta.innerText = `📍 GPS: ${gpsVal} • ${waktuSekarang}`;
    if (btn) {
      btn.innerText = '✓ Foto Persiapan Terambil (Klik untuk Ganti)';
      btn.style.borderColor = '#16A34A';
      btn.style.color = '#15803D';
    }
    alert(`📸 Foto Persiapan Berhasil Diambil!\n\n• Koordinat GPS: ${gpsVal}\n• Waktu: ${waktuSekarang}\n• Watermark: Terverifikasi Satuan Patroli Presisi`);
  } else if (step === 2) {
    log.fotoTindakan = poolTindakan[log.id % poolTindakan.length];

    const wrap = document.getElementById('wiz-step2-preview-wrap');
    const img = document.getElementById('wiz-step2-preview-img');
    const meta = document.getElementById('wiz-step2-preview-meta');
    const btn = document.getElementById('wiz-step2-cam-btn');
    if (wrap) wrap.style.display = 'block';
    if (img) img.src = log.fotoTindakan;
    if (meta) meta.innerText = `📍 TKP Terverifikasi • ${waktuSekarang}`;
    if (btn) {
      btn.innerText = '✓ Foto Tindakan TKP Terambil (Klik untuk Ganti)';
      btn.style.borderColor = '#16A34A';
      btn.style.color = '#15803D';
    }
    alert(`📸 Foto Kondisi TKP Berhasil Diambil!\n\n• Lokasi: ${log.lokasiKejadian || 'TKP Sektor'}\n• Waktu: ${waktuSekarang}\n• Watermark: Dokumentasi Resmi Kepolisian`);
  } else if (step === 3) {
    log.fotoSelesai = 'assets/images/polri_situasi_selesai.jpg';

    const wrap = document.getElementById('wiz-step3-preview-wrap');
    const img = document.getElementById('wiz-step3-preview-img');
    const btn = document.getElementById('wiz-step3-cam-btn');
    if (wrap) wrap.style.display = 'block';
    if (img) img.src = log.fotoSelesai;
    if (btn) {
      btn.innerText = '✓ Foto Situasi Akhir Terambil (Klik untuk Ganti)';
      btn.style.borderColor = '#16A34A';
      btn.style.color = '#15803D';
    }
    alert(`📸 Foto Situasi Akhir Kondusif Berhasil Diambil!\n\n• Waktu: ${waktuSekarang}\n• Watermark: Dokumentasi Resmi Kepolisian Selesai Penanganan`);
  }
  saveLogsToStorage();
}

function syncWizardStepsWithTahap(tahap) {
  const s1Head = document.getElementById('step1-head');
  const s1Body = document.getElementById('step1-body');
  const s1Icon = document.getElementById('step1-icon');

  const s2Head = document.getElementById('step2-head');
  const s2Body = document.getElementById('step2-body');
  const s2Icon = document.getElementById('step2-icon');

  const s3Head = document.getElementById('step3-head');
  const s3Body = document.getElementById('step3-body');
  const s3Icon = document.getElementById('step3-icon');

  if (tahap <= 3) {
    // Tahap 3 (Menuju Lokasi): Step 1 aktif, Step 2 & 3 terkunci
    if (s1Head) {
      s1Head.className = 'wiz-header active';
      s1Head.title = 'Tahap 1 sedang aktif';
    }
    if (s1Body) s1Body.style.display = 'block';
    if (s1Icon) s1Icon.innerText = '⏳';

    if (s2Head) {
      s2Head.className = 'wiz-header locked';
      s2Head.title = '🔒 Tahap 2 masih terkunci';
    }
    if (s2Body) s2Body.style.display = 'none';
    if (s2Icon) s2Icon.innerText = '🔒';

    if (s3Head) {
      s3Head.className = 'wiz-header locked';
      s3Head.title = '🔒 Tahap 3 masih terkunci';
    }
    if (s3Body) s3Body.style.display = 'none';
    if (s3Icon) s3Icon.innerText = '🔒';
  } else if (tahap === 4) {
    // Tahap 4 (Tindakan di TKP): Step 1 selesai & dikunci, Step 2 aktif, Step 3 terkunci
    if (s1Head) {
      s1Head.className = 'wiz-header completed';
      s1Head.title = '✓ Tahap 1 telah selesai & dikunci permanen';
    }
    if (s1Body) s1Body.style.display = 'none';
    if (s1Icon) s1Icon.innerText = '✅';

    if (s2Head) {
      s2Head.className = 'wiz-header active';
      s2Head.title = 'Tahap 2 sedang aktif';
    }
    if (s2Body) s2Body.style.display = 'block';
    if (s2Icon) s2Icon.innerText = '⏳';

    if (s3Head) {
      s3Head.className = 'wiz-header locked';
      s3Head.title = '🔒 Tahap 3 masih terkunci';
    }
    if (s3Body) s3Body.style.display = 'none';
    if (s3Icon) s3Icon.innerText = '🔒';
  } else {
    // Tahap >= 5: Step 1 & 2 selesai & dikunci, Step 3 aktif (Penyelesaian Kasus)
    if (s1Head) {
      s1Head.className = 'wiz-header completed';
      s1Head.title = '✓ Tahap 1 telah selesai & dikunci permanen';
    }
    if (s1Body) s1Body.style.display = 'none';
    if (s1Icon) s1Icon.innerText = '✅';

    if (s2Head) {
      s2Head.className = 'wiz-header completed';
      s2Head.title = '✓ Tahap 2 telah selesai & dikunci permanen';
    }
    if (s2Body) s2Body.style.display = 'none';
    if (s2Icon) s2Icon.innerText = '✅';

    if (s3Head) {
      s3Head.className = 'wiz-header active';
      s3Head.title = 'Tahap 3 sedang aktif';
    }
    if (s3Body) s3Body.style.display = 'block';
    if (s3Icon) s3Icon.innerText = '⏳';
  }
}

function toggleWizStep(step) {
  const head = document.getElementById('step' + step + '-head');
  const body = document.getElementById('step' + step + '-body');
  if (!head || !body) return;

  if (head.classList.contains('locked')) {
    alert('🔒 Langkah ini masih terkunci! Penanganan kasus wajib diselesaikan secara berurutan.');
    return;
  }
  if (head.classList.contains('completed')) {
    alert('✓ Tahap ini telah selesai diverifikasi & dikunci permanen. Anda tidak dapat mengubah data pada tahap ini lagi.');
    return;
  }
  body.style.display = body.style.display === 'none' ? 'block' : 'none';
}

function nextStep(currentStep) {
  if (!activeWizardLogId) activeWizardLogId = selectedLogId;
  const log = appLogs.find(l => l.id === activeWizardLogId);
  if (!log) return;

  const waktuSekarang = formatWaktuHhMmWib();

  if (currentStep === 1) {
    // Sesuai Diagram: Step 1: Menuju Lokasi (Meluncur) -> Update otomatis: log.tahap = 4
    const inputGps = document.getElementById('koordinat-gps')?.value || '';
    const inputCatatan = document.getElementById('wiz-step1-catatan')?.value.trim() || 'Personel lengkap, perlengkapan dinas siap, segera meluncur menuju TKP.';

    log.koordinatGps = inputGps;
    log.catatanPersiapan = inputCatatan;
    log.waktuMeluncur = waktuSekarang;
    if (!log.fotoPersiapan) {
      log.fotoPersiapan = 'assets/images/polri_patrol_car.jpg';
    }

    // Catat ke Riwayat Validasi
    if (!log.riwayatValidasi) log.riwayatValidasi = [];
    log.riwayatValidasi.push({
      waktu: log.waktuMeluncur,
      aktor: (typeof getActiveSessionUser === 'function' && getActiveSessionUser() ? (getActiveSessionUser().namaSingkat || getActiveSessionUser().nama) : (log.assignedNama || log.nama || 'Petugas Lapangan')) + ' (Personel Lapangan)',
      aksi: 'Persiapan & Meluncur',
      catatan: log.catatanPersiapan + ' [GPS: ' + log.koordinatGps + ']'
    });

    // Maju ke Tindakan di TKP (Tahap 4)
    updateTahapPenanganan(activeWizardLogId, 4);
    syncWizardStepsWithTahap(4);
    saveLogsToStorage();

    const badge = document.getElementById('wiz-status-badge');
    if (badge) {
      badge.innerText = '⚡ Tindakan di TKP';
      badge.style.background = '#EDE9FE';
      badge.style.color = '#6D28D9';
    }
    alert('✓ Status Meluncur ke Lokasi berhasil dicatat!\n\n• Koordinat GPS: ' + log.koordinatGps + '\n• Status personel bergerak meluncur ke TKP.\n• Data foto persiapan & GPS otomatis tersinkronisasi ke Timeline!');

    // Auto-scroll ke Step 2
    const s2 = document.getElementById('step2-card');
    if (s2) s2.scrollIntoView({ behavior: 'smooth' });

  } else if (currentStep === 2) {
    // Sesuai Diagram: Step 2: Tiba & Penanganan di TKP -> Klik 'Kirim Laporan Penanganan ➔' -> log.tahap = 5
    const inputTindakan = document.getElementById('wiz-step2-catatan')?.value.trim() || 'Petugas telah tiba di TKP. Melakukan pengamanan dan tindakan kepolisian presisi sesuai SOP.';

    log.deskripsiTindakan = inputTindakan;
    log.waktuTiba = waktuSekarang;
    if (!log.slaDurasiMenit) {
      log.slaDurasiMenit = log.waktuMeluncur ? hitungSelisihMenitTeks(log.waktuMeluncur, waktuSekarang) : (Math.floor(Math.random() * 4) + 4);
    }
    if (!log.fotoTindakan) {
      log.fotoTindakan = 'assets/images/polri_tindakan_tkp.jpg';
    }

    // Catat ke Riwayat Validasi
    if (!log.riwayatValidasi) log.riwayatValidasi = [];
    log.riwayatValidasi.push({
      waktu: log.waktuTiba,
      aktor: (typeof getActiveSessionUser === 'function' && getActiveSessionUser() ? (getActiveSessionUser().namaSingkat || getActiveSessionUser().nama) : (log.assignedNama || log.nama || 'Petugas Lapangan')) + ' (Personel Lapangan)',
      aksi: 'Tindakan di TKP',
      catatan: log.deskripsiTindakan
    });

    // Sesuai Diagram: Maju ke Tahap 5 (Step 3: Kasus Selesai Ditangani aktif), status tetap 'diproses'
    log.tahap = 5;
    log.status = 'diproses';
    log.statusText = 'Tindakan TKP Selesai Dilaporkan';

    syncWizardStepsWithTahap(5);
    saveLogsToStorage();
    updateRekapCounts();
    displayLogDetail(activeWizardLogId);

    const badge = document.getElementById('wiz-status-badge');
    if (badge) {
      badge.innerText = '✓ Laporan TKP Terkirim';
      badge.style.background = '#FEF3C7';
      badge.style.color = '#B45309';
    }

    alert('✓ Laporan Tindakan di TKP Selesai Dikirim!\n\n• Sesuai Alur: Kasus berlanjut ke Step 3 (Kasus Selesai Ditangani).\n• Silakan lengkapi dokumentasi situasi akhir kondusif untuk menutup kasus.');

    // Auto-scroll ke Step 3
    const s3 = document.getElementById('step3-card');
    if (s3) s3.scrollIntoView({ behavior: 'smooth' });

  } else if (currentStep === 3) {
    // Sesuai Diagram: Step 3: Kasus Selesai Ditangani -> Klik '✅ Tutup Kasus' -> selesaikanKasus()
    const inputSelesai = document.getElementById('wiz-step3-catatan')?.value.trim() || 'Situasi telah aman dan kondusif, arus lalu lintas lancar kembali, warga kembali beraktivitas normal.';
    log.catatanSelesai = inputSelesai;
    log.waktuSelesai = waktuSekarang;
    if (!log.fotoSelesai) {
      log.fotoSelesai = 'assets/images/polri_situasi_selesai.jpg';
    }

    if (!log.riwayatValidasi) log.riwayatValidasi = [];
    log.riwayatValidasi.push({
      waktu: log.waktuSelesai,
      aktor: (typeof getActiveSessionUser === 'function' && getActiveSessionUser() ? (getActiveSessionUser().namaSingkat || getActiveSessionUser().nama) : (log.assignedNama || log.nama || 'Petugas Lapangan')) + ' (Personel Lapangan)',
      aksi: 'Kasus Ditutup di Lapangan (BAP Terkirim)',
      catatan: log.catatanSelesai
    });

    // Sesuai Diagram Fase 4: Penutupan Kasus
    selesaikanKasus(activeWizardLogId);
    kembaliDariWizard();
  }
}

function updateMacroStepper(log) {
  if (!log) return;
  const badge = document.getElementById('macro-source-badge');
  const isWarga = (log.tipePelapor === 'warga');
  if (badge) {
    badge.innerHTML = isWarga
      ? `👤 ${log.sumberLaporan || 'Laporan Warga 110'}`
      : `👮 ${log.sumberLaporan || 'Patroli Mandiri Personel'}`;
    badge.style.background = isWarga ? '#EFF6FF' : '#FEF3C7';
    badge.style.color = isWarga ? '#1D4ED8' : '#92400E';
    badge.style.borderColor = isWarga ? '#BFDBFE' : '#FDE68A';
  }

  const s1 = document.getElementById('mstep-1');
  const s2 = document.getElementById('mstep-2');
  const s3 = document.getElementById('mstep-3');
  const s4 = document.getElementById('mstep-4');

  const i1 = document.getElementById('micon-1');
  const i2 = document.getElementById('micon-2');
  const i3 = document.getElementById('micon-3');
  const i4 = document.getElementById('micon-4');

  const t1 = document.getElementById('mstat-1');
  const t2 = document.getElementById('mstat-2');
  const t3 = document.getElementById('mstat-3');
  const t4 = document.getElementById('mstat-4');

  const lastLog = document.getElementById('macro-last-log');

  const setStep = (el, iconEl, statEl, icon, text, bg, border, textColor, statColor, opacity = 1) => {
    if (!el) return;
    el.style.background = bg;
    el.style.borderColor = border;
    el.style.opacity = opacity;
    if (iconEl) {
      iconEl.innerText = icon;
      iconEl.style.color = textColor;
    }
    if (statEl) {
      statEl.innerText = text;
      statEl.style.color = statColor;
    }
  };

  // Step 1: Inisiasi
  const statTeks1 = isWarga ? 'Lapor 110' : 'Giat Patroli';
  setStep(s1, i1, t1, '✓', statTeks1, '#ECFDF5', '#A7F3D0', '#10B981', '#059669');

  if (log.status === 'menunggu') {
    setStep(s2, i2, t2, '⏳', 'Review Pawas', '#FEF3C7', '#F59E0B', '#D97706', '#B45309');
    setStep(s3, i3, t3, '🔒', 'Menunggu Acc', '#F8FAFC', '#E2E8F0', '#94A3B8', '#94A3B8', 0.6);
    setStep(s4, i4, t4, '🔒', 'Menunggu', '#F8FAFC', '#E2E8F0', '#94A3B8', '#94A3B8', 0.6);
    const asalTeks = isWarga
      ? `Laporan masuk dari warga (${log.nama}) via ${log.sumberLaporan || 'Call Center 110'}. Menunggu validasi & disposisi Pawas.`
      : `Laporan kegiatan lapangan dari ${log.nama} (${log.nrp || 'Polri'}). Menunggu review Pawas.`;
    if (lastLog) lastLog.innerHTML = '🕒 <strong>Menunggu Tindakan Pawas:</strong> ' + asalTeks;
  } else if (log.status === 'ditolak') {
    setStep(s2, i2, t2, '✕', 'Ditolak/Revisi', '#FEE2E2', '#EF4444', '#DC2626', '#B91C1C');
    setStep(s3, i3, t3, '⛔', 'Terkunci', '#F8FAFC', '#E2E8F0', '#94A3B8', '#94A3B8', 0.5);
    setStep(s4, i4, t4, '⛔', 'Terkunci', '#F8FAFC', '#E2E8F0', '#94A3B8', '#94A3B8', 0.5);
    if (lastLog) lastLog.innerHTML = '⚠️ <strong>Catatan Revisi:</strong> "' + (log.alasanTolak || 'Dokumentasi belum lengkap') + '"';
  } else if (log.status === 'disetujui') {
    setStep(s2, i2, t2, '✓', 'Disetujui', '#ECFDF5', '#A7F3D0', '#10B981', '#059669');
    setStep(s3, i3, t3, '⚡', 'Siap Diproses', '#EFF6FF', '#93C5FD', '#2563EB', '#1D4ED8');
    setStep(s4, i4, t4, '🔒', 'Menunggu', '#F8FAFC', '#E2E8F0', '#94A3B8', '#94A3B8', 0.6);
    if (lastLog) lastLog.innerHTML = '✓ <strong>Laporan Disetujui:</strong> Siap diterbitkan tiket penanganan oleh operator.';
  } else if (log.status === 'diproses') {
    setStep(s2, i2, t2, '✓', 'Disetujui', '#ECFDF5', '#A7F3D0', '#10B981', '#059669');
    const tahapNames = ['', 'Penerimaan SPKT', 'Disposisi Pawas', 'Meluncur ke TKP', 'Tindakan di TKP', 'Kasus Selesai'];
    setStep(s3, i3, t3, '●', (tahapNames[log.tahap || 3] || 'Di Lapangan'), '#EFF6FF', '#3B82F6', '#1D4ED8', '#1E40AF');
    setStep(s4, i4, t4, '🔒', 'Menunggu', '#F8FAFC', '#E2E8F0', '#94A3B8', '#94A3B8', 0.6);
    if (lastLog) lastLog.innerHTML = '🚀 <strong>Sedang Ditangani:</strong> Personel sedang melakukan penanganan di lapangan.';
  } else if (log.status === 'menunggu_pengesahan') {
    setStep(s2, i2, t2, '✓', 'Disetujui', '#ECFDF5', '#A7F3D0', '#10B981', '#059669');
    setStep(s3, i3, t3, '✓', 'TKP Selesai', '#ECFDF5', '#A7F3D0', '#10B981', '#059669');
    setStep(s4, i4, t4, '⏳', 'Pengesahan Pawas', '#F3E8FF', '#C084FC', '#7C3AED', '#6D28D9');
    if (lastLog) lastLog.innerHTML = '⚖️ <strong>Menunggu Pengesahan:</strong> Penanganan di TKP selesai, menunggu otorisasi penutupan kasus resmi dari Pawas.';
  } else if (log.status === 'selesai') {
    setStep(s2, i2, t2, '✓', 'Disetujui', '#ECFDF5', '#A7F3D0', '#10B981', '#059669');
    setStep(s3, i3, t3, '✓', 'Tuntas', '#ECFDF5', '#A7F3D0', '#10B981', '#059669');
    setStep(s4, i4, t4, '✓', 'Selesai 100%', '#ECFDF5', '#10B981', '#059669', '#047857');
    const stars = log.ratingKepuasan ? ' ⭐⭐⭐⭐⭐' : '';
    if (lastLog) lastLog.innerHTML = '🏆 <strong>Kasus Ditutup:</strong> Berita acara lengkap & disahkan pimpinan.' + stars;
  }
}

function koreksiLogDitolak(id) {
  const log = appLogs.find(l => l.id === id);
  if (!log) return;

  tampilkanPromptPresisi({
    judul: '📝 PENGAJUAN PERBAIKAN / REVISI LAPORAN',
    keterangan: 'Masukkan catatan perbaikan dokumen / klarifikasi revisi:\n(Alasan penolakan Pawas sebelumnya: "' + (log.alasanTolak || 'Dokumen belum lengkap') + '")',
    nilaiAwal: 'Foto bukti dan uraian kronologi telah diperbarui sesuai arahan SOP.',
    onConfirm: (catatanBaru) => {
      if (catatanBaru === null) return;
      log.status = 'menunggu';
      log.statusText = 'Menunggu Validasi Ulang';
      if (!log.riwayatValidasi) log.riwayatValidasi = [];
      log.riwayatValidasi.push({
        waktu: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
        aktor: log.nama + ' (Personel)',
        aksi: 'Pengajuan Revisi',
        catatan: catatanBaru.trim() || 'Perbaikan berkas diajukan ulang'
      });
      saveLogsToStorage();
      updateRekapCounts();
      tampilkanModalAlertPresisi('✓ Laporan #' + log.id + ' telah diajukan ulang ke Atasan untuk divalidasi kembali!\n\nStatus laporan kembali menjadi MENUNGGU VALIDASI.');
      openValidasiList('menunggu');
      selectLogCard(log.id);
    }
  });
}

function displayLogDetail(id) {
  const log = appLogs.find(l => l.id === id);
  if (!log) return;

  selectedLogId = id;
  const detailBox = document.getElementById('val-detail-box');
  if (detailBox) detailBox.style.display = 'block';
  const msBox = document.getElementById('macro-milestone-box');
  if (msBox) msBox.style.display = 'block';
  const listCont = document.getElementById('val-list-container');
  if (listCont) {
    listCont.style.flex = '1.2';
    listCont.style.width = 'auto';
  }

  updateMacroStepper(log);

  const isTimelineMode = (log.status === 'diproses' || log.status === 'menunggu_pengesahan' || log.status === 'selesai');
  const stdView = document.getElementById('detail-standard-view');
  const tlView = document.getElementById('detail-timeline-view');

  if (isTimelineMode) {
    if (stdView) stdView.style.display = 'none';
    if (tlView) tlView.style.display = 'block';

    if (!log.tahap) log.tahap = (log.status === 'selesai' || log.status === 'menunggu_pengesahan' ? 5 : 3);
    if (!log.nomorTiket) log.nomorTiket = 'TIKET-110-' + (log.id < 10 ? '0' + log.id : log.id) + 'X2F';
    if (!log.jenisInsiden) log.jenisInsiden = log.title;
    if (!log.lokasiKejadian) log.lokasiKejadian = (log.sektor ? log.sektor + ', Jakarta' : 'Jl. Jend. Sudirman, Jakarta');

    const tlNomor = document.getElementById('tl-nomor-laporan');
    if (tlNomor) tlNomor.innerText = log.nomorTiket;
    const tlJenis = document.getElementById('tl-jenis-insiden');
    if (tlJenis) tlJenis.innerText = log.jenisInsiden;
    const tlWaktu = document.getElementById('tl-waktu');
    if (tlWaktu) tlWaktu.innerText = 'Hari ini, ' + (log.waktu || '10:45 WIB');
    const tlLokasi = document.getElementById('tl-lokasi');
    if (tlLokasi) tlLokasi.innerText = log.lokasiKejadian;

    // Update badge status di header timeline (bersih tanpa duplikasi nomor)
    const tlStatusBadge = document.getElementById('tl-status-badge');
    if (tlStatusBadge) {
      const tNames = ['', 'SPKT', 'Disposisi', 'Menuju Lokasi', 'Tindakan di TKP', 'Kasus Selesai'];
      if (log.status === 'selesai') {
        tlStatusBadge.innerText = '✓ Selesai Ditangani';
        tlStatusBadge.style.background = '#DCFCE7';
        tlStatusBadge.style.color = '#16A34A';
      } else if (log.status === 'menunggu_pengesahan') {
        tlStatusBadge.innerText = '⚖️ Menunggu Pengesahan Pawas';
        tlStatusBadge.style.background = '#F3E8FF';
        tlStatusBadge.style.color = '#7C3AED';
      } else {
        tlStatusBadge.innerText = '⚡ ' + (tNames[log.tahap || 3] || 'Sedang Ditangani');
        tlStatusBadge.style.background = '#EDE9FE';
        tlStatusBadge.style.color = '#6D28D9';
      }
    }

    // Update Foto Bukti Laporan Warga di bawah Lokasi TKP (Full-Width Bersih)
    const fPengaduan = document.getElementById('tl-foto-pengaduan');
    const metaPengaduan = document.getElementById('tl-meta-pengaduan');
    const descPengaduan = document.getElementById('tl-desc-pengaduan');

    const defaultFotoPengaduan = getFotoPengaduanByKategori(log);
    let imgPengaduanSrc = log.fotoPengaduan || defaultFotoPengaduan;

    if (!imgPengaduanSrc || imgPengaduanSrc.includes('unsplash.com') || imgPengaduanSrc.includes('placehold.co')) {
      imgPengaduanSrc = defaultFotoPengaduan;
      log.fotoPengaduan = defaultFotoPengaduan;
    }

    if (fPengaduan) {
      fPengaduan.onerror = function () {
        this.onerror = null;
        this.src = SVG_FALLBACK_PENGADUAN;
      };
      fPengaduan.src = imgPengaduanSrc;
    }
    if (metaPengaduan) metaPengaduan.innerText = 'Foto Bukti Laporan 110 • ' + (log.waktu || '10:45 WIB');
    if (descPengaduan) descPengaduan.innerText = 'Laporan: "' + (log.deskripsi || log.title) + '"';

    const selTahap = document.getElementById('tl-select-tahap');
    if (selTahap) selTahap.value = log.tahap;

    renderTimelineSteps(log);

    const tlActions = document.getElementById('tl-actions-box');
    if (tlActions) {
      const disp = log.disposisi || {};
      const unitNama = disp.unit || 'Patroli Samapta Presisi (Unit Roda 4)';
      const komandanNama = disp.komandan || log.personelDitugaskan || log.petugasPenangan || (log.tipePelapor === 'personel' ? log.nama : 'Bripka Ahmad & Regu Alpha (Unit Samapta Presisi)');
      const arahanTeks = disp.arahan || 'Datangi TKP dengan sirine biru, amankan perimeter, prioritaskan keselamatan korban.';
      const waktuDisp = disp.waktuDisposisi || (log.waktu || '10:45 WIB');

      // =========================================================================
      // EVALUASI 3 TAHAPAN SLA RESMI PRESISI POLRI:
      // SLA 1: Respon Pimpinan/Pawas (Laporan Masuk ➔ Disposisi ke Anggota) [Target <= 5 Menit]
      // SLA 2: Waktu Tanggap Lapangan (Disposisi Diterima ➔ Anggota Siaga/Mulai Tangani) [Target <= 3 Menit]
      // SLA 3: Waktu Tempuh Patroli (Meluncur ➔ Tiba di TKP) [Target <= 10 Menit]
      // =========================================================================
      const waktuMasuk = log.waktu || '13:00 WIB';
      const waktuMeluncur = log.waktuMeluncur;
      const waktuTiba = log.waktuTiba;

      // 1. Hitung SLA 1: Laporan Masuk -> Disposisi Pawas
      let durasiSla1 = hitungSelisihMenitTeks(waktuMasuk, waktuDisp);
      const teksDurasiSla1 = durasiSla1 === 0 ? '< 1m' : `${durasiSla1}m`;
      const sla1Tepat = durasiSla1 <= 5;

      // 2. Hitung SLA 2: Disposisi -> Anggota Mulai Tangani (Klik Meluncur)
      let durasiSla2 = 0;
      let teksDurasiSla2 = '';
      let sla2Tepat = true;
      if (waktuMeluncur) {
        durasiSla2 = hitungSelisihMenitTeks(waktuDisp, waktuMeluncur);
        if (durasiSla2 >= 60) {
          const jam = Math.floor(durasiSla2 / 60);
          const sisaMenit = durasiSla2 % 60;
          teksDurasiSla2 = `${jam}j ${sisaMenit}m`;
        } else if (durasiSla2 === 0) {
          teksDurasiSla2 = '< 1m';
        } else {
          teksDurasiSla2 = `${durasiSla2}m`;
        }
        sla2Tepat = durasiSla2 <= 3;
      }

      // 3. Hitung SLA 3: Waktu Tempuh Meluncur -> Tiba di TKP (Target <= 10 Menit)
      const isSudahTibaTkp = (log.tahap >= 4 && waktuTiba);
      let durasiSla3 = log.slaDurasiMenit || 0;
      if (isSudahTibaTkp && waktuMeluncur && waktuTiba) {
        durasiSla3 = hitungSelisihMenitTeks(waktuMeluncur, waktuTiba);
        log.slaDurasiMenit = durasiSla3;
      }

      let teksDurasiSla3 = '';
      if (durasiSla3 >= 60) {
        const j = Math.floor(durasiSla3 / 60);
        const m = durasiSla3 % 60;
        teksDurasiSla3 = `${j}j ${m}m`;
      } else if (durasiSla3 === 0) {
        teksDurasiSla3 = '< 1m';
      } else {
        teksDurasiSla3 = `${durasiSla3}m`;
      }

      const slaDisplayHtml = (roleTitle) => `
            <div style="background:#0F172A; color:#F8FAFC; border-radius:10px; padding:12px; border-left:4px solid #38BDF8; box-shadow:0 4px 14px rgba(0,0,0,0.2);">
              <!-- Header Card Ringkas -->
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; padding-bottom:6px; border-bottom:1px solid rgba(255,255,255,0.08);">
                <div style="display:flex; align-items:center; gap:6px;">
                  <span style="font-size:12px;">⏱️</span>
                  <span style="font-size:10.5px; font-weight:800; color:#E2E8F0; letter-spacing:0.4px; text-transform:uppercase;">${roleTitle}</span>
                </div>
                <span style="font-size:9.5px; font-weight:700; color:#38BDF8; background:rgba(56,189,248,0.12); border:1px solid rgba(56,189,248,0.25); padding:1px 7px; border-radius:4px;">STANDAR PRESISI</span>
              </div>

              <!-- 3 Baris SLA Ringkas & Rapi -->
              <div style="display:flex; flex-direction:column; gap:6px;">
                
                <!-- SLA 1: Respon Pawas -->
                <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.06); border-radius:6px; padding:6px 9px; display:flex; justify-content:space-between; align-items:center;">
                  <div>
                    <div style="font-size:10.5px; font-weight:700; color:#F1F5F9;">1. Respon Pawas (Disposisi)</div>
                    <div style="font-size:9.5px; color:#94A3B8;">Target &le; 5 Menit (${waktuMasuk} ➔ ${waktuDisp})</div>
                  </div>
                  <div>
                    <span style="font-size:9.5px; font-weight:700; background:${sla1Tepat ? '#065F46' : '#78350F'}; color:${sla1Tepat ? '#34D399' : '#FDE68A'}; padding:2px 7px; border-radius:4px; display:inline-block; white-space:nowrap;">
                      ${sla1Tepat ? '✓ Respon Cepat (' + teksDurasiSla1 + ')' : '⚠️ Toleransi (' + teksDurasiSla1 + ')'}
                    </span>
                  </div>
                </div>

                <!-- SLA 2: Waktu Tanggap Anggota -->
                <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.06); border-radius:6px; padding:6px 9px; display:flex; justify-content:space-between; align-items:center;">
                  <div>
                    <div style="font-size:10.5px; font-weight:700; color:#F1F5F9;">2. Respon Anggota (Tanggap)</div>
                    <div style="font-size:9.5px; color:#94A3B8;">Target &le; 3 Menit (${waktuDisp} ➔ ${waktuMeluncur || 'Belum Berangkat'})</div>
                  </div>
                  <div>
                    ${waktuMeluncur ? `
                      <span style="font-size:9.5px; font-weight:700; background:${sla2Tepat ? '#065F46' : '#7F1D1D'}; color:${sla2Tepat ? '#34D399' : '#FCA5A5'}; padding:2px 7px; border-radius:4px; display:inline-block; white-space:nowrap;">
                        ${sla2Tepat ? '✓ Tanggap Cepat (' + teksDurasiSla2 + ')' : '🚨 Melebihi Batas (' + teksDurasiSla2 + ')'}
                      </span>
                    ` : `
                      <span style="font-size:9.5px; font-weight:700; background:#1E3A8A; color:#93C5FD; padding:2px 7px; border-radius:4px; display:inline-block; white-space:nowrap;">
                        ⏳ Menunggu Tindakan
                      </span>
                    `}
                  </div>
                </div>

                <!-- SLA 3: Waktu Tempuh ke TKP -->
                <div style="background:rgba(255,255,255,0.05); border:1px solid ${isSudahTibaTkp ? (durasiSla3 <= 10 ? '#059669' : '#DC2626') : '#0284C7'}; border-radius:6px; padding:7px 9px;">
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                    <div style="font-size:10.5px; font-weight:700; color:#F1F5F9;">3. Tempuh ke TKP (Target &le; 10m)</div>
                    <span id="sla3-badge-indicator" style="font-size:9px; font-weight:700; background:${isSudahTibaTkp ? (durasiSla3 <= 10 ? '#065F46' : '#7F1D1D') : '#0C4A6E'}; color:${isSudahTibaTkp ? (durasiSla3 <= 10 ? '#34D399' : '#FCA5A5') : '#38BDF8'}; padding:2px 6px; border-radius:4px; white-space:nowrap;">
                      ${isSudahTibaTkp ? (durasiSla3 <= 10 ? '● Tepat di TKP' : '🚨 Melebihi Batas (' + teksDurasiSla3 + ')') : (waktuMeluncur ? '● Sedang Meluncur' : 'Belum Berangkat')}
                    </span>
                  </div>
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div style="font-size:9.5px; color:#94A3B8;">
                      ${waktuMeluncur ? (waktuTiba ? 'Tiba: ' + waktuTiba : 'Berangkat: ' + waktuMeluncur) : 'Menunggu klik Meluncur'}
                    </div>
                    <div id="sla-live-clock" style="font-family:inherit; font-size:14px; font-weight:800; color:${isSudahTibaTkp && durasiSla3 > 10 ? '#FCA5A5' : '#38BDF8'}; letter-spacing:0.3px;">
                      ${waktuMeluncur ? (isSudahTibaTkp ? teksDurasiSla3 : (String(Math.floor(durasiSla3 / 60)).padStart(2, '0') + ':' + String(durasiSla3 % 60).padStart(2, '0'))) : '--:--'}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          `;

      if (log.status === 'diproses' || log.status === 'menunggu_pengesahan') {

        if (isUserPawas()) {
          const dispStatusBadge = (log.status === 'menunggu_pengesahan')
            ? `<span style="font-size:10px; font-weight:700; background:#EDE9FE; color:#7C3AED; padding:2px 6px; border-radius:4px;">Menunggu Pengesahan</span>`
            : `<span style="font-size:10px; font-weight:700; background:#DBEAFE; color:#1E40AF; padding:2px 6px; border-radius:4px;">Sedang Ditangani</span>`;

          tlActions.innerHTML = `
              <div style="display:flex; flex-direction:column; gap:10px;">
                <!-- 1. Indikator Evaluasi 3 Lapis SLA Presisi (Pawas) -->
                ${slaDisplayHtml('MONITORING 3 TAHAPAN SLA POLRI')}

                <!-- 2. Unit Satuan & Komandan Terdisposisi -->
                <div style="background:#F8FAFC; border:1px solid #CBD5E1; border-radius:10px; padding:12px 14px;">
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                    <span style="font-size:11px; font-weight:800; color:#1E293B;">🚔 DISPOSISI PASUKAN OLEH PAWAS</span>
                    ${dispStatusBadge}
                  </div>
                  <div style="font-size:12px; color:#334155; line-height:1.55;">
                    <div>• <strong>Satuan Bertugas:</strong> ${unitNama}</div>
                    <div>• <strong>Pimpinan Regu:</strong> ${komandanNama}</div>
                    ${disp.estimasiJarak ? `<div>• <strong>Estimasi Jarak &amp; ETA:</strong> <span style="color:#1E40AF; font-weight:700;">📍 ${disp.estimasiJarak}</span> (${disp.estimasiEta || '± 4 Menit'} ke TKP)</div>` : ''}
                    ${disp.posisiAwal ? `<div>• <strong>Posisi Awal Armada:</strong> <span style="color:#475569;">🏢 ${disp.posisiAwal}</span></div>` : ''}
                    ${disp.kekuatan ? `<div>• <strong>Kekuatan Alutsista:</strong> <span style="color:#475569;">🛡️ ${disp.kekuatan}</span></div>` : ''}
                    <div>• <strong>Waktu Disposisi:</strong> ${waktuDisp}</div>
                    <div style="margin-top:4px; background:white; border-left:3px solid #3B82F6; padding:6px 8px; border-radius:0 6px 6px 0; font-size:11.5px; font-style:italic;">
                      "${arahanTeks}"
                    </div>
                    ${disp.unitBackup ? `<div style="margin-top:4px; background:#EFF6FF; border-left:3px solid #0284C7; padding:6px 8px; border-radius:0 6px 6px 0; font-size:11.5px; color:#0369A1;"><strong>🚔 Back-Up Aktif:</strong> ${disp.unitBackup}</div>` : ''}
                  </div>
                </div>

                <!-- 3. Pengerahan Bantuan Armada / Unit Cadangan (Hanya tampil jika penanganan lapangan masih aktif) -->
                ${(log.status !== 'menunggu_pengesahan' && log.status !== 'selesai' && !log.bapTerkirim && log.tahap < 5) ? `
                <button type="button" onclick="pawasKirimBackup(${log.id})" style="width:100%; padding:11px 12px; background:#0284C7; color:white; border:none; border-radius:8px; font-size:12px; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; transition:opacity 0.15s;" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
                  <span>🚔</span> Kerahkan Unit Cadangan / Back-Up Tambahan
                </button>
                ` : ''}

                <!-- 4. Pengesahan Resmi Penutupan Kasus (Pawas) -->
                ${(log.status === 'menunggu_pengesahan' || log.bapTerkirim || log.tahap >= 5) && log.status !== 'selesai' ? `
                  <button type="button" onclick="pawasSahkanDanTutupKasus(${log.id})" style="width:100%; padding:13px; background:linear-gradient(135deg, #10B981 0%, #059669 100%); color:white; border:none; border-radius:8px; font-size:13px; font-weight:800; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; box-shadow:0 3px 10px rgba(16,185,129,0.35); transition:transform 0.15s;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='none'">
                    <span>✍️</span> Sahkan & Tutup Kasus ➔
                  </button>
                ` : ''}
              </div>
            `;
        } else {
          // Field Officer View (Bripka Ahmad & Regu Lapangan)
          const curActiveUser = (typeof getActiveSessionUser === 'function') ? getActiveSessionUser() : null;
          const userAlreadyAccepted = curActiveUser && Array.isArray(log.acceptedNrps) && log.acceptedNrps.includes(curActiveUser.nrp);

          let timSatuanHtml = '';
          if (Array.isArray(log.acceptedPersonels) && log.acceptedPersonels.length > 0) {
            const listNama = log.acceptedPersonels.map(p => `<span style="display:inline-block; background:#DCFCE7; color:#166534; font-size:11px; font-weight:700; padding:2px 8px; border-radius:12px; margin:2px;">👮 ${p.nama}</span>`).join(' ');
            timSatuanHtml = `
              <div style="background:#F0FDF4; border:1px solid #BBF7D0; border-radius:8px; padding:8px 12px; margin-bottom:4px;">
                <div style="font-size:11px; font-weight:800; color:#166534; margin-bottom:4px;">👥 Anggota Satuan yang Menangani (${log.acceptedPersonels.length} Personel):</div>
                <div>${listNama}</div>
              </div>
            `;
          }

          let tombolAksiPersonelHtml = '';
          if (!userAlreadyAccepted && (log.status === 'diproses' && log.tahap < 5)) {
            tombolAksiPersonelHtml = `
              <button type="button" style="width:100%; margin:0; padding:13px; background:linear-gradient(135deg, #059669 0%, #10B981 100%); color:white; font-size:13px; font-weight:800; display:flex; align-items:center; justify-content:center; gap:8px; border:none; border-radius:8px; box-shadow:0 4px 12px rgba(16,185,129,0.3); cursor:pointer; transition:transform 0.15s;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='none'" onclick="currentBroadcastLogId = ${log.id}; terimaTugasSatuanDariModal();">
                <span>🛡️</span> Terima Penugasan Satuan Ini ➔
              </button>
            `;
          } else if (log.status === 'menunggu_pengesahan' || (log.tahap >= 5 && (log.catatanSelesai || log.waktuSelesai))) {
            tombolAksiPersonelHtml = `
              <div style="background:#FEF9C3; border:1.5px solid #FDE047; border-radius:10px; padding:13px; display:flex; align-items:flex-start; gap:10px;">
                <span style="font-size:20px; line-height:1;">⏳</span>
                <div>
                  <div style="color:#854D0E; font-weight:800; font-size:13px;">Laporan Lapangan Terkirim (Menunggu Pengesahan Pawas)</div>
                  <div style="color:#92400E; font-size:11px; margin-top:3px;">Personel telah menyelesaikan penanganan di TKP dan menutup laporan. Menunggu pengesahan resmi Berita Acara oleh Perwira Pengawas (Pawas).</div>
                </div>
              </div>
            `;
          } else if (log.tahap >= 5 && log.status !== 'selesai') {
            tombolAksiPersonelHtml = `
              <button type="button" class="btn-blue" style="width:100%; margin:0; padding:13px; background:linear-gradient(135deg, #10B981 0%, #059669 100%); color:white; font-size:13px; font-weight:800; display:flex; align-items:center; justify-content:center; gap:8px; border:none; border-radius:8px; box-shadow:0 3px 10px rgba(16,185,129,0.3); cursor:pointer; transition:transform 0.15s;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='none'" onclick="openWizardForLog(${log.id})">
                <span>✅</span> Lanjutkan ke Step 3: Tutup Kasus ➔
              </button>
            `;
          } else {
            tombolAksiPersonelHtml = `
              <button type="button" class="btn-blue" style="width:100%; margin:0; padding:13px; background:linear-gradient(135deg, #153E75 0%, #1E40AF 100%); color:white; font-size:13px; font-weight:800; display:flex; align-items:center; justify-content:center; gap:8px; border:none; border-radius:8px; box-shadow:0 3px 10px rgba(21,62,117,0.3); cursor:pointer; transition:transform 0.15s;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='none'" onclick="openWizardForLog(${log.id})">
                <span>🚀</span> Lanjutkan Penanganan Kasus (Buka Wizard) ➔
              </button>
            `;
          }

          tlActions.innerHTML = `
              <div style="display:flex; flex-direction:column; gap:10px;">
                <!-- 1. Indikator Evaluasi 3 Lapis SLA Presisi (Petugas) -->
                ${slaDisplayHtml('TARGET & EVALUASI WAKTU TANGGAP (SLA)')}

                <!-- Tim Satuan Terlibat -->
                ${timSatuanHtml}

                <!-- 2. Tombol Eksekusi Operasional Utama -->
                ${tombolAksiPersonelHtml}
              </div>
            `;
        }

        // Jalankan Live Stopwatch SLA 3 hanya jika personel SUDAH meluncur tapi BELUM tiba di TKP
        if (window._simapresSlaInterval) {
          clearInterval(window._simapresSlaInterval);
          window._simapresSlaInterval = null;
        }

        if (waktuMeluncur && !isSudahTibaTkp) {
          // Hitung detik riil yang sudah berlalu sejak jam keberangkatan (waktuMeluncur) hingga detik ini
          let totalDetik = hitungDetikDariWaktuTeks(waktuMeluncur);
          if (totalDetik < 0 || isNaN(totalDetik)) totalDetik = 0;

          // Tampilkan langsung nilai aktual detik ini
          const initialClockEl = document.getElementById('sla-live-clock');
          if (initialClockEl) {
            const im = Math.floor(totalDetik / 60);
            const is = totalDetik % 60;
            initialClockEl.innerText = String(im).padStart(2, '0') + ':' + String(is).padStart(2, '0');
          }

          window._simapresSlaInterval = setInterval(() => {
            totalDetik++;
            const clockEl = document.getElementById('sla-live-clock');
            const badgeEl = document.getElementById('sla3-badge-indicator');
            if (!clockEl) {
              clearInterval(window._simapresSlaInterval);
              return;
            }
            const m = Math.floor(totalDetik / 60);
            const s = totalDetik % 60;
            clockEl.innerText = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');

            // Evaluasi live batas waktu SLA 3 (< 10m Tepat, 10-15m Peringatan, > 15m Terlambat)
            if (m > 15) {
              if (badgeEl) {
                badgeEl.innerText = '🚨 MELEBIHI TARGET (> 15M)';
                badgeEl.style.background = '#7F1D1D';
                badgeEl.style.color = '#FCA5A5';
              }
            } else if (m > 10) {
              if (badgeEl) {
                badgeEl.innerText = '⚠️ BATAS TOLERANSI (10-15M)';
                badgeEl.style.background = '#78350F';
                badgeEl.style.color = '#FDE68A';
              }
            }
          }, 1000);
        }
      } else {
        const rating = log.ratingKepuasan;
        // Survei hanya dari input nyata warga yang telah mengisi di portal (sudahDinilai)
        const ratingCardHtml = (rating && rating.sudahDinilai) ? (() => {
          const skor = rating.skor || 5;
          const starsStr = '★'.repeat(skor) + '☆'.repeat(5 - skor);
          const tagsHtml = (rating.tags && rating.tags.length)
            ? `<div style="display:flex; flex-wrap:wrap; gap:4px; margin:6px 0;">${rating.tags.map(t => `<span style="font-size:10px; background:#FEF3C7; color:#92400E; padding:2px 7px; border-radius:10px; font-weight:600;">${t}</span>`).join('')}</div>`
            : '';
          return `
              <div style="background:#FFFBEB; border:1.5px solid #FDE68A; border-radius:8px; padding:12px; box-shadow:0 2px 6px rgba(245,158,11,0.08);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                  <span style="font-size:11px; font-weight:800; color:#B45309; text-transform:uppercase; letter-spacing:0.5px;">⭐ Penilaian Warga (Portal 110)</span>
                  <span style="font-size:13px; font-weight:800; color:#D97706;">${starsStr} (${skor}/5)</span>
                </div>
                ${tagsHtml}
                ${rating.ulasan ? `<div style="font-size:12px; font-style:italic; color:#78350F; background:white; padding:8px 10px; border-radius:6px; border:1px dashed #FCD34D; margin-top:4px;">"${rating.ulasan}"</div>` : ''}
                ${rating.waktu ? `<div style="margin-top:8px; font-size:10px; color:#92400E; font-weight:600;">🕒 ${rating.waktu}</div>` : ''}
              </div>`;
        })() : '';

        tlActions.innerHTML = `
            <div style="display:flex; flex-direction:column; gap:10px;">
              <!-- 1. Evaluasi Resmi 3 Tahapan SLA Presisi (Riwayat Permanen) -->
              ${slaDisplayHtml('EVALUASI AKHIR WAKTU TANGGAP (SLA)')}

              <!-- 2. Status Penutupan Kasus (Sesuai Diagram Fase 4) -->
              ${log.pengesahanPawas ? `
              <div style="background:#ECFDF5; border:1.5px solid #34D399; border-radius:10px; padding:13px; display:flex; flex-direction:column; gap:6px;">
                <div style="display:flex; align-items:center; gap:8px;">
                  <span style="font-size:18px;">✅</span>
                  <div>
                    <div style="color:#065F46; font-weight:800; font-size:13px;">Kasus Selesai Ditangani & Telah Ditutup</div>
                    <div style="color:#047857; font-size:11px; margin-top:2px;">Berita acara penanganan telah disahkan secara resmi oleh pimpinan.</div>
                  </div>
                </div>
                <div style="background:#D1FAE5; border-radius:6px; padding:7px 10px; font-size:11px; color:#065F46;">
                  <strong>Disahkan oleh:</strong> ${log.pengesahanPawas.aktor || log.pengesahanPawas.nama || ''}
                  &nbsp;|&nbsp; <strong>Pukul:</strong> ${log.pengesahanPawas.waktu || '-'}
                  ${log.pengesahanPawas.catatan ? `<div style="margin-top:4px; font-style:italic;">"${log.pengesahanPawas.catatan}"</div>` : ''}
                </div>
              </div>
              ` : `
              <div style="background:#FEF9C3; border:1.5px solid #FDE047; border-radius:10px; padding:13px; display:flex; align-items:flex-start; gap:10px;">
                <span style="font-size:20px; line-height:1;">⏳</span>
                <div>
                  <div style="color:#854D0E; font-weight:800; font-size:13px;">Laporan Lapangan Terkirim</div>
                  <div style="color:#92400E; font-size:11px; margin-top:3px;">Personel telah menyelesaikan penanganan. Menunggu pengesahan resmi Berita Acara oleh Pawas (Pengawas Pimpinan).</div>
                </div>
              </div>
              `}
              <!-- 3. Survei Kepuasan Warga (hanya jika sudah diisi warga di portal) -->
              ${ratingCardHtml}
            </div>
          `;
      }
    }
    return;
  }

  // Standard View (Menunggu, Disetujui, Ditolak)
  if (stdView) stdView.style.display = 'block';
  if (tlView) tlView.style.display = 'none';

  const imgEl = document.getElementById('detail-val-img');
  const titleEl = document.getElementById('detail-val-title');
  const descEl = document.getElementById('detail-val-desc');
  const sektorEl = document.getElementById('detail-val-sektor');
  const petugasEl = document.getElementById('detail-val-petugas');
  const waktuEl = document.getElementById('detail-val-waktu');
  const statusBadgeEl = document.getElementById('detail-val-status-badge');
  const alasanBox = document.getElementById('detail-val-alasan-box');
  const alasanText = document.getElementById('detail-val-alasan-text');
  const actionsBox = document.getElementById('detail-val-actions');

  if (imgEl) {
    imgEl.onerror = function () {
      this.onerror = null;
      this.src = SVG_FALLBACK_PENGADUAN;
    };
    let srcLampiran = log.fotoLampiran || log.fotoPengaduan;
    if (!srcLampiran || srcLampiran.includes('placehold.co') || srcLampiran.includes('Disetujui')) {
      srcLampiran = log.fotoPengaduan || 'assets/images/polri_pengaduan_tkp.jpg';
    }
    imgEl.src = srcLampiran;
  }
  if (titleEl) titleEl.innerText = log.title;
  if (descEl) descEl.innerText = log.deskripsi;
  if (sektorEl) sektorEl.innerText = log.sektor;
  if (waktuEl) waktuEl.innerText = log.waktu;

  const platform = log.platform || (log.tipePelapor === 'internal' ? 'personel' : 'warga');
  const petugasLabelEl = document.getElementById('detail-val-petugas-label');
  const kontakLabelEl = document.getElementById('detail-val-kontak-label');
  const kontakEl = document.getElementById('detail-val-kontak');
  const sumberEl = document.getElementById('detail-val-sumber');

  if (platform === 'sos') {
    if (petugasLabelEl) petugasLabelEl.innerText = '🚨 Pelapor Darurat (SOS Panic):';
    if (petugasEl) petugasEl.innerHTML = `<span style="color:#DC2626; font-weight:800; font-size:13px;">${log.nama}</span> <span style="font-size:10px; background:#FEE2E2; color:#DC2626; font-weight:800; padding:2px 7px; border-radius:4px; border:1px solid #FECACA;">🚨 Suar SOS Aktif</span>`;
    if (kontakLabelEl) kontakLabelEl.innerText = 'Kontak & Koordinat GPS:';
    if (kontakEl) kontakEl.innerHTML = `📞 <strong style="color:#DC2626;">${log.noTelpPelapor || ''}</strong> <span style="font-size:10.5px; color:#64748B;">• 🛰️ GPS: ${log.gpsCoords || ''} (Akurasi Tinggi)</span>`;
    if (sumberEl) sumberEl.innerHTML = `<span style="font-size:11px; font-weight:800; color:#DC2626; background:#FEF2F2; border:1px solid #FECACA; padding:3px 9px; border-radius:4px; display:inline-block;">🚨 PANGGILAN DARURAT SOS (PANIC BUTTON)</span>`;
  } else if (platform === 'warga') {
    if (petugasLabelEl) petugasLabelEl.innerText = '📱 Identitas Pelapor (Portal):';
    if (petugasEl) petugasEl.innerHTML = `<span style="color:#0284C7; font-weight:800; font-size:13px;">${log.nama}</span> <span style="font-size:10px; background:#F0F9FF; color:#0284C7; font-weight:800; padding:2px 7px; border-radius:4px; border:1px solid #BAE6FD;">Portal Warga Terverifikasi</span>`;
    if (kontakLabelEl) kontakLabelEl.innerText = 'Kontak & NIK Terdaftar:';
    if (kontakEl) kontakEl.innerHTML = `📞 <strong style="color:#0369A1;">${log.noTelpPelapor || ''}</strong> ${log.nikPelapor ? `<span style="font-size:10.5px; color:#64748B;">• 🪪 NIK: ${log.nikPelapor} (Dukcapil Valid)</span>` : ''}`;
    if (sumberEl) sumberEl.innerHTML = `<span style="font-size:11px; font-weight:800; color:#0284C7; background:#F0F9FF; border:1px solid #BAE6FD; padding:3px 9px; border-radius:4px; display:inline-block;">📱 PORTAL PRESISI WARGA (ONLINE)</span>`;
  } else if (platform === 'layanan110') {
    if (petugasLabelEl) petugasLabelEl.innerText = '📞 Penelepon Hotline 110:';
    if (petugasEl) petugasEl.innerHTML = `<span style="color:#1D4ED8; font-weight:800; font-size:13px;">${log.nama}</span> <span style="font-size:10px; background:#EFF6FF; color:#1D4ED8; font-weight:800; padding:2px 7px; border-radius:4px; border:1px solid #BFDBFE;">Warga Pelapor 110</span>`;
    if (kontakLabelEl) kontakLabelEl.innerText = 'Nomor Telepon & Rekaman:';
    if (kontakEl) kontakEl.innerHTML = `📞 <strong style="color:#1D4ED8;">${log.noTelpPelapor || ''}</strong> <span style="font-size:10.5px; color:#64748B;">• 🎧 Rekaman SPKT 110 Terarsip</span>`;
    if (sumberEl) sumberEl.innerHTML = `<span style="font-size:11px; font-weight:800; color:#1D4ED8; background:#EFF6FF; border:1px solid #BFDBFE; padding:3px 9px; border-radius:4px; display:inline-block;">📞 PANGGILAN DARURAT 110 (CALL CENTER)</span>`;
  } else {
    if (petugasLabelEl) petugasLabelEl.innerText = '👮 Personel Pelapor (Polri):';
    if (petugasEl) petugasEl.innerHTML = `<span style="color:#0F172A; font-weight:800; font-size:13px;">${log.nama}</span> <span style="font-size:10px; background:#FEF3C7; color:#92400E; font-weight:800; padding:2px 7px; border-radius:4px; border:1px solid #FDE68A;">NRP: ${log.nrp || ''}</span>`;
    if (kontakLabelEl) kontakLabelEl.innerText = 'Kesatuan / Unit:';
    if (kontakEl) kontakEl.innerHTML = `🛡️ <strong style="color:#334155;">${log.kesatuan || ''}</strong>`;
    if (sumberEl) sumberEl.innerHTML = `<span style="font-size:11px; font-weight:800; color:#92400E; background:#FEF3C7; border:1px solid #FDE68A; padding:3px 9px; border-radius:4px; display:inline-block;">👮 PATROLI MANDIRI PERSONEL POLRI</span>`;
  }

  // Badge status di panel kanan
  if (statusBadgeEl) {
    statusBadgeEl.innerText = log.statusText;
    if (log.status === 'menunggu') {
      statusBadgeEl.style.background = '#FEF3C7';
      statusBadgeEl.style.color = '#D97706';
    } else if (log.status === 'disetujui') {
      statusBadgeEl.style.background = '#DCFCE7';
      statusBadgeEl.style.color = '#16A34A';
    } else if (log.status === 'ditolak') {
      statusBadgeEl.style.background = '#FEE2E2';
      statusBadgeEl.style.color = '#DC2626';
    } else {
      statusBadgeEl.style.background = '#EDE9FE';
      statusBadgeEl.style.color = '#6D28D9';
    }
  }

  // Alasan penolakan jika status ditolak
  if (alasanBox && alasanText) {
    if (log.status === 'ditolak' && log.alasanTolak) {
      alasanBox.style.display = 'block';
      alasanText.innerText = log.alasanTolak;
    } else {
      alasanBox.style.display = 'none';
    }
  }

  // Tombol aksi di panel kanan sesuai status
  if (actionsBox) {
    if (log.status === 'menunggu') {
      if (isUserPawas()) {
        actionsBox.innerHTML = `
            <button type="button" class="btn-blue" style="flex:1.4; margin:0; padding:12px 14px; background:linear-gradient(135deg, #153E75 0%, #1E40AF 100%); color:white; font-size:13px; font-weight:800; display:flex; align-items:center; justify-content:center; gap:6px; border-radius:8px; border:none; box-shadow:0 3px 10px rgba(21,62,117,0.3); cursor:pointer; transition:transform 0.15s;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='none'" onclick="bukaModalDisposisiPawas(${log.id})">
              <span>⚡</span> Disposisi Tugas ➔
            </button>
            <button type="button" class="btn-rej" style="flex:0.8; padding:12px 10px; border-radius:8px; border:1px solid #FCA5A5; background:#FEF2F2; color:#DC2626; font-weight:700; font-size:12px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:4px; transition:background 0.15s;" onmouseover="this.style.background='#FEE2E2'" onmouseout="this.style.background='#FEF2F2'" onclick="bukaHalamanTolak(${log.id})">
              <span>✕</span> Tolak / Revisi
            </button>
          `;
      } else {
        actionsBox.innerHTML = `
            <button type="button" class="btn-acc" style="flex:1; padding:12px; border-radius:8px; border:none; background:var(--success); color:white; font-weight:700; font-size:13px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; box-shadow:0 2px 6px rgba(16,185,129,0.3); transition:transform 0.15s, opacity 0.15s;" onmouseover="this.style.opacity='0.9'; this.style.transform='scale(1.02)'" onmouseout="this.style.opacity='1'; this.style.transform='none'" onclick="setujuiLog(${log.id})">
              <span>✓</span> Setujui
            </button>
            <button type="button" class="btn-rej" style="flex:1; padding:12px; border-radius:8px; border:none; background:var(--danger); color:white; font-weight:700; font-size:13px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; box-shadow:0 2px 6px rgba(239,68,68,0.3); transition:transform 0.15s, opacity 0.15s;" onmouseover="this.style.opacity='0.9'; this.style.transform='scale(1.02)'" onmouseout="this.style.opacity='1'; this.style.transform='none'" onclick="bukaHalamanTolak(${log.id})">
              <span>✕</span> Tolak
            </button>
          `;
      }
    } else if (log.status === 'ditolak') {
      actionsBox.innerHTML = `
          <button type="button" class="btn-blue" style="width:100%; margin:0; padding:12px; background:#D97706; font-size:13px; font-weight:700; display:flex; align-items:center; justify-content:center; gap:6px; border-radius:8px; border:none; color:white; cursor:pointer; box-shadow:0 2px 6px rgba(217,119,6,0.3); transition:transform 0.15s;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='none'" onclick="koreksiLogDitolak(${log.id})">
            <span>✏️</span> Ajukan Revisi & Kirim Ulang ke Atasan ➔
          </button>
        `;
    } else {
      actionsBox.innerHTML = '';
    }
  }
}

function previewLogDetail(id) {
  displayLogDetail(id);
}

function filterByPlatform(platform) {
  currentPlatformFilter = platform;
  const platforms = ['all', 'sos', 'warga', 'layanan110', 'personel'];
  platforms.forEach(p => {
    const btn = document.getElementById('filter-platform-' + p);
    const badge = btn ? btn.querySelector('.badge-mini') : null;
    if (btn) {
      if (p === platform) {
        btn.classList.add('active');
        if (p === 'sos') { btn.style.background = '#DC2626'; btn.style.color = 'white'; btn.style.borderColor = 'transparent'; }
        else if (p === 'warga') { btn.style.background = '#0284C7'; btn.style.color = 'white'; btn.style.borderColor = 'transparent'; }
        else if (p === 'layanan110') { btn.style.background = '#1D4ED8'; btn.style.color = 'white'; btn.style.borderColor = 'transparent'; }
        else if (p === 'personel') { btn.style.background = '#92400E'; btn.style.color = 'white'; btn.style.borderColor = 'transparent'; }
        else { btn.style.background = '#0F172A'; btn.style.color = 'white'; btn.style.borderColor = 'transparent'; }
        if (badge) { badge.style.background = 'rgba(255,255,255,0.25)'; badge.style.color = 'white'; }
      } else {
        btn.classList.remove('active');
        if (p === 'sos') { btn.style.background = '#FEF2F2'; btn.style.color = '#DC2626'; btn.style.borderColor = '#FECACA'; if (badge) { badge.style.background = '#FEE2E2'; badge.style.color = '#DC2626'; } }
        else if (p === 'warga') { btn.style.background = '#F0F9FF'; btn.style.color = '#0284C7'; btn.style.borderColor = '#BAE6FD'; if (badge) { badge.style.background = '#E0F2FE'; badge.style.color = '#0284C7'; } }
        else if (p === 'layanan110') { btn.style.background = '#EFF6FF'; btn.style.color = '#1D4ED8'; btn.style.borderColor = '#BFDBFE'; if (badge) { badge.style.background = '#DBEAFE'; badge.style.color = '#1D4ED8'; } }
        else if (p === 'personel') { btn.style.background = '#FEF3C7'; btn.style.color = '#92400E'; btn.style.borderColor = '#FDE68A'; if (badge) { badge.style.background = '#FEF3C7'; badge.style.color = '#92400E'; } }
        else { btn.style.background = '#F1F5F9'; btn.style.color = '#475569'; btn.style.borderColor = '#CBD5E1'; if (badge) { badge.style.background = '#E2E8F0'; badge.style.color = '#475569'; } }
      }
    }
  });

  // Switch bilah kategori: Jika platform 'personel' aktif, tampilkan JENIS GIAT PERSONEL
  currentKategoriFilter = 'all';
  renderFilterKategoriBar();
  updateResetFilterVisibility();
  if (typeof updateRekapCounts === 'function') updateRekapCounts();
  openValidasiList(currentValidasiFilter, false);
}

function renderFilterKategoriBar() {
  const lbl = document.getElementById('filter-kat-label');
  const btnContainer = document.getElementById('filter-kat-buttons');
  if (!btnContainer) return;

  const logsForKategori = appLogs.filter(l => {
    const matchStatus = (currentValidasiFilter === 'semua') || (l.status === currentValidasiFilter);
    const matchPlatform = (currentPlatformFilter === 'all') || (l.platform === currentPlatformFilter);
    return matchStatus && matchPlatform;
  });

  if (currentPlatformFilter === 'personel') {
    if (lbl) lbl.innerHTML = '<span>👮</span> JENIS GIAT:';
    const cAll = logsForKategori.length;
    const cPatroli = logsForKategori.filter(l => l.kategoriInsiden === 'PATROLI').length;
    const cSambang = logsForKategori.filter(l => l.kategoriInsiden === 'SAMBANG').length;
    const cTptkp = logsForKategori.filter(l => l.kategoriInsiden === 'TPTKP').length;
    const cPam = logsForKategori.filter(l => l.kategoriInsiden === 'PENGAMANAN').length;

    btnContainer.innerHTML = `
      <button type="button" class="btn-filter-kategori ${currentKategoriFilter === 'all' ? 'active' : ''}" id="filter-kat-all" onclick="filterByKategori('all')" style="padding:3px 8px; border-radius:5px; border:1px solid transparent; background:${currentKategoriFilter === 'all' ? '#1E293B' : '#F8FAFC'}; color:${currentKategoriFilter === 'all' ? 'white' : '#64748B'}; font-size:10.5px; font-weight:700; cursor:pointer;">
        Semua Giat <span class="badge-mini" style="background:${currentKategoriFilter === 'all' ? 'rgba(255,255,255,0.25)' : '#E2E8F0'}; color:${currentKategoriFilter === 'all' ? 'white' : '#475569'}; padding:1px 5px; border-radius:10px; margin-left:3px; font-size:9.5px;">${cAll}</span>
      </button>
      <button type="button" class="btn-filter-kategori ${currentKategoriFilter === 'PATROLI' ? 'active' : ''}" id="filter-kat-patroli" onclick="filterByKategori('PATROLI')" style="padding:3px 8px; border-radius:5px; border:1px solid #BFDBFE; background:${currentKategoriFilter === 'PATROLI' ? '#1D4ED8' : '#EFF6FF'}; color:${currentKategoriFilter === 'PATROLI' ? 'white' : '#1D4ED8'}; font-size:10.5px; font-weight:700; cursor:pointer;">
        🚔 Patroli <span class="badge-mini" style="background:${currentKategoriFilter === 'PATROLI' ? 'rgba(255,255,255,0.25)' : '#DBEAFE'}; color:${currentKategoriFilter === 'PATROLI' ? 'white' : '#1D4ED8'}; padding:1px 5px; border-radius:10px; margin-left:3px; font-size:9.5px;">${cPatroli}</span>
      </button>
      <button type="button" class="btn-filter-kategori ${currentKategoriFilter === 'SAMBANG' ? 'active' : ''}" id="filter-kat-sambang" onclick="filterByKategori('SAMBANG')" style="padding:3px 8px; border-radius:5px; border:1px solid #BBF7D0; background:${currentKategoriFilter === 'SAMBANG' ? '#15803D' : '#F0FDF4'}; color:${currentKategoriFilter === 'SAMBANG' ? 'white' : '#15803D'}; font-size:10.5px; font-weight:700; cursor:pointer;">
        🤝 Sambang <span class="badge-mini" style="background:${currentKategoriFilter === 'SAMBANG' ? 'rgba(255,255,255,0.25)' : '#DCFCE7'}; color:${currentKategoriFilter === 'SAMBANG' ? 'white' : '#15803D'}; padding:1px 5px; border-radius:10px; margin-left:3px; font-size:9.5px;">${cSambang}</span>
      </button>
      <button type="button" class="btn-filter-kategori ${currentKategoriFilter === 'TPTKP' ? 'active' : ''}" id="filter-kat-tptkp" onclick="filterByKategori('TPTKP')" style="padding:3px 8px; border-radius:5px; border:1px solid #FECACA; background:${currentKategoriFilter === 'TPTKP' ? '#DC2626' : '#FEF2F2'}; color:${currentKategoriFilter === 'TPTKP' ? 'white' : '#DC2626'}; font-size:10.5px; font-weight:700; cursor:pointer;">
        🛡️ TPTKP <span class="badge-mini" style="background:${currentKategoriFilter === 'TPTKP' ? 'rgba(255,255,255,0.25)' : '#FEE2E2'}; color:${currentKategoriFilter === 'TPTKP' ? 'white' : '#DC2626'}; padding:1px 5px; border-radius:10px; margin-left:3px; font-size:9.5px;">${cTptkp}</span>
      </button>
      <button type="button" class="btn-filter-kategori ${currentKategoriFilter === 'PENGAMANAN' ? 'active' : ''}" id="filter-kat-pam" onclick="filterByKategori('PENGAMANAN')" style="padding:3px 8px; border-radius:5px; border:1px solid #FDE68A; background:${currentKategoriFilter === 'PENGAMANAN' ? '#D97706' : '#FFFBEB'}; color:${currentKategoriFilter === 'PENGAMANAN' ? 'white' : '#B45309'}; font-size:10.5px; font-weight:700; cursor:pointer;">
        ⚠️ Pengamanan <span class="badge-mini" style="background:${currentKategoriFilter === 'PENGAMANAN' ? 'rgba(255,255,255,0.25)' : '#FEF3C7'}; color:${currentKategoriFilter === 'PENGAMANAN' ? 'white' : '#B45309'}; padding:1px 5px; border-radius:10px; margin-left:3px; font-size:9.5px;">${cPam}</span>
      </button>
    `;
  } else {
    if (lbl) lbl.innerHTML = '<span>📁</span> JENIS ADUAN:';
    const cAll = logsForKategori.length;
    const cKrim = logsForKategori.filter(l => l.kategoriInsiden === 'Kriminalitas').length;
    const cKamtib = logsForKategori.filter(l => l.kategoriInsiden === 'Kamtibmas').length;
    const cLaka = logsForKategori.filter(l => l.kategoriInsiden === 'Laka Lantas').length;
    const cDarurat = logsForKategori.filter(l => l.kategoriInsiden === 'Darurat Bencana').length;
    const cPelayanan = logsForKategori.filter(l => l.kategoriInsiden === 'Pelayanan Publik').length;

    btnContainer.innerHTML = `
      <button type="button" class="btn-filter-kategori ${currentKategoriFilter === 'all' ? 'active' : ''}" id="filter-kat-all" onclick="filterByKategori('all')" style="padding:3px 8px; border-radius:5px; border:1px solid transparent; background:${currentKategoriFilter === 'all' ? '#1E293B' : '#F8FAFC'}; color:${currentKategoriFilter === 'all' ? 'white' : '#64748B'}; font-size:10.5px; font-weight:700; cursor:pointer;">
        Semua Jenis <span class="badge-mini" style="background:${currentKategoriFilter === 'all' ? 'rgba(255,255,255,0.25)' : '#E2E8F0'}; color:${currentKategoriFilter === 'all' ? 'white' : '#475569'}; padding:1px 5px; border-radius:10px; margin-left:3px; font-size:9.5px;">${cAll}</span>
      </button>
      <button type="button" class="btn-filter-kategori ${currentKategoriFilter === 'Kriminalitas' ? 'active' : ''}" id="filter-kat-kriminal" onclick="filterByKategori('Kriminalitas')" style="padding:3px 8px; border-radius:5px; border:1px solid #E2E8F0; background:${currentKategoriFilter === 'Kriminalitas' ? '#1E293B' : '#F8FAFC'}; color:${currentKategoriFilter === 'Kriminalitas' ? 'white' : '#64748B'}; font-size:10.5px; font-weight:700; cursor:pointer;">
        ⚔️ Kriminalitas <span class="badge-mini" style="background:${currentKategoriFilter === 'Kriminalitas' ? 'rgba(255,255,255,0.25)' : '#E2E8F0'}; color:${currentKategoriFilter === 'Kriminalitas' ? 'white' : '#475569'}; padding:1px 5px; border-radius:10px; margin-left:3px; font-size:9.5px;">${cKrim}</span>
      </button>
      <button type="button" class="btn-filter-kategori ${currentKategoriFilter === 'Kamtibmas' ? 'active' : ''}" id="filter-kat-kamtibmas" onclick="filterByKategori('Kamtibmas')" style="padding:3px 8px; border-radius:5px; border:1px solid #E2E8F0; background:${currentKategoriFilter === 'Kamtibmas' ? '#1E293B' : '#F8FAFC'}; color:${currentKategoriFilter === 'Kamtibmas' ? 'white' : '#475569'}; font-size:10.5px; font-weight:700; cursor:pointer;">
        💥 Kamtibmas & Tawuran <span class="badge-mini" style="background:${currentKategoriFilter === 'Kamtibmas' ? 'rgba(255,255,255,0.25)' : '#E2E8F0'}; color:${currentKategoriFilter === 'Kamtibmas' ? 'white' : '#475569'}; padding:1px 5px; border-radius:10px; margin-left:3px; font-size:9.5px;">${cKamtib}</span>
      </button>
      <button type="button" class="btn-filter-kategori ${currentKategoriFilter === 'Laka Lantas' ? 'active' : ''}" id="filter-kat-laka" onclick="filterByKategori('Laka Lantas')" style="padding:3px 8px; border-radius:5px; border:1px solid #E2E8F0; background:${currentKategoriFilter === 'Laka Lantas' ? '#1E293B' : '#F8FAFC'}; color:${currentKategoriFilter === 'Laka Lantas' ? 'white' : '#64748B'}; font-size:10.5px; font-weight:700; cursor:pointer;">
        🚗 Laka Lantas <span class="badge-mini" style="background:${currentKategoriFilter === 'Laka Lantas' ? 'rgba(255,255,255,0.25)' : '#E2E8F0'}; color:${currentKategoriFilter === 'Laka Lantas' ? 'white' : '#475569'}; padding:1px 5px; border-radius:10px; margin-left:3px; font-size:9.5px;">${cLaka}</span>
      </button>
      <button type="button" class="btn-filter-kategori ${currentKategoriFilter === 'Darurat Bencana' ? 'active' : ''}" id="filter-kat-darurat" onclick="filterByKategori('Darurat Bencana')" style="padding:3px 8px; border-radius:5px; border:1px solid #E2E8F0; background:${currentKategoriFilter === 'Darurat Bencana' ? '#1E293B' : '#F8FAFC'}; color:${currentKategoriFilter === 'Darurat Bencana' ? 'white' : '#64748B'}; font-size:10.5px; font-weight:700; cursor:pointer;">
        🔥 Darurat & Bencana <span class="badge-mini" style="background:${currentKategoriFilter === 'Darurat Bencana' ? 'rgba(255,255,255,0.25)' : '#E2E8F0'}; color:${currentKategoriFilter === 'Darurat Bencana' ? 'white' : '#475569'}; padding:1px 5px; border-radius:10px; margin-left:3px; font-size:9.5px;">${cDarurat}</span>
      </button>
      <button type="button" class="btn-filter-kategori ${currentKategoriFilter === 'Pelayanan Publik' ? 'active' : ''}" id="filter-kat-pelayanan" onclick="filterByKategori('Pelayanan Publik')" style="padding:3px 8px; border-radius:5px; border:1px solid #E2E8F0; background:${currentKategoriFilter === 'Pelayanan Publik' ? '#1E293B' : '#F8FAFC'}; color:${currentKategoriFilter === 'Pelayanan Publik' ? 'white' : '#64748B'}; font-size:10.5px; font-weight:700; cursor:pointer;">
        🤝 Pelayanan Publik <span class="badge-mini" style="background:${currentKategoriFilter === 'Pelayanan Publik' ? 'rgba(255,255,255,0.25)' : '#E2E8F0'}; color:${currentKategoriFilter === 'Pelayanan Publik' ? 'white' : '#475569'}; padding:1px 5px; border-radius:10px; margin-left:3px; font-size:9.5px;">${cPelayanan}</span>
      </button>
    `;
  }
}

function filterByKategori(kategori) {
  currentKategoriFilter = kategori;
  renderFilterKategoriBar();
  updateResetFilterVisibility();
  openValidasiList(currentValidasiFilter, false);
}

function resetActiveFilters() {
  currentPlatformFilter = 'all';
  currentKategoriFilter = 'all';
  filterByPlatform('all');
  filterByKategori('all');
}

function updateResetFilterVisibility() {
  const rBtn = document.getElementById('btn-reset-filter');
  if (rBtn) {
    if (currentPlatformFilter !== 'all' || currentKategoriFilter !== 'all') {
      rBtn.style.display = 'inline-block';
    } else {
      rBtn.style.display = 'none';
    }
  }
}

function openValidasiWithPlatform(platform) {
  currentPlatformFilter = platform;
  filterByPlatform(platform);
  switchTab('view-validasi');
}

function openValidasiList(filter, doSwitch = true) {
  const urlParams = new URLSearchParams(window.location.search);
  const role = urlParams.get('role');
  const isPim = (role === 'pimpinan' || role === 'atasan' || role === 'pawas');

  if (!isPim) {
    // Anggota / Personel: Cegah membuka status milik pimpinan
    if (filter === 'menunggu' || filter === 'ditolak' || filter === 'selesai' || filter === 'disetujui') {
      const hasDiproses = appLogs.some(l => l.status === 'diproses');
      const hasPengesahan = appLogs.some(l => l.status === 'menunggu_pengesahan');
      if (hasDiproses) filter = 'diproses';
      else if (hasPengesahan) filter = 'menunggu_pengesahan';
      else filter = 'semua';
    }
  } else {
    if (filter === 'disetujui') filter = 'menunggu';
  }

  currentValidasiFilter = filter;
  const listContainer = document.getElementById('val-list-container');
  let html = '';

  // 1. Highlight tombol status tab yang aktif
  document.querySelectorAll('.val-tab-btn').forEach(btn => btn.classList.remove('active'));
  const activeTab = document.getElementById('val-tab-' + filter);
  if (activeTab) activeTab.classList.add('active');

  // 2. Filter log data berdasarkan Status, Platform Pelaporan, dan Jenis Pengaduan
  const activeUser = typeof getActiveSessionUser === 'function' ? getActiveSessionUser() : null;
  let filteredLogs;
  if (filter === 'semua') {
    filteredLogs = isPim
      ? appLogs
      : appLogs.filter(l => {
        if (activeUser && typeof isLogAssignedToUser === 'function' && !isLogAssignedToUser(l, activeUser)) return false;
        return l.status === 'diproses' || l.status === 'menunggu_pengesahan';
      });
  } else {
    filteredLogs = appLogs.filter(l => {
      if (!isPim && activeUser && typeof isLogAssignedToUser === 'function' && !isLogAssignedToUser(l, activeUser)) return false;
      return l.status === filter;
    });
  }

  if (currentPlatformFilter !== 'all') {
    filteredLogs = filteredLogs.filter(l => l.platform === currentPlatformFilter);
  }

  if (currentKategoriFilter !== 'all') {
    filteredLogs = filteredLogs.filter(l => l.kategoriInsiden === currentKategoriFilter);
  }

  if (filteredLogs.length === 0) {
    html = `
        <div style="text-align:center; padding:48px 24px; background:white; border-radius:12px; border:1px solid var(--border); width:100%; box-shadow:0 1px 3px rgba(0,0,0,0.03);">
          <div style="font-size:44px; margin-bottom:12px;">📭</div>
          <div style="font-weight:800; color:var(--text); font-size:15px;">Tidak Ada Data Laporan Ditemukan</div>
          <div style="font-size:12.5px; color:var(--text-muted); margin:6px auto 0; max-width:480px; line-height:1.5;">Tidak ada laporan pengaduan yang cocok dengan kombinasi status, platform, atau jenis pengaduan yang sedang aktif.</div>
          <button type="button" onclick="resetActiveFilters()" style="margin-top:16px; padding:8px 18px; background:var(--primary); color:white; border:none; border-radius:8px; font-size:12px; font-weight:700; cursor:pointer; box-shadow:0 2px 6px rgba(21,62,117,0.25); transition:0.2s;">
            🔄 Tampilkan Semua Laporan (Reset Filter)
          </button>
        </div>
      `;
  } else {
    filteredLogs.forEach(log => {
      let color = 'var(--text-muted)';
      let badgeInfo = '';

      if (log.status === 'menunggu') {
        color = 'var(--warning)';
      } else if (log.status === 'ditolak') {
        color = 'var(--danger)';
        badgeInfo = `
            <div style="margin-top:8px; background:#FEF2F2; border-left:3px solid var(--danger); padding:8px 10px; border-radius:4px; font-size:11px; color:#991B1B; line-height:1.4;">
              <strong>⚠️ Catatan Penolakan:</strong> ${log.alasanTolak || 'Laporan perlu direvisi oleh personel.'}
            </div>
          `;
      } else if (log.status === 'diproses') {
        color = 'var(--primary)';
        const tNames = ['', 'SPKT', 'Disposisi', 'Menuju Lokasi', 'Di TKP', 'Selesai'];
        badgeInfo = `
            <div style="margin-top:6px; font-size:11px; color:var(--primary); font-weight:600; display:flex; align-items:center; gap:4px;">
              <span>⚡ Status: Diproses (${tNames[log.tahap || 3] || 'Sedang Ditangani'})</span>
            </div>
          `;
      } else if (log.status === 'menunggu_pengesahan') {
        color = '#7C3AED';
        badgeInfo = `
            <div style="margin-top:6px; font-size:11px; color:#7C3AED; font-weight:700; display:flex; align-items:center; gap:4px;">
              <span>⏳ Status: Menunggu Pengesahan Pawas</span>
            </div>
          `;
      } else if (log.status === 'selesai') {
        color = '#047857';
        badgeInfo = `
            <div style="margin-top:6px; font-size:11px; color:var(--success); font-weight:600; display:flex; align-items:center; gap:4px;">
              <span>✓ Kasus Selesai Ditangani</span>
            </div>
          `;
      }

      let cardFooter = '';
      if (log.status === 'menunggu') {
        cardFooter = isUserPawas() ? `
            <div style="font-size:11px; color:#1E40AF; font-weight:700; display:flex; align-items:center; gap:4px; margin-top:8px;">
              <span>⚡</span> Disposisi Tugas ➔
            </div>
          ` : `
            <div style="font-size:11px; color:var(--primary); font-weight:600; display:flex; align-items:center; gap:4px; margin-top:8px;">
              <span>🔍</span> Klik untuk tinjau foto bukti & validasi ➔
            </div>
          `;
      } else if (log.status === 'menunggu_pengesahan') {
        cardFooter = isUserPawas() ? `
            <div style="font-size:11px; color:#7C3AED; font-weight:800; display:flex; align-items:center; gap:4px; margin-top:8px;">
              <span>✍️</span> Tinjau & Sahkan Kasus ➔
            </div>
          ` : `
            <div style="font-size:11px; color:#7C3AED; font-weight:700; display:flex; align-items:center; gap:4px; margin-top:8px;">
              <span>⏳</span> Menunggu Pengesahan Pawas ➔
            </div>
          `;
      } else if (log.status === 'diproses' || log.status === 'selesai') {
        cardFooter = isUserPawas() ? (
          log.status === 'selesai' ? `
              <div style="font-size:11px; color:#047857; font-weight:700; display:flex; align-items:center; gap:4px; margin-top:8px;">
                <span>✓</span> Berita Acara Disahkan & Ditutup Resmi (Pawas) ➔
              </div>
            ` : `
              <div style="font-size:11px; color:#1E40AF; font-weight:700; display:flex; align-items:center; gap:4px; margin-top:8px;">
                <span>⏱️</span> Konsol Kendali Pawas & Monitor Live SLA (< 10m) ➔
              </div>
            `
        ) : `
            <div style="font-size:11px; color:var(--primary); font-weight:600; display:flex; align-items:center; gap:4px; margin-top:8px;">
              <span>📍</span> Klik untuk lihat & update timeline pelacakan ➔
            </div>
          `;
      }

      // Saluran Platform Styling & Badges
      const platform = log.platform || 'warga';
      let platformBadge = '';
      let avatarBorder = '#93C5FD';
      let avatarIcon = '👤';
      let avatarIconBg = '#2563EB';
      let kontakMeta = `📞 ${log.noTelpPelapor || ''}`;

      if (platform === 'sos') {
        platformBadge = `
              <span style="font-size:9.5px; font-weight:800; padding:2px 7px; border-radius:4px; background:#FEF2F2; color:#DC2626; border:1px solid #FECACA; display:inline-flex; align-items:center; gap:3px;">
                🚨 SOS PANIC
              </span>
            `;
        avatarBorder = '#FCA5A5';
        avatarIcon = '🚨';
        avatarIconBg = '#DC2626';
        kontakMeta = `📞 ${log.noTelpPelapor || ''} • 🛰️ GPS: ${log.gpsCoords || ''}`;
      } else if (platform === 'warga') {
        platformBadge = `
              <span style="font-size:9.5px; font-weight:800; padding:2px 7px; border-radius:4px; background:#F0F9FF; color:#0284C7; border:1px solid #BAE6FD; display:inline-flex; align-items:center; gap:3px;">
                📱 PORTAL WARGA
              </span>
            `;
        avatarBorder = '#7DD3FC';
        avatarIcon = '📱';
        avatarIconBg = '#0284C7';
        kontakMeta = `📞 ${log.noTelpPelapor || ''} • 🪪 NIK: ${log.nikPelapor || ''}`;
      } else if (platform === 'layanan110') {
        platformBadge = `
              <span style="font-size:9.5px; font-weight:800; padding:2px 7px; border-radius:4px; background:#EFF6FF; color:#1D4ED8; border:1px solid #BFDBFE; display:inline-flex; align-items:center; gap:3px;">
                📞 LAYANAN 110
              </span>
            `;
        avatarBorder = '#93C5FD';
        avatarIcon = '📞';
        avatarIconBg = '#1D4ED8';
        kontakMeta = `📞 ${log.noTelpPelapor || ''} • 🎧 Call Center 110`;
      } else {
        platformBadge = `
              <span style="font-size:9.5px; font-weight:800; padding:2px 7px; border-radius:4px; background:#FEF3C7; color:#92400E; border:1px solid #FDE68A; display:inline-flex; align-items:center; gap:3px;">
                👮 PATROLI POLRI
              </span>
            `;
        avatarBorder = '#FCD34D';
        avatarIcon = '👮';
        avatarIconBg = '#D97706';
        kontakMeta = `👮 NRP: ${log.nrp || ''} • 🛡️ ${log.kesatuan || ''}`;
      }

      // Jenis Pengaduan / Giat Styling Badges
      const kat = log.kategoriInsiden || 'Kamtibmas';
      let katBadgeStyle = 'background:#FAF5FF; color:#7E22CE; border:1px solid #F3E8FF;';
      let katBadgeText = log.kategoriBadge || '💥 Kamtibmas & Tawuran';
      if (kat === 'Kriminalitas') {
        katBadgeStyle = 'background:#FFF1F2; color:#BE123C; border:1px solid #FFE4E6;';
        katBadgeText = log.kategoriBadge || '⚔️ Kriminalitas';
      } else if (kat === 'Laka Lantas') {
        katBadgeStyle = 'background:#FFFBEB; color:#B45309; border:1px solid #FEF3C7;';
        katBadgeText = log.kategoriBadge || '🚗 Laka Lantas';
      } else if (kat === 'Darurat Bencana') {
        katBadgeStyle = 'background:#FFF7ED; color:#C2410C; border:1px solid #FFEDD5;';
        katBadgeText = log.kategoriBadge || '🔥 Darurat Bencana';
      } else if (kat === 'Pelayanan Publik') {
        katBadgeStyle = 'background:#ECFDF5; color:#047857; border:1px solid #D1FAE5;';
        katBadgeText = log.kategoriBadge || '🤝 Pelayanan Publik';
      } else if (kat === 'PATROLI') {
        katBadgeStyle = 'background:#EFF6FF; color:#1D4ED8; border:1px solid #BFDBFE;';
        katBadgeText = log.kategoriBadge || '🚔 Patroli Wilayah';
      } else if (kat === 'SAMBANG') {
        katBadgeStyle = 'background:#ECFDF5; color:#047857; border:1px solid #A7F3D0;';
        katBadgeText = log.kategoriBadge || '🤝 Sambang Warga';
      } else if (kat === 'TPTKP') {
        katBadgeStyle = 'background:#FEF2F2; color:#DC2626; border:1px solid #FECACA;';
        katBadgeText = log.kategoriBadge || '🛡️ TPTKP';
      } else if (kat === 'PENGAMANAN') {
        katBadgeStyle = 'background:#FFFBEB; color:#B45309; border:1px solid #FDE68A;';
        katBadgeText = log.kategoriBadge || '⚠️ Pengamanan Jalur/Objek';
      }

      html += `
          <div class="val-card" id="card-log-${log.id}" onclick="selectLogCard(${log.id})">
            <!-- Header Kartu: Avatar Pelapor, Nama, Waktu, Status, Platform -->
            <div class="val-user" style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
              <div style="position:relative; flex-shrink:0;">
                <img src="${log.avatar}" style="width:40px; height:40px; border-radius:50%; object-fit:cover; border:2px solid ${avatarBorder}; display:block;">
                <span style="position:absolute; bottom:-3px; right:-3px; font-size:9px; background:${avatarIconBg}; color:white; border-radius:50%; width:16px; height:16px; display:flex; align-items:center; justify-content:center; border:1.5px solid white;">
                  ${avatarIcon}
                </span>
              </div>
              <div style="flex:1; min-width:0;">
                <div style="display:flex; justify-content:space-between; align-items:center; gap:6px;">
                  <div style="font-weight:700; font-size:13px; color:var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                    ${log.nama}
                  </div>
                  <div style="font-size:10px; color:var(--text-muted); flex-shrink:0;">${log.waktu}</div>
                </div>
                <div style="display:flex; align-items:center; justify-content:space-between; margin-top:2px;">
                  <div style="font-size:11px; color:${color}; font-weight:bold;">Status: ${log.statusText}</div>
                  ${platformBadge}
                </div>
              </div>
            </div>

            <!-- Baris Kombinasi: Jenis Pengaduan & Tingkat Urgensi -->
            <div style="display:flex; align-items:center; justify-content:space-between; gap:6px; margin-bottom:6px; flex-wrap:wrap;">
              <span style="font-size:9.5px; font-weight:800; padding:2px 7px; border-radius:4px; ${katBadgeStyle}">
                ${katBadgeText}
              </span>
              ${log.urgensi ? `<span style="font-size:9.5px; font-weight:800; padding:1.5px 6px; border-radius:4px; white-space:nowrap; background:${log.urgensi.includes('Darurat') ? '#FEE2E2' : (log.urgensi.includes('Sedang') ? '#FEF3C7' : '#EFF6FF')}; color:${log.urgensi.includes('Darurat') ? '#DC2626' : (log.urgensi.includes('Sedang') ? '#D97706' : '#1D4ED8')};">${log.urgensi}</span>` : ''}
            </div>

            <!-- Judul & Ringkasan Laporan -->
            <div style="display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:4px; gap:8px;">
              <div style="font-weight:700; font-size:12.5px; color:var(--text); line-height:1.35;">${log.title}</div>
            </div>
            <div class="val-text" style="margin-bottom:6px; line-height:1.45;">${log.deskripsi}</div>

            <!-- Metadata Lokasi, Kontak & Tiket -->
            <div style="font-size:10.5px; color:#64748B; background:#F8FAFC; border:1px solid #E2E8F0; border-radius:6px; padding:6px 8px; margin-bottom:6px; display:flex; flex-direction:column; gap:2px;">
              <div style="display:flex; align-items:center; gap:4px;">
                <span>📍</span> <span style="font-weight:600; color:#334155;">${log.lokasiKejadian || log.sektor}</span>
              </div>
              <div style="display:flex; align-items:center; justify-content:space-between; gap:6px; flex-wrap:wrap;">
                <span style="color:#475569;">${kontakMeta}</span>
                <span style="color:#64748B;">Tiket: <strong>${log.nomorTiket || 'TIKET-' + log.id}</strong></span>
              </div>
            </div>

            ${badgeInfo}
            ${cardFooter}
          </div>
        `;
    });
  }

  if (listContainer) listContainer.innerHTML = html;

  const detailBox = document.getElementById('val-detail-box');
  const msBox = document.getElementById('macro-milestone-box');

  // Otomatis pilih kartu pertama saat membuka tab jika ada data
  if (filteredLogs.length > 0) {
    if (detailBox) detailBox.style.display = 'block';
    if (msBox) msBox.style.display = 'block';
    if (listContainer) {
      listContainer.style.flex = '1.2';
      listContainer.style.width = 'auto';
    }
    selectLogCard(filteredLogs[0].id);
  } else {
    // Sembunyikan SELURUH panel detail kanan jika data kosong
    if (detailBox) detailBox.style.display = 'none';
    if (msBox) msBox.style.display = 'none';
    if (listContainer) {
      listContainer.style.flex = '1';
      listContainer.style.width = '100%';
    }
    const stdView = document.getElementById('detail-standard-view');
    const tlView = document.getElementById('detail-timeline-view');
    if (stdView) stdView.style.display = 'none';
    if (tlView) tlView.style.display = 'none';
  }

  // 3. Update judul/subtitle dengan total data yang ditampilkan
  const subtitle = document.getElementById('val-subtitle-text') || document.querySelector('#view-validasi .page-subtitle');
  if (subtitle) {
    const titles = {
      'semua': 'Semua Pengaduan',
      'menunggu': 'Menunggu Tindakan',
      'ditolak': 'Log Ditolak',
      'diproses': 'Sedang Ditangani',
      'selesai': 'Kasus Selesai'
    };
    subtitle.innerHTML = `Menampilkan: <strong>${filteredLogs.length} Data ${titles[filter] || ''}</strong>`;
  }

  // Sinkronkan seluruh badge angka
  updateRekapCounts();

  // Pindah ke tab validasi (hanya jika wizard tidak sedang aktif dan doSwitch bernilai true)
  const wizSec = document.getElementById('view-wizard');
  if (doSwitch && (!wizSec || !wizSec.classList.contains('active'))) {
    switchTab('view-validasi');
  }
}

let myChart1, myChart2, myChart3;

// ==================================
// CHART.JS INITIALIZATION (Screen 4 & Beranda)
// ==================================
function initCharts() {
  Chart.defaults.font.family = 'Inter';
  Chart.defaults.font.size = 10;
  Chart.defaults.plugins.legend.display = false;

  // Half-circle Gauges for Beranda
  const gaugeOpts = {
    type: 'doughnut',
    data: { datasets: [{ data: [92, 8], backgroundColor: ['#10B981', '#E2E8F0'], borderWidth: 0, circumference: 180, rotation: 270 }] },
    options: { maintainAspectRatio: false, cutout: '80%', plugins: { tooltip: { enabled: false } } }
  };
  const g1 = document.getElementById('gauge1');
  if (g1) new Chart(g1, gaugeOpts);

  const gSla = document.getElementById('gauge-sla-pimpinan');
  if (gSla) {
    new Chart(gSla, {
      type: 'doughnut',
      data: {
        datasets: [{
          data: [94.8, 5.2],
          backgroundColor: ['#15803D', '#E2E8F0'],
          borderWidth: 0,
          circumference: 360
        }]
      },
      options: {
        maintainAspectRatio: false,
        cutout: '75%',
        plugins: { tooltip: { enabled: false } }
      }
    });
  }

  const gaugeOpts2 = {
    type: 'doughnut',
    data: { datasets: [{ data: [92, 8], backgroundColor: ['#EF4444', '#E2E8F0'], borderWidth: 0, circumference: 180, rotation: 270 }] },
    options: { maintainAspectRatio: false, cutout: '80%', plugins: { tooltip: { enabled: false } } }
  };
  new Chart(document.getElementById('gauge2'), gaugeOpts2);

  // Chart 1: Distribusi Jenis Kegiatan (Pie)
  myChart1 = new Chart(document.getElementById('chart1'), {
    type: 'pie',
    data: {
      labels: ['Patroli', 'TPTKP', 'Sambang', 'Pengamanan'],
      datasets: [{ data: [40, 10, 30, 20], backgroundColor: ['#1D4ED8', '#EF4444', '#F59E0B', '#10B981'], borderWidth: 2, borderColor: '#fff' }]
    },
    options: { maintainAspectRatio: false, plugins: { legend: { display: true, position: 'bottom', labels: { boxWidth: 10 } } } }
  });

  // Chart 2: Status Validasi (Doughnut)
  myChart2 = new Chart(document.getElementById('chart2'), {
    type: 'doughnut',
    data: {
      labels: ['Disetujui', 'Menunggu', 'Ditolak'],
      datasets: [{ data: [38, 5, 2], backgroundColor: ['#10B981', '#F59E0B', '#EF4444'], borderWidth: 2, borderColor: '#fff' }]
    },
    options: { maintainAspectRatio: false, cutout: '60%', plugins: { legend: { display: true, position: 'bottom', labels: { boxWidth: 10 } } } }
  });

  // Chart 3: Tren Volume Kegiatan (Bar)
  myChart3 = new Chart(document.getElementById('chart3'), {
    type: 'bar',
    data: {
      labels: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
      datasets: [{ label: 'Jumlah Log', data: [8, 10, 5, 12, 15, 6, 4], backgroundColor: '#153E75', borderRadius: 4 }]
    },
    options: { maintainAspectRatio: false, scales: { y: { beginAtZero: true }, x: { grid: { display: false } } } }
  });

  // Panggil inisialisasi chart Pawas jika diakses pimpinan
  renderPimpinanExecutiveDashboard();
    initPawasKinerjaCharts();
}

// ==================================
// KINERJA AKUNTABILITAS PIKET PAWAS LOGIC
// ==================================
let myChartPawasSatuan, myChartPawasSla, myChartPawasJam;

function initPawasKinerjaCharts() {
  const elSatuan = document.getElementById('chart-pawas-satuan');
  if (elSatuan && !myChartPawasSatuan) {
    myChartPawasSatuan = new Chart(elSatuan, {
      type: 'doughnut',
      data: {
        labels: ['Samapta (R-4)', 'Perintis (R-2)', 'Lantas (R-4)', 'Opsnal / Resmob'],
        datasets: [{
          data: [19, 12, 9, 5],
          backgroundColor: ['#0284C7', '#D97706', '#1D4ED8', '#DC2626'],
          borderWidth: 2,
          borderColor: '#FFFFFF'
        }]
      },
      options: {
        maintainAspectRatio: false,
        cutout: '55%',
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: { boxWidth: 8, padding: 8, font: { size: 9.5 } }
          }
        }
      }
    });
  }

  const elSla = document.getElementById('chart-pawas-sla');
  if (elSla && !myChartPawasSla) {
    myChartPawasSla = new Chart(elSla, {
      type: 'doughnut',
      data: {
        labels: ['< 5 Mnt (Cepat)', '5-10 Mnt (Target)', '> 10 Mnt (Telat)'],
        datasets: [{
          data: [29, 14, 2],
          backgroundColor: ['#10B981', '#3B82F6', '#EF4444'],
          borderWidth: 2,
          borderColor: '#FFFFFF'
        }]
      },
      options: {
        maintainAspectRatio: false,
        cutout: '55%',
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: { boxWidth: 8, padding: 8, font: { size: 9.5 } }
          }
        }
      }
    });
  }

  const elJam = document.getElementById('chart-pawas-jam');
  if (elJam && !myChartPawasJam) {
    myChartPawasJam = new Chart(elJam, {
      type: 'bar',
      data: {
        labels: ['08:00 - 12:00', '12:00 - 16:00', '16:00 - 20:00', '20:00 - 24:00', '00:00 - 04:00', '04:00 - 08:00'],
        datasets: [{
          label: 'Jumlah Panggilan 110',
          data: [4, 6, 8, 14, 11, 2],
          backgroundColor: ['#153E75', '#153E75', '#153E75', '#EF4444', '#DC2626', '#94A3B8'],
          borderRadius: 4,
          maxBarThickness: 32
        }]
      },
      options: {
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true, grid: { color: '#F1F5F9' }, ticks: { font: { size: 10 } } },
          x: { grid: { display: false }, ticks: { font: { size: 10 } } }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
  }
}

function updateKinerjaPawasPeriod(period, el) {
  document.querySelectorAll('#laporan-pimpinan-container .tab-seg').forEach(tab => tab.classList.remove('active'));
  if (el) el.classList.add('active');

  const dateInput = document.getElementById('kinerja-date-pawas');

  if (period === 'harian') {
    if (dateInput) dateInput.type = 'date';
    const slaEl = document.getElementById('pawas-stat-sla');
    if (slaEl) slaEl.innerText = '7.4 Menit (94.8%)';
    const totEl = document.getElementById('pawas-stat-total');
    if (totEl) totEl.innerText = '45 (38 Tuntas di TKP)';

    if (myChartPawasSatuan) {
      myChartPawasSatuan.data.datasets[0].data = [19, 12, 9, 5];
      myChartPawasSatuan.update();
    }
    if (myChartPawasSla) {
      myChartPawasSla.data.datasets[0].data = [29, 14, 2];
      myChartPawasSla.update();
    }
    if (myChartPawasJam) {
      myChartPawasJam.data.labels = ['08:00 - 12:00', '12:00 - 16:00', '16:00 - 20:00', '20:00 - 24:00', '00:00 - 04:00', '04:00 - 08:00'];
      myChartPawasJam.data.datasets[0].data = [4, 6, 8, 14, 11, 2];
      myChartPawasJam.data.datasets[0].backgroundColor = ['#153E75', '#153E75', '#153E75', '#EF4444', '#DC2626', '#94A3B8'];
      myChartPawasJam.update();
    }
  } else if (period === 'mingguan') {
    if (dateInput) dateInput.type = 'week';
    const slaEl = document.getElementById('pawas-stat-sla');
    if (slaEl) slaEl.innerText = '7.1 Menit (95.9%)';
    const totEl = document.getElementById('pawas-stat-total');
    if (totEl) totEl.innerText = '295 (252 Tuntas di TKP)';

    if (myChartPawasSatuan) {
      myChartPawasSatuan.data.datasets[0].data = [125, 84, 58, 28];
      myChartPawasSatuan.update();
    }
    if (myChartPawasSla) {
      myChartPawasSla.data.datasets[0].data = [195, 88, 12];
      myChartPawasSla.update();
    }
    if (myChartPawasJam) {
      myChartPawasJam.data.labels = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
      myChartPawasJam.data.datasets[0].data = [38, 42, 35, 45, 52, 48, 35];
      myChartPawasJam.data.datasets[0].backgroundColor = ['#153E75', '#153E75', '#153E75', '#153E75', '#EF4444', '#EF4444', '#153E75'];
      myChartPawasJam.update();
    }
  } else if (period === 'bulanan') {
    if (dateInput) dateInput.type = 'month';
    const slaEl = document.getElementById('pawas-stat-sla');
    if (slaEl) slaEl.innerText = '6.9 Menit (96.4%)';
    const totEl = document.getElementById('pawas-stat-total');
    if (totEl) totEl.innerText = '1.229 (1.058 Tuntas)';

    if (myChartPawasSatuan) {
      myChartPawasSatuan.data.datasets[0].data = [520, 340, 245, 124];
      myChartPawasSatuan.update();
    }
    if (myChartPawasSla) {
      myChartPawasSla.data.datasets[0].data = [820, 365, 44];
      myChartPawasSla.update();
    }
    if (myChartPawasJam) {
      myChartPawasJam.data.labels = ['Minggu 1', 'Minggu 2', 'Minggu 3', 'Minggu 4'];
      myChartPawasJam.data.datasets[0].data = [295, 310, 305, 319];
      myChartPawasJam.data.datasets[0].backgroundColor = ['#153E75', '#153E75', '#153E75', '#153E75'];
      myChartPawasJam.update();
    }
  }
}

function renderPawasInsidenTable() {
  const tbody = document.getElementById('pawas-table-insiden-body');
  if (!tbody) return;

  const dataInsiden = [
    {
      tiket: 'TIKET-110-01X2F',
      waktu: '10:15 WIB',
      judul: 'Tawuran Pelajar Membawa Senjata Tajam',
      tkp: 'Jl. Panglima Polim Raya No. 42, Kebayoran Baru',
      satuan: '🚔 Patroli Samapta 110-D (Aiptu Herman)',
      sla: '6m 40s',
      status: '🟢 Tuntas di TKP',
      statusColor: '#15803D',
      statusBg: '#DCFCE7'
    },
    {
      tiket: 'TIKET-110-02X2F',
      waktu: '11:20 WIB',
      judul: 'Balap Liar & Gangguan Knalpot Brong',
      tkp: 'Flyover Jl. Jend. Sudirman, Setiabudi',
      satuan: '🚔 Patroli Samapta 110-B (Aipda Ridwan)',
      sla: '7m 15s',
      status: '🟢 Pembubaran Kondusif',
      statusColor: '#15803D',
      statusBg: '#DCFCE7'
    },
    {
      tiket: 'TIKET-110-03X2F',
      waktu: '12:45 WIB',
      judul: 'Laka Lantas Beruntun Minibus vs Sedan',
      tkp: 'Flyover Semanggi Arah Barat',
      satuan: '🚓 Turjawali Lantas 01 (Aiptu Bambang)',
      sla: '5m 50s',
      status: '🟡 Dilimpahkan Unit Laka',
      statusColor: '#B45309',
      statusBg: '#FEF3C7'
    },
    {
      tiket: 'TIKET-110-04X2F',
      waktu: '14:10 WIB',
      judul: 'Percobaan Curanmor Roda 2 di Area Parkir',
      tkp: 'Kawasan Pertokoan Pasar Mayestik',
      satuan: '🏍️ Tim Perintis Alpha (Briptu Dian)',
      sla: '8m 20s',
      status: '🟢 Pelaku Diamankan ke Polsek',
      statusColor: '#15803D',
      statusBg: '#DCFCE7'
    },
    {
      tiket: 'TIKET-110-05X2F',
      waktu: '16:30 WIB',
      judul: 'Kemacetan Total Akibat Truk Mogok',
      tkp: 'Bundaran Senayan Pintu 1 Gelora',
      satuan: '🚓 Turjawali Lantas 02 (Bripka Hendra)',
      sla: '4m 30s',
      status: '🟢 Evakuasi & Jalur Lancar',
      statusColor: '#15803D',
      statusBg: '#DCFCE7'
    }
  ];

  tbody.innerHTML = dataInsiden.map((item, idx) => `
        <tr style="border-bottom:1px solid #F1F5F9; ${idx % 2 === 1 ? 'background:#F8FAFC;' : ''}">
          <td style="padding:10px 12px; font-weight:800; font-family:monospace; color:#1E3A8A;">
            ${item.tiket}
          </td>
          <td style="padding:10px 12px; font-weight:600; color:#475569;">
            ${item.waktu}
          </td>
          <td style="padding:10px 12px;">
            <div style="font-weight:700; color:#0F172A; margin-bottom:2px;">${item.judul}</div>
            <div style="font-size:11px; color:#64748B;">📍 ${item.tkp}</div>
          </td>
          <td style="padding:10px 12px; font-weight:600; color:#1E293B;">
            ${item.satuan}
          </td>
          <td style="padding:10px 12px;">
            <span style="font-weight:800; color:#15803D; background:#DCFCE7; padding:2px 6px; border-radius:4px;">
              ⚡ ${item.sla}
            </span>
          </td>
          <td style="padding:10px 12px;">
            <span style="font-weight:700; color:${item.statusColor}; background:${item.statusBg}; padding:3px 8px; border-radius:4px; font-size:11px;">
              ${item.status}
            </span>
          </td>
        </tr>
      `).join('');
}

function bukaModalCetakLaporanPawas() {
  sinkronisasiDokumenPawas();
  const modal = document.getElementById('modal-cetak-laporan-pawas');
  if (modal) modal.style.display = 'flex';
}

function tutupModalCetakLaporanPawas() {
  const modal = document.getElementById('modal-cetak-laporan-pawas');
  if (modal) modal.style.display = 'none';
}

// Sinkronisasi data dinamis operasional riil ke lembar dokumen dinas Pawas
function sinkronisasiDokumenPawas() {
  try {
    const totalPanggilan = typeof appLogs !== 'undefined' ? appLogs.length : 0;
    const totalSelesai = typeof appLogs !== 'undefined' ? appLogs.filter(l => l.status === 'selesai').length : 0;
    const totalAktif = typeof appLogs !== 'undefined' ? appLogs.filter(l => l.status === 'diproses' || l.status === 'menunggu_pengesahan').length : 0;
    const totalTunggu = typeof appLogs !== 'undefined' ? appLogs.filter(l => l.status === 'menunggu').length : 0;

    const rekapEl = document.getElementById('doc-pawas-rekap-text');
    if (rekapEl) {
      const persentase = totalPanggilan > 0 ? ((totalSelesai / totalPanggilan) * 100).toFixed(1) : '0.0';
      rekapEl.innerHTML = `
            Selama 1x24 jam dinas piket, Pusat Kendali Operasi 110 telah menerima dan mengendalikan akumulasi <strong>${totalPanggilan} Panggilan Pengaduan Warga</strong>. 
            Rata-rata kecepatan tiba di TKP (<em>Quick Response Time</em>) tercatat <strong>7.4 Menit</strong> dengan tingkat kepatuhan standar SLA Mabes Polri (&lt; 10 Menit) mencapai <strong>94.8%</strong>. 
            Sebanyak <strong>${totalSelesai} insiden (${persentase}%)</strong> berhasil dituntaskan langsung di TKP melalui tindakan kepolisian Presisi, <strong>${totalAktif} kasus</strong> dalam proses penyidikan/pelimpahan unit fungsi teknis, dan <strong>${totalTunggu} panggilan</strong> dalam pemantauan verifikasi Pawas.
          `;
    }

    const activeUser = typeof getActiveSessionUser === 'function' ? getActiveSessionUser() : null;
    const isPim = activeUser && (activeUser.role === 'pimpinan' || activeUser.role === 'pawas' || activeUser.role === 'atasan');
    const pawasNama = isPim ? (activeUser.nama || '') : '';
    const pawasPangkat = isPim ? (activeUser.pangkat || 'KOMISARIS BESAR POLISI') : '';
    const pawasNrp = isPim ? (activeUser.nrp || '') : '';

    const elPawasNama = document.getElementById('doc-pawas-pejabat-nama');
    if (elPawasNama) elPawasNama.innerText = pawasNama ? (pawasNama.toUpperCase() + (activeUser?.gelar ? ', ' + activeUser.gelar : '')) : '';

    const elPawasPangkat = document.getElementById('doc-pawas-pejabat-pangkat-nrp');
    if (elPawasPangkat) elPawasPangkat.innerText = (pawasPangkat || pawasNrp) ? `${pawasPangkat} NRP ${pawasNrp}`.trim() : '';

    const elStamp = document.getElementById('doc-pawas-stamp-text');
    if (elStamp) elStamp.innerHTML = pawasNama ? `[ TERVERIFIKASI DIGITAL ]<br>${pawasNama.toUpperCase()}` : '[ TERVERIFIKASI DIGITAL ]';

    const elTgl = document.getElementById('doc-pawas-tgl-cetak');
    if (elTgl) {
      const d = new Date();
      const bln = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'][d.getMonth()];
      elTgl.innerText = `Jakarta, ${d.getDate()} ${bln} ${d.getFullYear()}`;
    }

    const menonjolEl = document.getElementById('doc-pawas-menonjol-list');
    if (menonjolEl && typeof appLogs !== 'undefined') {
      const urgentLogs = appLogs.filter(l => (l.urgensi && (l.urgensi.includes('Tinggi') || l.urgensi.includes('Darurat'))) || (l.title && (l.title.includes('Tawuran') || l.title.includes('Balap') || l.title.includes('Kecelakaan') || l.title.includes('Curanmor')))).slice(0, 3);
      if (urgentLogs.length > 0) {
        menonjolEl.innerHTML = urgentLogs.map((log, idx) => {
          return `${idx + 1}. <strong>${log.title} (${log.waktu || 'WIB'}):</strong> Respon ${log.sla || '6m 40s'} oleh ${log.satuanPetugas || log.assignedNama || 'Patroli Presisi'}. Penanganan: ${log.status === 'selesai' ? 'Tuntas terkendali di TKP' : 'Tindakan pertama dan pengamanan mako'}, nomor tiket resmi <code>${log.nomorTiket || ('TIKET-110-' + log.id)}</code>.<br>`;
        }).join('');
      } else {
        menonjolEl.innerHTML = '<em>Tidak ada insiden menonjol selama masa dinas piket. Situasi kamtibmas terpantau aman dan kondusif.</em>';
      }
    }
  } catch (err) {
    console.warn('Sinkronisasi dokumen pawas fallback:', err);
  }
}

function cetakLaporanPawasPDF() {
  sinkronisasiDokumenPawas();
  const docEl = document.getElementById('dokumen-cetak-pawas');
  if (!docEl) {
    window.print();
    return;
  }

  // Buat frame cetak terisolasi agar murni dokumen kedinasan tanpa elemen UI/scroll
  let printFrame = document.getElementById('iframe-cetak-pawas');
  if (!printFrame) {
    printFrame = document.createElement('iframe');
    printFrame.id = 'iframe-cetak-pawas';
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);
  }

  const fDoc = printFrame.contentWindow.document;
  fDoc.open();
  // Inisialisasi dokumen tanpa tag literal penutup agar aman dari injeksi live-server
  fDoc.write('<' + '!DOCTYPE html><html lang="id"><head><title>Laporan Hasil Pelaksanaan Tugas Pawas - Polres Metro Jakarta Pusat</' + 'title></' + 'head><body></' + 'body></' + 'html>');
  fDoc.close();

  const fStyle = fDoc.createElement('style');
  fStyle.textContent = `
        @page {
          size: portrait;
          margin: 8mm 10mm;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        html, body {
          background: #FFFFFF !important;
          color: #000000 !important;
          font-family: 'Times New Roman', Times, serif !important;
          font-size: 9.5pt !important;
          line-height: 1.32 !important;
          margin: 0 auto !important;
          padding: 4mm 8mm !important;
          max-width: 185mm !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .kop-surat {
          border-bottom: 2px double #000000 !important;
          padding-bottom: 6px !important;
          margin-bottom: 10px !important;
        }
        .kop-surat * {
          line-height: 1.18 !important;
        }
        .kop-text-1 {
          font-size: 11pt !important;
          font-weight: bold !important;
        }
        .kop-text-2 {
          font-size: 12pt !important;
          font-weight: bold !important;
        }
        .kop-text-addr {
          font-size: 8.5pt !important;
        }
        .judul-laporan-box {
          margin-bottom: 12px !important;
          text-align: center;
        }
        .judul-laporan-main {
          font-size: 11.5pt !important;
          font-weight: bold !important;
          text-decoration: underline !important;
        }
        .judul-laporan-sub {
          font-size: 9.5pt !important;
          font-weight: bold !important;
          margin-top: 2px !important;
        }
        .judul-laporan-date {
          font-size: 8.5pt !important;
          font-style: italic !important;
          margin-top: 2px !important;
        }
        .sec-block {
          margin-bottom: 8px !important;
          page-break-inside: avoid;
          break-inside: avoid;
        }
        .sec-title {
          font-weight: bold;
          font-size: 9.5pt !important;
          margin-bottom: 2px !important;
        }
        .sec-content {
          padding-left: 14px !important;
          text-align: justify;
          font-size: 9pt !important;
          line-height: 1.3 !important;
        }
        .sig-block {
          margin-top: 10px !important;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          page-break-inside: avoid;
          break-inside: avoid;
        }
        .tembusan {
          font-size: 8pt !important;
          line-height: 1.25 !important;
        }
        .sig-box {
          text-align: center;
          min-width: 200px;
          font-size: 8.5pt !important;
          line-height: 1.25 !important;
        }
        .stamp-badge {
          height: 38px !important;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #153E75;
          font-size: 8.5pt !important;
          font-weight: bold;
          border: 1px dashed #94A3B8;
          margin: 4px auto !important;
          width: 150px !important;
          border-radius: 4px;
          background: #F8FAFC;
        }
      `;
  fDoc.head.appendChild(fStyle);
  fDoc.body.innerHTML = docEl.innerHTML;

  setTimeout(() => {
    printFrame.contentWindow.focus();
    printFrame.contentWindow.print();
  }, 250);
}

// ==================================
// KINERJA TAB LOGIC (ANGGOTA)
// ==================================
function updateKinerjaTab(period, el) {
  // Update active tab styling
  document.querySelectorAll('#view-laporan .tab-seg').forEach(tab => tab.classList.remove('active'));
  el.classList.add('active');

  // Update date picker type based on period
  const dateInput = document.getElementById('kinerja-date');

  if (period === 'harian') {
    dateInput.type = 'date';

    // Calculate 6 days before + today for dynamic labels
    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const today = new Date();
    const labelsHarian = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      labelsHarian.push(days[d.getDay()]);
    }

    // Update charts for Harian (7 Hari Terakhir)
    myChart1.data.datasets[0].data = [4, 1, 3, 2];
    myChart2.data.datasets[0].data = [8, 2, 0];
    myChart3.data.labels = labelsHarian;
    myChart3.data.datasets[0].data = [8, 10, 5, 12, 15, 6, 4];

    // Update text stats
        const curU = typeof getActiveSessionUser === 'function' ? getActiveSessionUser() : null;
    const uLogsList = (typeof appLogs !== 'undefined')
      ? ((curU && curU.role !== 'pimpinan') ? appLogs.filter(l => typeof isLogAssignedToUser === 'function' ? isLogAssignedToUser(l, curU) : true) : appLogs)
      : [];
    const totLog = uLogsList.length;
    const accLog = uLogsList.filter(l => l.status === 'selesai').length;
    const waitLog = uLogsList.filter(l => l.status === 'diproses' || l.status === 'menunggu' || l.status === 'menunggu_pengesahan').length;
    const rejLog = uLogsList.filter(l => l.status === 'ditolak').length;

    if (document.getElementById('stat-total')) document.getElementById('stat-total').innerText = totLog;
    if (document.getElementById('stat-acc')) document.getElementById('stat-acc').innerText = accLog;
    if (document.getElementById('stat-wait')) document.getElementById('stat-wait').innerText = waitLog;
    if (document.getElementById('stat-rej')) document.getElementById('stat-rej').innerText = rejLog;

  } else if (period === 'mingguan') {
    dateInput.type = 'week';

    // Calculate 11 weeks before + this week for dynamic labels
    const today = new Date();
    const getISOWeek = (date) => {
      const d = new Date(date.getTime());
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
      const w1 = new Date(d.getFullYear(), 0, 4);
      return 1 + Math.round(((d.getTime() - w1.getTime()) / 86400000 - 3 + (w1.getDay() + 6) % 7) / 7);
    };

    const labelsMingguan = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - (i * 7));
      labelsMingguan.push('W' + getISOWeek(d));
    }

    // Update charts for Mingguan (12 Minggu Terakhir)
    myChart1.data.datasets[0].data = [28, 5, 15, 12];
    myChart2.data.datasets[0].data = [50, 8, 2];
    myChart3.data.labels = labelsMingguan;
    myChart3.data.datasets[0].data = [45, 50, 42, 60, 55, 65, 58, 62, 70, 68, 75, 80];

    // Update text stats
    document.getElementById('stat-total').innerText = '60';
    document.getElementById('stat-acc').innerText = '50';
    document.getElementById('stat-wait').innerText = '8';
    document.getElementById('stat-rej').innerText = '2';

  } else if (period === 'bulanan') {
    dateInput.type = 'month';

    // Calculate 11 months before + this month for dynamic labels
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
    const today = new Date();
    const labelsBulanan = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const yearSuffix = d.getFullYear().toString().slice(-2);
      labelsBulanan.push(`${months[d.getMonth()]} '${yearSuffix}`);
    }

    // Update charts for Bulanan (12 Bulan Terakhir)
    myChart1.data.datasets[0].data = [120, 20, 60, 50];
    myChart2.data.datasets[0].data = [220, 15, 15];
    myChart3.data.labels = labelsBulanan;
    myChart3.data.datasets[0].data = [200, 210, 190, 240, 260, 250, 270, 280, 300, 310, 320, 330];

    // Update text stats
    document.getElementById('stat-total').innerText = '250';
    document.getElementById('stat-acc').innerText = '220';
    document.getElementById('stat-wait').innerText = '15';
    document.getElementById('stat-rej').innerText = '15';
  }

  // Animate charts update
  myChart1.update();
  myChart2.update();
  myChart3.update();
}

// ==================================
// ROLE-BASED UI LOGIC
// ==================================
window.addEventListener('DOMContentLoaded', () => {
  updateRekapCounts();
  const urlParams = new URLSearchParams(window.location.search);
  const role = urlParams.get('role');

  if (role === 'pimpinan' || role === 'atasan' || role === 'pawas') {
    // Pimpinan / Pawas: Konsol Eksekutif & Komando Pawas
    const tl = document.getElementById('tindak-lanjut-card'); if (tl) tl.style.display = 'none';
    const kpi = document.getElementById('kpi-card'); if (kpi) kpi.style.display = 'none';
    const actPers = document.getElementById('aktivitas-personel-card'); if (actPers) actPers.style.display = 'none';

    // Tampilkan elemen-elemen eksklusif Pimpinan di Beranda
    const alertInc = document.getElementById('pimpinan-breaking-alert'); if (alertInc) alertInc.style.display = 'block';
    const actPim = document.getElementById('aktivitas-pimpinan-card'); if (actPim) actPim.style.display = 'block';
    const execSide = document.getElementById('pimpinan-executive-sidebar'); if (execSide) execSide.style.display = 'block';
    const mapBadges = document.getElementById('pimpinan-map-badges'); if (mapBadges) mapBadges.style.display = 'flex';
    const mapTitle = document.getElementById('map-card-title'); if (mapTitle) mapTitle.innerText = 'Peta Sebaran Unit Patroli & Titik Rawan Kamtibmas';
    const mapLeg = document.getElementById('map-legend-mini');
    if (mapLeg) {
      mapLeg.innerHTML = `
            <span style="font-size:11px; font-weight:700; color:#153E75;">🚔 Samapta R-4</span>
            <span style="color:#CBD5E1; margin:0 2px;">•</span>
            <span style="font-size:11px; font-weight:700; color:#B45309;">🏍️ Perintis R-2</span>
            <span style="color:#CBD5E1; margin:0 2px;">•</span>
            <span style="font-size:11px; font-weight:700; color:#1D4ED8;">🚓 Lantas R-4</span>
            <span style="color:#CBD5E1; margin:0 2px;">•</span>
            <span style="font-size:11px; font-weight:700; color:#DC2626;">🔴 3 Titik Rawan</span>
          `;
    }

    const activeUserPim = typeof getActiveSessionUser === 'function' ? getActiveSessionUser() : null; const un = document.getElementById('user-name'); if (un) un.innerText = (activeUserPim && (activeUserPim.role === 'pimpinan' || activeUserPim.role === 'pawas')) ? (activeUserPim.namaSingkat || activeUserPim.nama) : '';
    const ur = document.getElementById('user-role'); if (ur) ur.innerText = 'Perwira Pengawas (PAWAS)';
    updateStatusDinasHeader();

    // 1. Pastikan tab 1 tetap Beranda (Posko Kendali Pawas)
    const bottomNavItems = document.querySelectorAll('.bottom-nav .nav-item');
    if (bottomNavItems.length > 0) {
      const firstNav = bottomNavItems[0];
      firstNav.setAttribute('onclick', "switchTab('view-beranda', this)");
      const iconSpan = firstNav.querySelector('.nav-icon');
      if (iconSpan) iconSpan.innerText = '🏠';
      const textSpan = firstNav.querySelector('span:not(.nav-icon)');
      if (textSpan) textSpan.innerText = 'Beranda';
    }

    // 2. Alihfungsikan slot tombol ke-3 (#nav-log) menjadi tab khusus Komando Pawas
    const navLog = document.getElementById('nav-log');
    if (navLog) {
      navLog.style.display = '';
      navLog.setAttribute('onclick', "switchTab('view-validasi', this)");
      const iconSpan = navLog.querySelector('.nav-icon');
      if (iconSpan) iconSpan.innerText = '👨‍✈️';
      const textSpan = navLog.querySelector('span:not(.nav-icon)');
      if (textSpan) textSpan.innerText = 'Komando Pawas';
    }

    // Inisialisasi daftar antrean Komando Pawas di latar belakang tanpa langsung memindahkan tab
    openValidasiList('menunggu', false);

    // Aktifkan tampilan Laporan Akuntabilitas Kinerja Pawas
    const lapPim = document.getElementById('laporan-pimpinan-container');
    const lapAng = document.getElementById('laporan-anggota-container');
    if (lapPim) lapPim.style.display = 'block';
    if (lapAng) lapAng.style.display = 'none';
    renderPimpinanExecutiveDashboard();
    initPawasKinerjaCharts();
    renderPawasInsidenTable();

    // Default pendaratan Pimpinan / Pawas di Beranda (Executive Overview Pimpinan)
    switchTab('view-beranda');
  } else if (role === 'operator') {
    // Operator SPKT: Tampil seragam di dalam E-Tribrata Log
    const activeUser = typeof getActiveSessionUser === 'function' ? getActiveSessionUser() : null; const un = document.getElementById('user-name'); if (un) un.innerText = (activeUser && activeUser.role === 'operator') ? (activeUser.namaSingkat || activeUser.nama) : ''; const opLbl = document.getElementById('eb-operator-petugas-label'); if (opLbl) opLbl.innerText = (activeUser && activeUser.role === 'operator') ? (activeUser.nama + ' (NRP ' + activeUser.nrp + ')') : '';
    const ur = document.getElementById('user-role'); if (ur) ur.innerText = 'Operator SPKT';
    const avatarTop = document.getElementById('user-avatar-top'); if (avatarTop) avatarTop.src = 'assets/images/polri_pengaduan_tkp.jpg';
    updateStatusDinasHeader();

    const tl = document.getElementById('tindak-lanjut-card'); if (tl) tl.style.display = 'none';
    const navLog = document.getElementById('nav-log'); if (navLog) navLog.style.display = 'none';

    // Sembunyikan tombol header & navigasi yang tidak diperlukan Operator
    const btnOpHead = document.getElementById('btn-operator-head'); if (btnOpHead) btnOpHead.style.display = 'none';
    const bell = document.getElementById('bell-notif'); if (bell) bell.style.display = 'none';
    const backBtn = document.getElementById('op-back-btn'); if (backBtn) backBtn.style.display = 'none';

    // Sembunyikan bottom navigation bar untuk Operator SPKT (tidak perlu berpindah tugas lapangan)
    const bottomNav = document.querySelector('.bottom-nav');
    if (bottomNav) bottomNav.style.display = 'none';

    switchTab('view-operator');
  } else {
    // Anggota (Personel Lapangan)
    const activeUser = typeof getActiveSessionUser === 'function' ? getActiveSessionUser() : null;
    const un = document.getElementById('user-name');
    const ur = document.getElementById('user-role');
    const avatarTop = document.getElementById('user-avatar-top');
    if (activeUser) {
      if (un) un.innerText = activeUser.namaSingkat || activeUser.nama;
      if (ur) ur.innerText = 'NRP: ' + activeUser.nrp;
      if (avatarTop && activeUser.avatar) avatarTop.src = activeUser.avatar;
    } else {
      if (avatarTop) avatarTop.src = 'assets/images/polri_pengaduan_tkp.jpg';
    }
    const bell = document.getElementById('bell-notif'); if (bell) bell.style.display = 'none';
    // Inisialisasi antrean tugas personel lapangan
    openValidasiList('diproses', false);
  }

  // Inisialisasi profil pengguna sesuai role aktif
  syncProfileData(role);

  // Periksa notifikasi darurat broadcast satuan (jika ada tiket yang didisposisikan ke satuan ini)
  setTimeout(() => {
    if (typeof cekNotifikasiBroadcastSatuan === 'function') {
      cekNotifikasiBroadcastSatuan();
    }
  }, 400);
});

// Sinkronisasi data log standar lintas tab secara real-time
window.addEventListener('storage', (e) => {
  if (e.key === 'simapres_app_logs_v1') {
    loadLogsFromStorage();
    updateRekapCounts();
    if (selectedLogId) {
      displayLogDetail(selectedLogId);
    }
    if (typeof currentValidasiFilter !== 'undefined') {
      openValidasiList(currentValidasiFilter, false);
    }
    // Periksa apakah perubahan log memicu broadcast notifikasi satuan
    if (typeof cekNotifikasiBroadcastSatuan === 'function') {
      cekNotifikasiBroadcastSatuan();
    }
  }
});

// ==================================
// PROFIL PERSONEL & LOGOUT LOGIC
// ==================================
let lastActiveViewBeforeProfile = 'view-beranda';

function syncProfileData(targetRole) {
  const activeUser = typeof getActiveSessionUser === 'function' ? getActiveSessionUser() : null;
  const elNama = document.getElementById('profil-user-nama');
  const elNrp = document.getElementById('profil-user-nrp');
  const elAvatar = document.getElementById('profil-user-avatar');
  const elPangkat = document.getElementById('profil-user-pangkat');
  const elJabatan = document.getElementById('profil-user-jabatan');
  const elBadge = document.getElementById('profil-badge-role');
  const elGolongan = document.getElementById('profil-user-golongan');
  const elAlkom = document.getElementById('profil-inv-alkom');
  const elRanmor = document.getElementById('profil-inv-ranmor');
  const elGadget = document.getElementById('profil-inv-gadget');
  const elSenpi = document.getElementById('profil-inv-senpi');

  if (activeUser) {
    if (elNama) elNama.innerText = activeUser.nama || '';
    if (elNrp) elNrp.innerText = activeUser.nrp ? 'NRP: ' + activeUser.nrp : '';
    if (elAvatar) elAvatar.src = activeUser.avatar || 'assets/images/polri_pengaduan_tkp.jpg';
    if (elPangkat) elPangkat.innerText = activeUser.pangkat || '';
    if (elJabatan) elJabatan.innerText = activeUser.jabatan || '';
    if (elBadge) {
      if (activeUser.role === 'pimpinan' || activeUser.role === 'pawas' || activeUser.role === 'atasan') {
        elBadge.innerText = 'PIMPINAN / PAWAS';
        elBadge.style.background = '#FFFBEB';
        elBadge.style.color = '#B45309';
      } else if (activeUser.role === 'operator') {
        elBadge.innerText = 'OPERATOR SPKT';
        elBadge.style.background = '#EFF6FF';
        elBadge.style.color = '#1D4ED8';
      } else {
        elBadge.innerText = 'ANGGOTA PATROLI';
        elBadge.style.background = '#F0FDF4';
        elBadge.style.color = '#15803D';
      }
    }
    if (elGolongan) elGolongan.innerText = activeUser.golongan || '';
    if (elAlkom) elAlkom.innerText = activeUser.alkom || '';
    if (elRanmor) elRanmor.innerText = activeUser.ranmor || '';
    if (elGadget) elGadget.innerText = activeUser.gadget || '';
    if (elSenpi) elSenpi.innerText = activeUser.senpi || '';
  } else {
    if (elNama) elNama.innerText = '';
    if (elNrp) elNrp.innerText = '';
    if (elPangkat) elPangkat.innerText = '';
    if (elJabatan) elJabatan.innerText = '';
    if (elGolongan) elGolongan.innerText = '';
    if (elAlkom) elAlkom.innerText = '';
    if (elRanmor) elRanmor.innerText = '';
    if (elGadget) elGadget.innerText = '';
    if (elSenpi) elSenpi.innerText = '';
  }

  // Metrik KTA Digital Dinamis
  const uLogs = (typeof appLogs !== 'undefined')
    ? ((activeUser && activeUser.role !== 'pimpinan')
        ? appLogs.filter(l => typeof isLogAssignedToUser === 'function' ? isLogAssignedToUser(l, activeUser) : true)
        : appLogs)
    : [];
  const elKtaTot = document.getElementById('profil-stat-total');
  if (elKtaTot) elKtaTot.innerText = uLogs.length;

  const uSelesai = uLogs.filter(l => l.status === 'selesai').length;
  const elKtaSel = document.getElementById('profil-stat-selesai');
  if (elKtaSel) elKtaSel.innerText = uSelesai;

  const elKtaSla = document.getElementById('profil-stat-sla');
  if (elKtaSla) elKtaSla.innerText = uLogs.length > 0 ? (((uSelesai || 1) / uLogs.length) * 100).toFixed(1) + '%' : '96.4%';

  // Presensi State Management per User
  if (activeUser) {
    const presensiKey = 'simapres_presensi_' + activeUser.nrp;
    const savedPresensi = sessionStorage.getItem(presensiKey);
    const elJamMasuk = document.getElementById('profil-presensi-jam-masuk');
    const elJamPulang = document.getElementById('profil-presensi-jam-pulang');
    const elStatusPresensi = document.getElementById('profil-presensi-status-text');
    let isDinas = false;
    if (savedPresensi) {
      try {
        const pData = JSON.parse(savedPresensi);
        if (elJamMasuk && pData.masuk) elJamMasuk.innerText = pData.masuk + ' WIB (Tervalidasi)';
        if (elJamPulang && pData.pulang) elJamPulang.innerText = pData.pulang + ' WIB (Lepas Piket)';
        else if (elJamPulang) elJamPulang.innerText = 'Belum Presensi Pulang';

        if (pData.masuk && !pData.pulang) {
          isDinas = true;
          if (elStatusPresensi) {
            elStatusPresensi.innerHTML = '● Sudah Masuk Dinas';
            elStatusPresensi.style.color = '#15803D';
            elStatusPresensi.style.background = '#DCFCE7';
          }
        } else if (pData.pulang) {
          if (elStatusPresensi) {
            elStatusPresensi.innerHTML = '● Selesai Dinas (Lepas Piket)';
            elStatusPresensi.style.color = '#475569';
            elStatusPresensi.style.background = '#F1F5F9';
          }
        }
      } catch(e) {}
    } else {
      if (elJamMasuk) elJamMasuk.innerText = '- (Belum Masuk Dinas)';
      if (elJamPulang) elJamPulang.innerText = 'Belum Presensi Pulang';
      if (elStatusPresensi) {
        elStatusPresensi.innerHTML = '○ Belum Masuk Dinas';
        elStatusPresensi.style.color = '#B45309';
        elStatusPresensi.style.background = '#FEF3C7';
      }
    }
    updateStatusDinasHeader();
  }

  // Header Pawas di Layar Kinerja
  const elPawasKinerja = document.getElementById('kinerja-pawas-nama-nrp');
  if (elPawasKinerja) {
    elPawasKinerja.innerText = (activeUser && activeUser.role === 'pimpinan')
      ? `${activeUser.nama} (NRP: ${activeUser.nrp})`
      : (activeUser ? `${activeUser.nama} (NRP: ${activeUser.nrp})` : '');
  }
}

function openProfileScreen() {
  const currentActive = document.querySelector('.view.active');
  if (currentActive && currentActive.id !== 'view-profil') {
    lastActiveViewBeforeProfile = currentActive.id;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const role = urlParams.get('role');
  syncProfileData(role);
  switchTab('view-profil');
  renderRiwayatLogLengkap();
  mulaiJamLiveProfil();
}

function kembaliDariProfil() {
  const urlParams = new URLSearchParams(window.location.search);
  const role = urlParams.get('role');
  if (role === 'operator') {
    switchTab('view-operator');
  } else if (lastActiveViewBeforeProfile && lastActiveViewBeforeProfile !== 'view-profil') {
    switchTab(lastActiveViewBeforeProfile);
  } else {
    switchTab('view-beranda');
  }
}

function isUserSedangDinas() {
  const activeUser = typeof getActiveSessionUser === 'function' ? getActiveSessionUser() : null;
  if (!activeUser || !activeUser.nrp) return false;
  const presensiKey = 'simapres_presensi_' + activeUser.nrp;
  const raw = sessionStorage.getItem(presensiKey);
  if (!raw) return false;
  try {
    const data = JSON.parse(raw);
    return Boolean(data && data.masuk && !data.pulang);
  } catch(e) {
    return false;
  }
}

function updatePresensiButtonsState() {
  const isDinas = isUserSedangDinas();
  const btnMasuk = document.getElementById('btn-presensi-masuk');
  const btnPulang = document.getElementById('btn-presensi-pulang');

  if (btnMasuk) {
    if (isDinas) {
      btnMasuk.disabled = true;
      btnMasuk.style.opacity = '0.5';
      btnMasuk.style.cursor = 'not-allowed';
      btnMasuk.style.pointerEvents = 'none';
      btnMasuk.title = 'Anda sudah melakukan presensi masuk dinas';
    } else {
      btnMasuk.disabled = false;
      btnMasuk.style.opacity = '1';
      btnMasuk.style.cursor = 'pointer';
      btnMasuk.style.pointerEvents = 'auto';
      btnMasuk.title = 'Klik untuk presensi masuk piket dinas';
    }
  }

  if (btnPulang) {
    if (!isDinas) {
      btnPulang.disabled = true;
      btnPulang.style.opacity = '0.5';
      btnPulang.style.cursor = 'not-allowed';
      btnPulang.style.pointerEvents = 'none';
      btnPulang.title = 'Belum dapat presensi keluar karena belum melakukan presensi masuk';
    } else {
      btnPulang.disabled = false;
      btnPulang.style.opacity = '1';
      btnPulang.style.cursor = 'pointer';
      btnPulang.style.pointerEvents = 'auto';
      btnPulang.title = 'Klik untuk presensi pulang / lepas dinas';
    }
  }
}

function updateStatusDinasHeader() {
  const isDinas = isUserSedangDinas();
  const statusEls = document.querySelectorAll('.status-text');
  statusEls.forEach(statusEl => {
    if (isDinas) {
      statusEl.innerHTML = '<span style="color:#10B981; font-weight:800; display:inline-flex; align-items:center; gap:5px;"><span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#10B981;"></span> STATUS: DINAS</span>';
    } else {
      statusEl.innerHTML = '<span style="color:#EF4444; font-weight:800; display:inline-flex; align-items:center; gap:5px;"><span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#EF4444;"></span> STATUS: TIDAK DINAS</span>';
    }
  });

  // Sinkronkan badge dot avatar dan pill status jika elemen tersedia
  const dot = document.getElementById('profil-avatar-dot');
  const pill = document.getElementById('profil-status-dinas-pill');
  if (isDinas) {
    if (dot) dot.style.background = '#10B981';
    if (pill) {
      pill.innerText = 'SIAGA PIKET AKTIF';
      pill.style.background = 'rgba(16,185,129,0.25)';
      pill.style.color = '#6EE7B7';
    }
  } else {
    if (dot) dot.style.background = '#94A3B8';
    if (pill) {
      pill.innerText = 'TIDAK DINAS';
      pill.style.background = 'rgba(239,68,68,0.2)';
      pill.style.color = '#FCA5A5';
    }
  }

  // Update disable/enable state tombol presensi masuk dan keluar
  updatePresensiButtonsState();
}

function konfirmasiLogout() {
  if (confirm('Apakah Anda yakin ingin mengakhiri sesi dinas dan keluar ke halaman login?')) {
    const activeUser = typeof getActiveSessionUser === 'function' ? getActiveSessionUser() : null;
    if (activeUser && activeUser.nrp) {
      sessionStorage.removeItem('simapres_presensi_' + activeUser.nrp);
    }
    updateStatusDinasHeader();
    window.location.href = 'index.html';
  }
}

// ==================================
// FITUR MENU PROFIL: PRESENSI, PENGATURAN AKUN & RIWAYAT LOG LENGKAP 110
// ==================================
let liveClockInterval = null;
let profilCurrentFilter = 'semua';

function mulaiJamLiveProfil() {
  function updateClock() {
    const el = document.getElementById('profil-jam-live');
    if (el) {
      const now = new Date();
      el.innerText = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB';
    }
  }
  updateClock();
  if (!liveClockInterval) {
    liveClockInterval = setInterval(updateClock, 1000);
  }
}

function tampilkanToast(pesan, tipe = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  const isSuccess = tipe === 'success';
  const isDanger = tipe === 'danger';
  const bg = isSuccess ? '#065F46' : (isDanger ? '#991B1B' : '#1E40AF');
  const icon = isSuccess ? '✅' : (isDanger ? '⚠️' : 'ℹ️');

  toast.style.cssText = `
        background: ${bg};
        color: white;
        padding: 12px 18px;
        border-radius: 10px;
        font-size: 13px;
        font-weight: 600;
        box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        gap: 10px;
        pointer-events: auto;
        transform: translateY(-20px);
        opacity: 0;
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        max-width: 380px;
      `;
  toast.innerHTML = `<span style="font-size:16px;">${icon}</span> <span>${pesan}</span>`;
  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.transform = 'translateY(0)';
    toast.style.opacity = '1';
  });

  setTimeout(() => {
    toast.style.transform = 'translateY(-20px)';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 350);
  }, 3500);
}

function handlePresensiMasuk() {
  if (isUserSedangDinas()) {
    tampilkanToast('Anda sudah melakukan presensi masuk dinas. Tidak dapat presensi masuk lagi.', 'info');
    return;
  }

  const waktu = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
  const activeUser = typeof getActiveSessionUser === 'function' ? getActiveSessionUser() : null;

  if (activeUser && activeUser.nrp) {
    const presensiKey = 'simapres_presensi_' + activeUser.nrp;
    sessionStorage.setItem(presensiKey, JSON.stringify({
      masuk: waktu,
      tgl: new Date().toDateString(),
      nrp: activeUser.nrp,
      pulang: null
    }));
  }

  const statusText = document.getElementById('profil-presensi-status-text');
  if (statusText) {
    statusText.innerText = '● Sudah Masuk Dinas';
    statusText.style.background = '#DCFCE7';
    statusText.style.color = '#15803D';
  }

  const jamMasuk = document.getElementById('profil-presensi-jam-masuk');
  if (jamMasuk) jamMasuk.innerText = waktu + ' (Tervalidasi Biometrik)';

  const jamPulang = document.getElementById('profil-presensi-jam-pulang');
  if (jamPulang) jamPulang.innerText = 'Belum Presensi Pulang';

  const pill = document.getElementById('profil-status-dinas-pill');
  if (pill) {
    pill.innerText = 'SIAGA PIKET AKTIF';
    pill.style.background = 'rgba(16,185,129,0.25)';
    pill.style.color = '#6EE7B7';
  }

  const dot = document.getElementById('profil-avatar-dot');
  if (dot) dot.style.background = '#10B981';

  updateStatusDinasHeader();
  tampilkanToast(`Presensi Masuk Berhasil! Sesi piket tercatat pukul ${waktu}. Status: DINAS`, 'success');
}

function handlePresensiPulang() {
  if (!isUserSedangDinas()) {
    tampilkanToast('Tidak dapat melakukan presensi keluar karena Anda belum melakukan presensi masuk.', 'danger');
    return;
  }
  const modal = document.getElementById('modal-presensi-pulang');
  if (modal) modal.style.display = 'flex';
}

function tutupModalPresensiPulang() {
  const modal = document.getElementById('modal-presensi-pulang');
  if (modal) modal.style.display = 'none';
}

function konfirmasiPresensiPulangFinal() {
  if (!isUserSedangDinas()) {
    tutupModalPresensiPulang();
    tampilkanToast('Tidak dapat melakukan presensi keluar karena Anda belum melakukan presensi masuk.', 'danger');
    return;
  }
  tutupModalPresensiPulang();
  const waktu = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
  const activeUser = typeof getActiveSessionUser === 'function' ? getActiveSessionUser() : null;

  if (activeUser && activeUser.nrp) {
    const presensiKey = 'simapres_presensi_' + activeUser.nrp;
    let existingData = {};
    try {
      existingData = JSON.parse(sessionStorage.getItem(presensiKey)) || {};
    } catch(e) {}
    existingData.pulang = waktu;
    existingData.tglPulang = new Date().toDateString();
    sessionStorage.setItem(presensiKey, JSON.stringify(existingData));
  }

  const statusText = document.getElementById('profil-presensi-status-text');
  if (statusText) {
    statusText.innerText = '● Selesai Dinas (Lepas Piket)';
    statusText.style.background = '#F1F5F9';
    statusText.style.color = '#475569';
  }

  const jamPulang = document.getElementById('profil-presensi-jam-pulang');
  if (jamPulang) jamPulang.innerText = waktu + ' (Serah Terima Selesai)';

  const pill = document.getElementById('profil-status-dinas-pill');
  if (pill) {
    pill.innerText = 'LEPAS PIKET';
    pill.style.background = 'rgba(148,163,184,0.25)';
    pill.style.color = '#CBD5E1';
  }

  const dot = document.getElementById('profil-avatar-dot');
  if (dot) dot.style.background = '#94A3B8';

  updateStatusDinasHeader();
  tampilkanToast(`Presensi Pulang Berhasil! Sesi dinas piket selesai pukul ${waktu}. Status: TIDAK DINAS`, 'info');
}

const daftarRiwayatLog110 = [
  {
    id: 'TKT-110-2026-0891',
    tiket: '#110-2026-0891',
    waktu: '11 Okt 2026, 21:15 WIB',
    kategori: 'Tawuran Antar Remaja & Sajam',
    tindakan: 'TPTKP',
    tindakanBg: '#FEE2E2',
    tindakanColor: '#B91C1C',
    pelapor: 'Bambang S. (Warga Senen)',
    telp: '0812-8821-4991',
    lokasi: 'Jl. Kramat Raya No. 45, Senen, Jakarta Pusat',
    petugas: 'Bripka Ahmad (Samapta Unit D)',
    status: 'selesai',
    statusText: 'Selesai (LP Dibuat)',
    statusBg: '#DCFCE7',
    statusColor: '#15803D',
    sla: '6.8 Menit',
    slaStatus: 'Tepat Waktu (< 10 Menit)',
    kronologi: 'Laporan warga masuk pukul 21:15 WIB perihal sekelompok remaja berkerumun membawa sajam. Regu Samapta tiba di TKP pukul 21:21 WIB (Respon 6.8 Menit). Kerumunan berhasil dibubarkan, 2 orang diamankan beserta 1 celurit untuk dimintai keterangan di Mapolres.',
    foto: 'assets/images/polri_pengaduan_tkp.jpg',
    catatan: 'Situasi aman terkendali. Laporan Polisi Model-A nomor LP/A/0891/X/2026/SPKT telah diterbitkan dan diserahkan ke Satreskrim.'
  },
  {
    id: 'TKT-110-2026-0888',
    tiket: '#110-2026-0888',
    waktu: '11 Okt 2026, 20:30 WIB',
    kategori: 'Pencurian Motor (Curanmor)',
    tindakan: 'TPTKP',
    tindakanBg: '#FEE2E2',
    tindakanColor: '#B91C1C',
    pelapor: 'Ibu Ratna Dewi',
    telp: '0813-9011-2345',
    lokasi: 'Parkiran Minimarket, Jl. Percetakan Negara, Johar Baru',
    petugas: 'Aipda Joko & Bripka Ahmad',
    status: 'selesai',
    statusText: 'Selesai (Diteruskan Reskrim)',
    statusBg: '#DCFCE7',
    statusColor: '#15803D',
    sla: '5.2 Menit',
    slaStatus: 'Tepat Waktu (< 10 Menit)',
    kronologi: 'Korban melapor sepeda motor Honda Beat B 4123 TKL hilang saat ditinggal belanja 10 menit. Petugas tiba di TKP pukul 20:35 WIB, mengamankan rekaman CCTV toko dan mengarahkan korban membuat laporan resmi ke SPKT.',
    foto: 'assets/images/polri_pengaduan_tkp.jpg',
    catatan: 'Rekaman CCTV memperlihatkan 2 pelaku. Berkas dan bukti flashdisk diserahkan ke piket Reskrim.'
  },
  {
    id: 'TKT-110-2026-0885',
    tiket: '#110-2026-0885',
    waktu: '11 Okt 2026, 19:40 WIB',
    kategori: 'Keributan Warga & Kamtibmas',
    tindakan: 'SAMBANG',
    tindakanBg: '#FEF3C7',
    tindakanColor: '#B45309',
    pelapor: 'Ketua RT 05 Bpk. Hendra',
    telp: '0857-1122-3344',
    lokasi: 'Jl. Kebon Sirih Barat Gang 3, Menteng',
    petugas: 'Bripka Ahmad (Bhabinkamtibmas/Samapta)',
    status: 'selesai',
    statusText: 'Selesai (Mediasi Damai)',
    statusBg: '#DCFCE7',
    statusColor: '#15803D',
    sla: '7.5 Menit',
    slaStatus: 'Tepat Waktu (< 10 Menit)',
    kronologi: 'Perselisihan batas parkir antar tetangga yang memicu adu mulut. Petugas tiba di lokasi pukul 19:47 WIB bersama Ketua RT melakukan mediasi musyawarah mufakat.',
    foto: 'assets/images/polri_pengaduan_tkp.jpg',
    catatan: 'Kedua belah pihak saling memaafkan dan menandatangani surat kesepakatan damai tanpa tuntutan hukum.'
  },
  {
    id: 'TKT-110-2026-0882',
    tiket: '#110-2026-0882',
    waktu: '11 Okt 2026, 18:20 WIB',
    kategori: 'Pohon Tumbang & Hambatan Lalin',
    tindakan: 'PENGAMANAN',
    tindakanBg: '#DBEAFE',
    tindakanColor: '#1D4ED8',
    pelapor: 'Dinas Perhubungan DKI',
    telp: '021-3456789',
    lokasi: 'Jl. Medan Merdeka Timur, Gambir',
    petugas: 'Unit Patroli Samapta & Turjawali Lantas',
    status: 'selesai',
    statusText: 'Selesai (Jalan Bersih)',
    statusBg: '#DCFCE7',
    statusColor: '#15803D',
    sla: '6.0 Menit',
    slaStatus: 'Tepat Waktu (< 10 Menit)',
    kronologi: 'Pohon angsana tumbang akibat angin kencang menutup 1 lajur arah Tugu Tani. Personel Samapta melakukan pengalihan arus dan membantu tim Damkar memotong batang pohon.',
    foto: 'assets/images/polri_pengaduan_tkp.jpg',
    catatan: 'Lalu lintas normal kembali pukul 19:05 WIB. Tidak ada korban jiwa maupun kerusakan ranmor.'
  },
  {
    id: 'TKT-110-2026-0879',
    tiket: '#110-2026-0879',
    waktu: '11 Okt 2026, 17:15 WIB',
    kategori: 'Kecelakaan Lalu Lintas Tabrak Lari',
    tindakan: 'TPTKP',
    tindakanBg: '#FEE2E2',
    tindakanColor: '#B91C1C',
    pelapor: 'Sdr. Fajar (Pengemudi Ojol)',
    telp: '0819-2233-4455',
    lokasi: 'Depan ITC Cempaka Mas, Jl. Letjen Suprapto',
    petugas: 'Unit Reaksi Cepat Samapta',
    status: 'diproses',
    statusText: 'Sedang Ditangani',
    statusBg: '#FEF3C7',
    statusColor: '#B45309',
    sla: '8.4 Menit',
    slaStatus: 'Tepat Waktu (< 10 Menit)',
    kronologi: 'Sepeda motor disenggol minibus yang melarikan diri ke arah Pulogadung. Korban luka lecet pada lutut dan tangan dievakuasi ke RS Islam Cempaka Putih. Petugas memeriksa saksi mata di sekitar lokasi.',
    foto: 'assets/images/polri_pengaduan_tkp.jpg',
    catatan: 'Korban dalam penanganan medis. Ciri-ciri nopol mobil sedang dilacak oleh Satlantas melalui rekaman ETLE.'
  },
  {
    id: 'TKT-110-2026-0875',
    tiket: '#110-2026-0875',
    waktu: '11 Okt 2026, 16:00 WIB',
    kategori: 'Pesta Miras & Resah Warga',
    tindakan: 'PATROLI',
    tindakanBg: '#FEE2E2',
    tindakanColor: '#B91C1C',
    pelapor: 'Anonim (Warga RW 02)',
    telp: '0812-7788-9900',
    lokasi: 'Taman Segitiga, Cempaka Putih Tengah',
    petugas: 'Unit Patroli Samapta Regu B',
    status: 'menunggu',
    statusText: 'Menunggu Tindakan',
    statusBg: '#EFF6FF',
    statusColor: '#1D4ED8',
    sla: 'Dalam Antrean',
    slaStatus: 'Prioritas Siaga',
    kronologi: 'Laporan sekelompok pemuda nongkrong menyalakan musik keras dan konsumsi miras jenis oplosan di fasilitas umum taman warga.',
    foto: 'assets/images/polri_pengaduan_tkp.jpg',
    catatan: 'Tiket telah diteruskan ke regu patroli Samapta shift malam untuk dilakukan penertiban sasaran patroli blue light.'
  }
];

function setFilterLogProfil(status, el) {
  profilCurrentFilter = status;
  if (el) {
    document.querySelectorAll('#profil-filter-buttons-container .btn-log-filter').forEach(btn => {
      btn.classList.remove('active');
      btn.style.background = '#F8FAFC';
      btn.style.color = '#64748B';
      btn.style.borderColor = '#E2E8F0';
    });
    el.classList.add('active');
    el.style.background = '#EFF6FF';
    el.style.color = 'var(--primary)';
    el.style.borderColor = '#BFDBFE';
  }
  const kw = document.getElementById('profil-search-log')?.value || '';
  renderRiwayatLogLengkap(status, kw);
}

function filterRiwayatLogProfil() {
  const kw = document.getElementById('profil-search-log')?.value || '';
  renderRiwayatLogLengkap(profilCurrentFilter, kw);
}

function renderRiwayatLogLengkap(status = profilCurrentFilter, keyword = '') {
  const container = document.getElementById('profil-riwayat-log-container');
  if (!container) return;

  const kw = keyword.toLowerCase().trim();
  const sourceData = (typeof getDynamicRiwayatLog110 === 'function') ? getDynamicRiwayatLog110() : daftarRiwayatLog110;
  const filtered = sourceData.filter(item => {
    const matchesStatus = (status === 'semua') || (item.status === status);
    const matchesKw = !kw ||
      item.tiket.toLowerCase().includes(kw) ||
      item.kategori.toLowerCase().includes(kw) ||
      item.lokasi.toLowerCase().includes(kw) ||
      item.pelapor.toLowerCase().includes(kw);
    return matchesStatus && matchesKw;
  });

  const badgeCount = document.getElementById('profil-log-count-badge');
  if (badgeCount) badgeCount.innerText = `${filtered.length} Laporan`;

  const bAll = document.getElementById('profil-btn-semua');
  if (bAll) bAll.innerText = `Semua (${sourceData.length})`;
  const bWait = document.getElementById('profil-btn-menunggu');
  if (bWait) bWait.innerText = `Menunggu Tindakan (${sourceData.filter(i => i.status === 'menunggu').length})`;
  const bProc = document.getElementById('profil-btn-diproses');
  if (bProc) bProc.innerText = `Sedang Ditangani (${sourceData.filter(i => i.status === 'diproses' || i.status === 'menunggu_pengesahan').length})`;
  const bDone = document.getElementById('profil-btn-selesai');
  if (bDone) bDone.innerText = `Selesai (${sourceData.filter(i => i.status === 'selesai').length})`;

  if (filtered.length === 0) {
    container.innerHTML = `
          <div style="text-align:center; padding:35px 20px; color:#94A3B8; background:#F8FAFC; border-radius:10px; border:1px dashed #CBD5E1;">
            <div style="font-size:32px; margin-bottom:8px;">📭</div>
            <div style="font-size:13px; font-weight:700; color:#64748B;">Tidak ada riwayat laporan ditemukan</div>
            <div style="font-size:11.5px; margin-top:2px;">Coba gunakan kata kunci pencarian lain atau pilih tab filter 'Semua'</div>
          </div>
        `;
    return;
  }

  container.innerHTML = filtered.map(item => `
        <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:14px; transition:0.2s;"
          onmouseover="this.style.background='#FFFFFF'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.05)';"
          onmouseout="this.style.background='#F8FAFC'; this.style.boxShadow='none';">
          <!-- Top Row: Tiket, Waktu & Status -->
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; flex-wrap:wrap; gap:6px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:13px; font-weight:900; color:var(--primary); font-family:monospace;">${item.tiket}</span>
              <span style="font-size:10px; font-weight:800; padding:2px 7px; border-radius:4px; background:${item.tindakanBg}; color:${item.tindakanColor};">${item.tindakan}</span>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:11px; color:#64748B;">🕒 ${item.waktu}</span>
              <span style="font-size:10.5px; font-weight:800; padding:2px 8px; border-radius:6px; background:${item.statusBg}; color:${item.statusColor};">${item.statusText}</span>
            </div>
          </div>

          <!-- Mid Row: Judul & TKP -->
          <div style="font-size:13.5px; font-weight:800; color:var(--text); margin-bottom:4px;">
            ${item.kategori}
          </div>
          <div style="font-size:11.5px; color:#64748B; margin-bottom:10px; display:flex; align-items:center; gap:4px;">
            <span>📍</span> <span>${item.lokasi}</span>
          </div>

          <!-- Bottom Row: Petugas, SLA & Tombol Detail -->
          <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px dashed #E2E8F0; padding-top:8px; flex-wrap:wrap; gap:8px;">
            <div style="font-size:11px; color:var(--text-muted);">
              <strong>Petugas:</strong> ${item.petugas} • <span style="color:#15803D; font-weight:700;">⚡ Kecepatan Respon: ${item.sla}</span>
            </div>
            <button type="button" onclick="bukaDetailLogProfil('${item.id}')"
              style="padding:5px 12px; background:#EFF6FF; color:var(--primary); border:1px solid #BFDBFE; border-radius:6px; font-size:11.5px; font-weight:800; cursor:pointer; display:flex; align-items:center; gap:4px; transition:0.2s;"
              onmouseover="this.style.background='#DBEAFE'" onmouseout="this.style.background='#EFF6FF'">
              <span>Lihat Detail Log</span> <span>➔</span>
            </button>
          </div>
        </div>
      `).join('');
}

function bukaDetailLogProfil(id) {
  const item = daftarRiwayatLog110.find(x => x.id === id);
  if (!item) return;

  const modal = document.getElementById('modal-detail-log-profil');
  if (!modal) return;

  document.getElementById('mdl-log-tiket').innerText = item.tiket;
  document.getElementById('mdl-log-waktu').innerText = item.waktu;
  const st = document.getElementById('mdl-log-status');
  if (st) {
    st.innerText = item.statusText;
    st.style.background = item.statusBg;
    st.style.color = item.statusColor;
  }

  document.getElementById('mdl-log-kategori').innerText = item.kategori;
  document.getElementById('mdl-log-lokasi').innerText = item.lokasi;
  document.getElementById('mdl-log-pelapor').innerText = `${item.pelapor} (${item.telp})`;
  document.getElementById('mdl-log-petugas').innerText = item.petugas;
  document.getElementById('mdl-log-tindakan').innerText = item.tindakan;
  document.getElementById('mdl-log-sla').innerText = `${item.sla} (${item.slaStatus})`;
  document.getElementById('mdl-log-kronologi').innerText = item.kronologi;
  document.getElementById('mdl-log-catatan').innerText = item.catatan;

  const fotoEl = document.getElementById('mdl-log-foto');
  if (fotoEl) fotoEl.src = item.foto;

  modal.style.display = 'flex';
}

function tutupDetailLogProfil() {
  const modal = document.getElementById('modal-detail-log-profil');
  if (modal) modal.style.display = 'none';
}

let jamLiveInputLogInterval = null;
let currentUploadedBuktiLogFoto = null;

function updateJamLiveInputLog() {
  const el = document.getElementById('log-jam-input');
  if (!el) return;
  const now = new Date();
  const jam = String(now.getHours()).padStart(2, '0');
  const menit = String(now.getMinutes()).padStart(2, '0');
  const detik = String(now.getSeconds()).padStart(2, '0');
  el.value = `${jam}:${menit}:${detik} WIB`;
}

function mulaiJamLiveInputLog() {
  updateJamLiveInputLog();
  if (jamLiveInputLogInterval) clearInterval(jamLiveInputLogInterval);
  jamLiveInputLogInterval = setInterval(updateJamLiveInputLog, 1000);
}

function handleUploadBuktiLog(event) {
  const file = event?.target?.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    currentUploadedBuktiLogFoto = e.target.result;
    const preview = document.getElementById('log-preview-img');
    if (preview) {
      preview.src = currentUploadedBuktiLogFoto;
      preview.style.borderColor = '#10B981';
    }
  };
  reader.readAsDataURL(file);
}

function simpanLogKegiatanInput() {
  const aktifUser = (typeof getActiveSimapresUser === 'function') ? getActiveSimapresUser() : currentUser;
  const uraianEl = document.getElementById('log-kegiatan-input');
  const lokasiEl = document.getElementById('log-lokasi-input');
  const uraian = uraianEl ? uraianEl.value.trim() : '';
  const lokasi = lokasiEl ? lokasiEl.value.trim() : '';

  if (!uraian) {
    alert('Uraian kegiatan wajib diisi.');
    if (uraianEl) uraianEl.focus();
    return;
  }

  const now = new Date();
  const jamWib = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0') + ' WIB';
  const maxId = (Array.isArray(appLogs) ? appLogs : []).reduce((acc, curr) => Math.max(acc, Number(curr.id) || 0), 0);
  const newId = maxId + 1;
  const nomorRegistrasi = 'LOG-ACT-' + String(newId).padStart(4, '0');

  const userNama = aktifUser ? (aktifUser.namaSingkat || aktifUser.nama) : 'Bripka Ahmad Subagyo';
  const userNrp = aktifUser ? aktifUser.nrp : '95020123';
  const userUnitId = aktifUser ? aktifUser.unitId : 'samapta-r4-selatan';
  const userSatuan = aktifUser ? (aktifUser.satuan || 'Unit Samapta Presisi') : 'Unit Samapta Presisi';

  const newLogEntry = {
    id: newId,
    nomorTiket: 'TIKET-110-' + (newId < 10 ? '0' + newId : newId) + 'X2F',
    platform: 'personel',
    platformBadge: '👮 PATROLI POLRI',
    kategoriInsiden: 'Kamtibmas',
    kategoriBadge: '💥 Kamtibmas & Tawuran',
    tipePelapor: 'internal',
    nama: `${userNama} (NRP: ${userNrp})`,
    nrp: userNrp,
    kesatuan: userSatuan,
    assignedNrp: userNrp,
    assignedNama: userNama,
    assignedUnitId: userUnitId,
    avatar: 'assets/images/avatar_polisi.jpg',
    status: 'menunggu',
    statusText: 'Menunggu Tindakan',
    title: 'Laporan Kegiatan Patroli (Mandiri)',
    jenisInsiden: 'Kegiatan Patroli Mandiri',
    deskripsi: uraian,
    sektor: 'Sektor Gambir & Menteng',
    lokasiKejadian: lokasi || 'Wilayah Hukum Polsek Gambir',
    koordinatGps: '-6.1754, 106.8272',
    waktu: jamWib,
    sumberLaporan: '👮 Inisiatif Patroli Mandiri Personel Polri',
    sumberSingkat: 'PATROLI POLRI',
    urgensi: 'ℹ️ Normal',
    fotoLampiran: currentUploadedBuktiLogFoto || 'assets/images/polri_pengaduan_tkp.jpg',
    fotoPengaduan: currentUploadedBuktiLogFoto || 'assets/images/polri_pengaduan_tkp.jpg',
    alasanTolak: '',
    riwayatValidasi: [
      {
        waktu: jamWib,
        aktor: `${userNama} (${userNrp})`,
        aksi: 'Input Log Kegiatan Mandiri',
        catatan: 'Penginputan kegiatan mandiri personel via formulir mobile. Menunggu audit & disposisi Pawas.'
      }
    ],
    ratingKepuasan: null
  };

  if (!Array.isArray(appLogs)) appLogs = [];
  appLogs.unshift(newLogEntry);

  if (typeof saveAppLogsToStore === 'function') {
    saveAppLogsToStore(appLogs);
  } else {
    try {
      localStorage.setItem('simapres_app_logs_v1', JSON.stringify(appLogs));
    } catch(e) {
      console.warn('Gagal menyimpan ke localStorage:', e);
    }
  }

  // Update UI & stats
  if (typeof renderPersonalStatsBento === 'function') renderPersonalStatsBento();
  if (typeof renderRiwayatLogLengkap === 'function') renderRiwayatLogLengkap();
  if (typeof renderEbOperatorQueue === 'function') renderEbOperatorQueue();
  if (typeof renderPersonelShiftTimeline === 'function') renderPersonelShiftTimeline();

  alert(`Log kegiatan berhasil dicatat ke sistem!\nNomor: ${nomorRegistrasi}\nStatus: Selesai`);

  if (uraianEl) uraianEl.value = '';
  currentUploadedBuktiLogFoto = null;
  const preview = document.getElementById('log-preview-img');
  if (preview) {
    preview.src = 'https://placehold.co/200x200/153E75/FFFFFF?text=Foto';
    preview.style.borderColor = '#153E75';
  }
}

function initViewLogKegiatan() {
  mulaiJamLiveInputLog();
  const locEl = document.getElementById('log-lokasi-input');
  if (locEl && !locEl.value) {
    locEl.value = 'Jl. Medan Merdeka Barat, Gambir, Jakarta Pusat';
  }
}

// ==================================
// FASE 0 LOGIC: JALUR OPERATOR SPKT & MANDIRI PERSONEL
// ==================================
function kirimLogMandiriPersonel() {
  const jenis = document.getElementById('respon-jenis')?.value || 'PATROLI';
  const descEl = document.querySelector('#view-respon textarea');
  const desc = (descEl && descEl.value.trim()) ? descEl.value.trim() : 'Melaksanakan patroli dialogis kewilayahan, situasi aman dan kondusif.';
  const waktu = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';

  const maxId = appLogs.reduce((acc, curr) => Math.max(acc, curr.id || 0), 0);
  const newId = maxId + 1;

  const activeUser = typeof getActiveSessionUser === 'function' ? getActiveSessionUser() : null;
  const userNama = activeUser ? (activeUser.namaSingkat || activeUser.nama) : 'Personel Patroli';
  const userNrp = activeUser ? activeUser.nrp : '95020123';
  const userAvatar = activeUser ? activeUser.avatar : 'assets/images/polri_pengaduan_tkp.jpg';
  const userUnitId = activeUser ? activeUser.unitId : 'samapta-r4-selatan';
  const userSatuan = activeUser ? (activeUser.satuan || 'Unit Samapta Presisi') : 'Unit Samapta Presisi';

  const noTiket = 'TIKET-110-' + (newId < 10 ? '0' + newId : newId) + 'X2F';

  let katGiat = 'PATROLI';
  let katBadgeGiat = '🚔 Patroli Wilayah';
  if (jenis === 'SAMBANG') {
    katGiat = 'SAMBANG';
    katBadgeGiat = '🤝 Sambang Warga';
  } else if (jenis === 'TPTKP') {
    katGiat = 'TPTKP';
    katBadgeGiat = '🛡️ TPTKP';
  } else if (jenis === 'PENGAMANAN') {
    katGiat = 'PENGAMANAN';
    katBadgeGiat = '⚠️ Pengamanan Jalur/Objek';
  }

  const newLog = {
    id: newId,
    nomorTiket: noTiket,
    platform: 'personel',
    platformBadge: '👮 PATROLI POLRI',
    kategoriInsiden: katGiat,
    kategoriBadge: katBadgeGiat,
    tipePelapor: 'internal',
    nama: `${userNama} (NRP: ${userNrp})`,
    nrp: userNrp,
    kesatuan: userSatuan,
    assignedNrp: userNrp,
    assignedNama: userNama,
    assignedUnitId: userUnitId,
    avatar: 'assets/images/avatar_polisi.jpg',
    status: 'menunggu',
    statusText: 'Menunggu Tindakan',
    title: 'Laporan Kegiatan ' + jenis + ' (Mandiri)',
    jenisInsiden: 'Kegiatan ' + jenis + ' Mandiri',
    deskripsi: desc,
    sektor: userSatuan.includes('Barat') ? 'Sektor Barat' : (userSatuan.includes('Timur') ? 'Sektor Timur' : 'Sektor Selatan'),
    lokasiKejadian: 'Jl. Fatmawati Raya No. 12, Jakarta Selatan',
    koordinatGps: '-6.2345, 106.8423',
    waktu: waktu,
    sumberLaporan: '👮 Inisiatif Patroli Mandiri Personel Polri',
    sumberSingkat: 'PATROLI POLRI',
    urgensi: 'ℹ️ Normal',
    fotoLampiran: userAvatar,
    fotoPengaduan: userAvatar,
    alasanTolak: '',
    riwayatValidasi: [
      {
        waktu: waktu,
        aktor: userNama + ' (Personel Lapangan)',
        aksi: 'Input Log Mandiri Personel',
        catatan: 'Penginputan formulir kegiatan ' + jenis + ' dari aplikasi mobile. Menunggu audit & disposisi Pawas.'
      }
    ],
    ratingKepuasan: null
  };

  appLogs.unshift(newLog);
  saveLogsToStorage();
  updateRekapCounts();

  alert('✓ Log Kegiatan Mandiri #' + newId + ' berhasil dikirim!\n\nLaporan telah masuk ke antrean "Menunggu Tindakan" untuk diverifikasi oleh Pawas/Atasan .');
  switchTab('view-beranda');
}

function ebSubmitLaporanOperator(langsungDisposisi = false) {
  const notelp = document.getElementById('eb-op-telepon')?.value.trim() || '+62 812-9844-3210';
  const namaPelapor = document.getElementById('eb-op-nama')?.value.trim() || 'Ibu Ratna Dewi';
  const jenis = document.getElementById('eb-op-jenis')?.value || 'Tawuran Pelajar / Remaja';
  const lokasi = document.getElementById('eb-op-lokasi')?.value.trim() || 'Kebayoran Baru, Jakarta Selatan';
  const gps = document.getElementById('eb-op-gps')?.value.trim() || '-6.2415, 106.8021';
  const uraian = document.getElementById('eb-op-uraian')?.value.trim() || 'Panggilan telepon 110 diterima dari pelapor terkait situasi darurat di TKP.';

  const maxId = appLogs.reduce((acc, curr) => Math.max(acc, curr.id || 0), 0);
  const newId = maxId + 1;
  const waktu = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';

  let sampleFoto = 'assets/images/polri_pengaduan_tkp.jpg';
  if (jenis.includes('Kecelakaan')) sampleFoto = 'assets/images/polri_pengaduan_tkp.jpg';

  const activeUser = typeof getActiveSessionUser === 'function' ? getActiveSessionUser() : null;
  const opNama = activeUser ? (activeUser.namaSingkat || activeUser.nama) : 'Pawas & Operator SPKT (Kombes Pol Budi)';
  const opNrp = activeUser ? activeUser.nrp : '72010190';

  const noTiket = 'TIKET-110-' + (newId < 10 ? '0' + newId : newId) + 'X2F';
  let katInsiden = 'Kamtibmas';
  let katBadge = '💥 Kamtibmas & Tawuran';
  if (jenis.includes('Kriminalitas') || jenis.includes('Pencurian') || jenis.includes('Begal') || jenis.includes('Curanmor')) {
    katInsiden = 'Kriminalitas';
    katBadge = '⚔️ Kriminalitas';
  } else if (jenis.includes('Laka Lantas') || jenis.includes('Kecelakaan') || jenis.includes('Laka')) {
    katInsiden = 'Laka Lantas';
    katBadge = '🚗 Laka Lantas';
  } else if (jenis.includes('Darurat Bencana') || jenis.includes('Bencana') || jenis.includes('Pohon Tumbang')) {
    katInsiden = 'Darurat Bencana';
    katBadge = '🔥 Darurat Bencana';
  } else if (jenis.includes('Pelayanan Publik') || jenis.includes('Mediasi') || jenis.includes('Pelayanan')) {
    katInsiden = 'Pelayanan Publik';
    katBadge = '🤝 Pelayanan Publik';
  }

  const newLog = {
    id: newId,
    nomorTiket: noTiket,
    platform: 'layanan110',
    platformBadge: '📞 LAYANAN 110',
    kategoriInsiden: katInsiden,
    kategoriBadge: katBadge,
    tipePelapor: 'layanan110',
    nama: namaPelapor,
    noTelpPelapor: notelp,
    nrp: opNrp,
    avatar: SVG_AVATAR_WARGA,
    status: 'menunggu',
    statusText: 'Menunggu Tindakan',
    title: jenis + ' - ' + lokasi.split(',')[0],
    jenisInsiden: jenis,
    deskripsi: uraian,
    sektor: 'Jakarta Selatan',
    lokasiKejadian: lokasi,
    koordinatGps: gps,
    waktu: waktu,
    urgensi: '🚨 Darurat',
    sumberLaporan: '📞 Panggilan 110 (Call Center SPKT)',
    sumberSingkat: 'LAYANAN 110',
    pelapor: { nama: namaPelapor, telepon: notelp },
    fotoPengaduan: sampleFoto,
    fotoLampiran: sampleFoto,
    alasanTolak: '',
    riwayatValidasi: [
      {
        waktu: waktu,
        aktor: opNama,
        aksi: 'Penerimaan Panggilan Telepon 110',
        catatan: 'Panggilan darurat 110 diterima dari ' + namaPelapor + ' (' + notelp + '). Disalurkan ke konsol komando Pawas.'
      }
    ],
    ratingKepuasan: null
  };

  appLogs.unshift(newLog);
  saveLogsToStorage();
  updateRekapCounts();
  renderEbOperatorQueue();

  // Reset status panggilan aktif
  const bConn = document.getElementById('eb-call-connected-bar'); if (bConn) bConn.style.display = 'none';
  const dDur = document.getElementById('eb-call-duration'); if (dDur) dDur.innerText = 'Siap Menerima';
  if (ebCallInterval) clearInterval(ebCallInterval);

  if (langsungDisposisi) {
    bukaModalDisposisiPawas(newId);
  } else {
    alert('✓ Laporan #' + noTiket + ' Berhasil Masuk Antrean!\n\n• Sumber: Panggilan 110 (Call Center SPKT)\n• Status: Antrean Laporan Siap Disposisi\n• Anda dapat mengklik tombol "⚡ Disposisi" langsung pada kartu antrean di kanan.');
  }
}

let ebCallInterval = null;
let ebCallSeconds = 0;

function ebJawabPanggilan() {
  const banner = document.getElementById('eb-call-connected-bar');
  const timerText = document.getElementById('eb-live-timer');
  const durLabel = document.getElementById('eb-call-duration');

  if (banner) banner.style.display = 'flex';
  if (durLabel) durLabel.innerText = '📞 Tersambung';

  // Start Timer
  if (ebCallInterval) clearInterval(ebCallInterval);
  ebCallSeconds = 0;
  ebCallInterval = setInterval(() => {
    ebCallSeconds++;
    const mins = String(Math.floor(ebCallSeconds / 60)).padStart(2, '0');
    const secs = String(ebCallSeconds % 60).padStart(2, '0');
    if (timerText) timerText.innerText = `${mins}:${secs}`;
  }, 1000);

  const tel = document.getElementById('eb-op-telepon');
  if (tel) {
    tel.focus();
    tel.style.borderColor = '#10B981';
    setTimeout(() => tel.style.borderColor = '#CBD5E1', 1200);
  }
}

function setEbUrgensi(level) {
  const btnD = document.getElementById('eb-urg-darurat');
  const btnS = document.getElementById('eb-urg-sedang');
  const btnN = document.getElementById('eb-urg-normal');
  const input = document.getElementById('eb-op-urgensi');

  [btnD, btnS, btnN].forEach(b => {
    if (!b) return;
    b.style.border = '1px solid #CBD5E1';
    b.style.background = 'white';
    b.style.color = '#64748B';
  });

  if (level === 'darurat') {
    if (btnD) { btnD.style.border = '1.5px solid #EF4444'; btnD.style.background = '#FEF2F2'; btnD.style.color = '#DC2626'; }
    if (input) input.value = 'Prioritas Tinggi (Darurat)';
  } else if (level === 'sedang') {
    if (btnS) { btnS.style.border = '1.5px solid #F59E0B'; btnS.style.background = '#FFFBEB'; btnS.style.color = '#D97706'; }
    if (input) input.value = 'Prioritas Sedang (Disiagakan)';
  } else {
    if (btnN) { btnN.style.border = '1.5px solid #3B82F6'; btnN.style.background = '#EFF6FF'; btnN.style.color = '#1D4ED8'; }
    if (input) input.value = 'Normal / Reguler';
  }
}

function renderEbOperatorQueue() {
  const listEl = document.getElementById('eb-op-queue-list');
  const countEl = document.getElementById('eb-op-queue-count');
  if (!listEl) return;

  const pendingLogs = appLogs.filter(l => l.status === 'menunggu');
  if (countEl) countEl.innerText = pendingLogs.length;

  if (pendingLogs.length === 0) {
    listEl.innerHTML = '<div style="font-size:12px; color:var(--text-muted); text-align:center; padding:18px; background:#F8FAFC; border-radius:8px;">Semua laporan telah tervalidasi dan terdisposisi ke unit lapangan.</div>';
    return;
  }

  listEl.innerHTML = pendingLogs.slice(0, 6).map(l => {
    const nomorTiket = l.nomorTiket || ('TIKET-110-' + (l.id < 10 ? '0' + l.id : l.id) + 'X2F');
    return `
        <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:10px 12px; margin-bottom:10px; transition:all 0.15s ease;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <span style="font-size:10px; font-weight:700; background:#EFF6FF; color:#1D4ED8; padding:2px 6px; border-radius:4px;">
              ${l.sumberLaporan || '📞 Panggilan 110'}
            </span>
            <span style="font-size:10px; color:var(--text-muted); font-weight:600;">${l.waktu || ''}</span>
          </div>
          <div style="font-size:12.5px; font-weight:700; color:var(--text); line-height:1.35; margin-bottom:3px;">${l.title}</div>
          <div style="font-size:11px; color:var(--text-muted); margin-bottom:8px;">📍 ${l.lokasiKejadian || l.sektor || ''}</div>
          <div style="display:flex; justify-content:space-between; align-items:center; padding-top:8px; border-top:1px dashed #CBD5E1; gap:6px;">
            <button type="button" onclick="bukaDetailLaporanOperator(${l.id})"
              style="background:white; border:1px solid #CBD5E1; color:#334155; padding:5px 9px; border-radius:6px; font-size:11px; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:3px;">
              👁️ Rincian
            </button>
            <button type="button" onclick="bukaModalDisposisiPawas(${l.id})"
              style="background:linear-gradient(135deg, #153E75 0%, #1D4ED8 100%); border:none; color:white; padding:5px 12px; border-radius:6px; font-size:11px; font-weight:800; cursor:pointer; display:flex; align-items:center; gap:4px; box-shadow:0 2px 6px rgba(21,62,117,0.25);">
              <span>⚡ Disposisi</span> ➔
            </button>
          </div>
        </div>
      `;
  }).join('');
}

let activeDetailOperatorLogId = null;

function eksekusiDisposisiDariModalOperator() {
  if (!activeDetailOperatorLogId) return;
  const targetId = activeDetailOperatorLogId;
  tutupDetailLaporanOperator();
  bukaModalDisposisiPawas(targetId);
}

function bukaDetailLaporanOperator(id) {
  activeDetailOperatorLogId = id;
  const log = appLogs.find(l => l.id === id);
  if (!log) return;

  const modal = document.getElementById('operator-detail-modal');
  if (!modal) return;

  const tiket = log.nomorTiket || ('TIKET-110-' + (log.id < 10 ? '0' + log.id : log.id) + 'X2F');
  const waktu = log.waktu || 'Hari ini';

  const subEl = document.getElementById('op-modal-subtitle');
  if (subEl) subEl.innerText = `${tiket} • Dicatat Pukul ${waktu}`;

  // Status text & banner styling
  const statusTextEl = document.getElementById('op-modal-status-text');
  const phaseTagEl = document.getElementById('op-modal-phase-tag');
  const bannerEl = document.getElementById('op-modal-status-banner');

  if (log.status === 'menunggu') {
    if (statusTextEl) statusTextEl.innerText = 'Status: Menunggu Disposisi (Siap Diteruskan ke Unit)';
    if (phaseTagEl) phaseTagEl.innerText = 'Menunggu Disposisi';
    if (bannerEl) { bannerEl.style.background = '#FFFBEB'; bannerEl.style.borderBottomColor = '#FDE68A'; }
  } else if (log.status === 'diproses') {
    if (statusTextEl) statusTextEl.innerText = 'Status: Disetujui Pawas • Sedang Ditangani Personel di Lapangan';
    if (phaseTagEl) phaseTagEl.innerText = 'Penanganan Aktif';
    if (bannerEl) { bannerEl.style.background = '#EDE9FE'; bannerEl.style.borderBottomColor = '#DDD6FE'; }
  } else if (log.status === 'selesai') {
    if (statusTextEl) statusTextEl.innerText = 'Status: Kasus Selesai Ditangani & Telah Ditutup';
    if (phaseTagEl) phaseTagEl.innerText = 'Selesai';
    if (bannerEl) { bannerEl.style.background = '#ECFDF5'; bannerEl.style.borderBottomColor = '#A7F3D0'; }
  } else if (log.status === 'ditolak') {
    if (statusTextEl) statusTextEl.innerText = 'Status: Ditolak oleh Pawas (Perlu Koreksi)';
    if (phaseTagEl) phaseTagEl.innerText = 'Revisi';
    if (bannerEl) { bannerEl.style.background = '#FEF2F2'; bannerEl.style.borderBottomColor = '#FECACA'; }
  }

  // Data Pelapor
  const namaPelapor = (log.pelapor && log.pelapor.nama) || log.namaPelapor || log.nama || '';
  const telPelapor = (log.pelapor && log.pelapor.telepon) || log.noTelpPelapor || '';
  const pelNamaEl = document.getElementById('op-modal-pelapor-nama');
  if (pelNamaEl) pelNamaEl.innerText = namaPelapor;
  const pelTelEl = document.getElementById('op-modal-pelapor-tel');
  if (pelTelEl) pelTelEl.innerText = telPelapor;

  // Jenis insiden & urgensi
  const jenisEl = document.getElementById('op-modal-jenis');
  if (jenisEl) jenisEl.innerText = log.jenisInsiden || log.title || '';

  const urgEl = document.getElementById('op-modal-urgensi-badge');
  if (urgEl) {
    if (log.jenisInsiden?.includes('Tawuran') || log.title?.includes('Tawuran') || log.title?.includes('Kecelakaan') || log.urgensi?.includes('Darurat')) {
      urgEl.innerHTML = '🚨 DARURAT';
      urgEl.style.background = '#FEE2E2';
      urgEl.style.color = '#DC2626';
    } else if (log.title?.includes('Pidana') || log.title?.includes('Bencana') || log.urgensi?.includes('Sedang')) {
      urgEl.innerHTML = '⚠️ SEDANG';
      urgEl.style.background = '#FEF3C7';
      urgEl.style.color = '#D97706';
    } else {
      urgEl.innerHTML = 'ℹ️ NORMAL';
      urgEl.style.background = '#EFF6FF';
      urgEl.style.color = '#1D4ED8';
    }
  }

  // Lokasi & GPS
  const lokEl = document.getElementById('op-modal-lokasi');
  if (lokEl) lokEl.innerText = log.lokasiKejadian || log.sektor || '';
  const gpsEl = document.getElementById('op-modal-gps');
  if (gpsEl) gpsEl.innerText = log.koordinatGps || '';

  // Ringkasan Uraian
  const uraianEl = document.getElementById('op-modal-uraian');
  if (uraianEl) uraianEl.innerText = log.deskripsi ? `"${log.deskripsi}"` : '""';

  // Petugas
  const petEl = document.getElementById('op-modal-petugas');
  if (petEl) petEl.innerText = log.operatorNama || log.petugasPenerima || '';
  const waktuEl = document.getElementById('op-modal-waktu-catat');
  if (waktuEl) waktuEl.innerText = waktu;

  modal.style.display = 'flex';
}

function tutupDetailLaporanOperator() {
  const modal = document.getElementById('operator-detail-modal');
  if (modal) modal.style.display = 'none';
}

function ebAcakPanggilan() {
  const list = [
    { tel: '+62 813-7722-1109', nama: 'Bapak Hendra Gunawan', jenis: 'Laka Lantas (Tabrakan / Kemacetan)', loc: 'Jl. Jend. Sudirman Kav. 28, Jakarta Pusat', gps: '-6.2150, 106.8200', ket: 'Tabrakan antara sedan dan sepeda motor di jalur cepat, arus lalu lintas padat.' },
    { tel: '+62 856-1199-8833', nama: 'Ibu Maya Suryani', jenis: 'Kriminalitas (Pencurian / Begal / Curas)', loc: 'Jl. Tomang Asri Blok C No. 12, Jakarta Barat', gps: '-6.1750, 106.7900', ket: 'Percobaan pencurian sepeda motor di halaman rumah warga, pelaku melarikan diri.' },
    { tel: '+62 812-9844-3210', nama: 'Ibu Ratna Dewi', jenis: 'Kamtibmas (Tawuran / Keributan Warga)', loc: 'Jl. Panglima Polim Raya No. 42, Jakarta Selatan', gps: '-6.2415, 106.8021', ket: 'Sekelompok pemuda berkumpul membawa balok kayu di dekat pertokoan.' }
  ];
  const item = list[Math.floor(Math.random() * list.length)];
  const elCaller = document.getElementById('eb-sim-caller'); if (elCaller) elCaller.innerText = item.tel;
  const elTel = document.getElementById('eb-op-telepon'); if (elTel) elTel.value = item.tel;
  const elNama = document.getElementById('eb-op-nama'); if (elNama) elNama.value = item.nama;
  const elJenis = document.getElementById('eb-op-jenis'); if (elJenis) elJenis.value = item.jenis;
  const elLoc = document.getElementById('eb-op-lokasi'); if (elLoc) elLoc.value = item.loc;
  const elGps = document.getElementById('eb-op-gps'); if (elGps) elGps.value = item.gps;
  const elKet = document.getElementById('eb-op-uraian'); if (elKet) elKet.value = item.ket;
}

// ==================================
// MODAL PREVIEW BUKTI PENGADUAN & TINDAKAN
// ==================================
function previewFotoModal(type) {
  const modal = document.getElementById('lightbox-modal');
  if (!modal) return;
  const titleEl = document.getElementById('modal-foto-title');
  const subEl = document.getElementById('modal-foto-subtitle');
  const imgEl = document.getElementById('modal-foto-img');
  const descEl = document.getElementById('modal-foto-desc');
  const metaEl = document.getElementById('modal-foto-meta');

  const log = appLogs.find(l => l.id === selectedLogId);
  if (!log) return;

  const defaultFotoPengaduan = 'assets/images/polri_pengaduan_tkp.jpg';
  const defaultFotoPersiapan = 'assets/images/polri_patrol_car.jpg';
  const defaultFotoTindakan = 'assets/images/polri_tindakan_tkp.jpg';
  const defaultFotoSelesai = 'assets/images/polri_situasi_selesai.jpg';

  // Identifikasi Nama Petugas Lapangan (Bukan Nama Pelapor Warga/Sipil)
  const activeUser = typeof getActiveSessionUser === 'function' ? getActiveSessionUser() : null;
  const fallbackNama = activeUser ? (activeUser.nama + ' & Regu Operasional') : '';
  const fallbackNrp = activeUser ? activeUser.nrp : '';
  const namaPetugas = log.assignedNama
    || log.disposisi?.komandan
    || (log.tipePelapor === 'personel' ? log.nama : fallbackNama);
  const pimpinanSingkat = namaPetugas ? namaPetugas.split('&')[0].trim() : '';
  const nrpPetugas = log.assignedNrp
    || log.disposisi?.nrpKomandan
    || ((log.tipePelapor === 'personel' && log.nrp) ? log.nrp : fallbackNrp);
  const namaPelapor = (log.tipePelapor === 'personel') ? 'Personel Polisi' : (log.namaPelapor || log.nama || '');
  const noTelpPelapor = log.noTelpPelapor || (log.pelapor && log.pelapor.telepon) || '';

  // Format GPS agar rapi & terstandar (maks 4 desimal)
  const rawGps = log.koordinatGps || '';
  const cleanGps = rawGps.includes(',')
    ? rawGps.split(',').map(n => {
      const v = parseFloat(n.trim());
      return isNaN(v) ? n.trim() : v.toFixed(4);
    }).join(', ')
    : rawGps;

  if (type === 'pengaduan') {
    titleEl.innerHTML = '📷 Bukti Pengaduan Masyarakat (110)';
    subEl.innerText = (log.nomorTiket || '') + (log.waktu ? ' • Laporan: ' + log.waktu : '');
    let src = log.fotoPengaduan || getFotoPengaduanByKategori(log);
    if (src.includes('placehold.co') || src.includes('unsplash.com')) src = getFotoPengaduanByKategori(log);
    imgEl.onerror = function () {
      this.onerror = null;
      this.src = SVG_FALLBACK_PENGADUAN;
    };
    imgEl.src = src;
    descEl.innerText = 'Foto dokumentasi awal pelaporan: "' + (log.title || '') + '"' + ((log.lokasiKejadian || log.sektor) ? '. Lokasi: ' + (log.lokasiKejadian || log.sektor) : '');
    metaEl.innerText = (namaPelapor ? 'Pelapor: ' + namaPelapor : '') + (noTelpPelapor ? ' (Kontak: ' + noTelpPelapor + ')' : '');
  } else if (type === 'persiapan') {
    titleEl.innerHTML = '📷 Bukti Persiapan Keberangkatan (GPS)';
    subEl.innerText = pimpinanSingkat + ' • Koordinat GPS Terkunci';
    let src = log.fotoPersiapan || defaultFotoPersiapan;
    if (src.includes('placehold.co') || src.includes('unsplash.com')) src = defaultFotoPersiapan;
    imgEl.onerror = function () {
      this.onerror = null;
      this.src = SVG_FALLBACK_PERSIAPAN;
    };
    imgEl.src = src;
    descEl.innerText = 'Foto kesiapan personel sebelum meluncur.' + (cleanGps ? ' Koordinat: ' + cleanGps + '.' : '') + (log.catatanPersiapan ? ' Keterangan: "' + log.catatanPersiapan + '"' : '');
    metaEl.innerText = (namaPetugas ? 'Petugas: ' + namaPetugas : '') + (cleanGps ? ' • GPS: ' + cleanGps : '') + (log.waktuMeluncur || log.disposisi?.waktuDisposisi || log.waktu ? ' (Waktu: ' + (log.waktuMeluncur || log.disposisi?.waktuDisposisi || log.waktu) + ')' : '');
  } else if (type === 'selesai') {
    titleEl.innerHTML = '✅ Bukti Situasi Akhir & Kasus Selesai';
    subEl.innerText = (log.nomorTiket || '') + ' • Selesai Ditangani';
    let src = log.fotoSelesai || defaultFotoSelesai;
    if (src.includes('placehold.co') || src.includes('unsplash.com')) src = defaultFotoSelesai;
    imgEl.onerror = function () {
      this.onerror = null;
      this.src = SVG_FALLBACK_TINDAKAN;
    };
    imgEl.src = src;
    descEl.innerText = 'Foto dokumentasi penutupan kasus.' + (log.catatanSelesai ? ' Catatan: "' + log.catatanSelesai + '"' : '');
    metaEl.innerText = (namaPetugas ? 'Petugas Penindak: ' + namaPetugas : '') + (log.waktuSelesai || log.waktu ? ' • Waktu Selesai: ' + (log.waktuSelesai || log.waktu) : '');
  } else {
    titleEl.innerHTML = '📸 Bukti Tindakan & Respon Petugas di TKP';
    subEl.innerText = pimpinanSingkat + ' • Tahap ' + (log.tahap || 3) + '/5';
    let src = log.fotoTindakan || defaultFotoTindakan;
    if (src.includes('placehold.co') || src.includes('unsplash.com')) src = defaultFotoTindakan;
    imgEl.onerror = function () {
      this.onerror = null;
      this.src = SVG_FALLBACK_TINDAKAN;
    };
    imgEl.src = src;
    descEl.innerText = 'Foto respon penanganan lapangan oleh ' + namaPetugas + ' di TKP. Meliputi sterilisasi tempat kejadian, penertiban, dan pemulihan ketertiban umum. Catatan: "' + (log.deskripsiTindakan || 'Tindakan penertiban selesai sesuai SOP.') + '"';
    metaEl.innerText = 'Petugas Penindak: ' + namaPetugas + ' (NRP: ' + nrpPetugas + ')';
  }

  modal.style.display = 'flex';
}

function closeFotoModal() {
  const modal = document.getElementById('lightbox-modal');
  if (modal) modal.style.display = 'none';
}

// ==================================
// MODAL KEAMANAN & PIN KOMANDO
// ==================================
function bukaModalKeamananProfil() {
  const m = document.getElementById('modal-keamanan-profil');
  if (m) m.style.display = 'flex';
}

function tutupModalKeamananProfil() {
  const m = document.getElementById('modal-keamanan-profil');
  if (m) m.style.display = 'none';
}

function simpanKeamananProfil(e) {
  if (e) e.preventDefault();
  const pNew = document.getElementById('sec-new-pass')?.value;
  const pConf = document.getElementById('sec-conf-pass')?.value;

  if (pNew && pNew !== pConf) {
    alert('⚠️ Konfirmasi kata sandi baru tidak cocok. Silakan periksa kembali.');
    return;
  }

  tutupModalKeamananProfil();
  alert('✅ Kredensial Keamanan Berhasil Diperbarui!\n\n• PIN Komando 6-digit aktif.\n• Sinkronisasi 2FA Token SIPP Polri tersimpan secara aman.');
}




// ============================================================
// DYNAMIC EXECUTIVE KPI & FEED KOMANDO UNTUK PIMPINAN (PAWAS)
// ============================================================
let chartGaugeSlaPimpinanInstance = null;

function renderPimpinanExecutiveDashboard() {
  renderFeedKomandoPimpinan();
  renderPimpinanExecutiveKpi();
  renderPimpinanPersonelActivityTimeline();
}

function parseWaktuToMinutes(waktuStr) {
  if (!waktuStr) return 0;
  const match = String(waktuStr).match(/(\d{1,2}):(\d{2})/);
  if (match) {
    const hours = parseInt(match[1], 10);
    const mins = parseInt(match[2], 10);
    return (hours * 60) + mins;
  }
  return 0;
}

function formatMinutesToWib(mins) {
  const h = Math.floor(((mins % 1440) + 1440) % 1440 / 60);
  const m = Math.floor(((mins % 1440) + 1440) % 1440 % 60);
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ' WIB';
}

function renderPimpinanPersonelActivityTimeline() {
  const container = document.getElementById('pimpinan-personel-activity-timeline');
  if (!container) return;

  if (!appLogs || appLogs.length === 0) {
    container.innerHTML = '<div style="font-size:11.5px; color:#94A3B8; text-align:center; padding:12px;">Belum ada aktivitas personel tercatat.</div>';
    return;
  }

  // Helper resolusi identitas personel dan kesatuan resmi
  const resolvePetugas = (l) => {
    if (l.assignedNama) {
      const armada = (typeof DAFTAR_ARMADA_PRESISI !== 'undefined' && l.assignedUnitId)
        ? DAFTAR_ARMADA_PRESISI.find(a => a.id === l.assignedUnitId)
        : null;
      return { nama: l.assignedNama, unit: armada?.namaSingkat || l.disposisi?.unit || 'Samapta R-4' };
    }
    if (l.disposisi?.komandan) {
      return { nama: l.disposisi.komandan.split('(')[0].trim(), unit: l.disposisi.unit || 'Unit Presisi' };
    }
    if (l.tipePelapor === 'personel' && l.nama) {
      return { nama: l.nama, unit: l.kesatuan || 'Patroli Personel' };
    }
    if (l.sektor?.includes('Selatan')) return { nama: 'Bripka Ahmad Subagyo', unit: 'Samapta R-4 Selatan' };
    if (l.sektor?.includes('Barat')) return { nama: 'Aipda Rudi Hartono', unit: 'Tim Raimas R-2 Barat' };
    if (l.sektor?.includes('Pusat')) return { nama: 'Aiptu Bambang Sudrajat', unit: 'Turjawali Satlantas' };
    if (l.sektor?.includes('Timur')) return { nama: 'Aiptu Herman', unit: 'Samapta R-4 Timur' };
    if (l.sektor?.includes('Utara')) return { nama: 'Bripka Wahyu', unit: 'Tim Raimas R-2 Utara' };
    return { nama: 'Bripka Ahmad Subagyo', unit: 'Samapta R-4' };
  };

  // Pastikan log tiket 16 memiliki waktu operasional presisi sesuai alur
  const t16 = appLogs.find(l => String(l.id) === '16');
  if (t16) {
    t16.waktuMeluncur = '18:14 WIB';
    t16.catatanPersiapan = 'Personel lengkap, perlengkapan dinas siap, segera meluncur menuju TKP.';
    t16.waktuTiba = '20:06 WIB';
    if (!t16.disposisi) {
      t16.disposisi = { waktuDisposisi: '13:05 WIB', arahan: 'Datangi TKP dengan sirine biru, amankan perimeter.' };
    } else {
      t16.disposisi.waktuDisposisi = '13:05 WIB';
      if (!t16.disposisi.arahan) t16.disposisi.arahan = 'Datangi TKP dengan sirine biru, amankan perimeter.';
    }
  }

  const t28 = appLogs.find(l => String(l.id) === '28');
  if (t28) {
    t28.waktuTiba = '08:48 WIB';
    t28.waktuSelesai = '09:00 WIB';
  }

  // Pastikan log yang berstatus selesai memiliki riwayat operasional lengkap jika belum ada
  appLogs.forEach(l => {
    if (l.status === 'selesai') {
      const waktuSelesaiStr = l.pengesahanPawas?.waktu || l.waktuSelesai || l.waktu || '09:00 WIB';
      const totalMins = parseWaktuToMinutes(waktuSelesaiStr);
      const petugasInfo = resolvePetugas(l);

      if (!l.waktuSelesai) l.waktuSelesai = waktuSelesaiStr;
      if (!l.waktuTiba) l.waktuTiba = formatMinutesToWib(totalMins - 12);
      if (!l.waktuMeluncur) l.waktuMeluncur = formatMinutesToWib(totalMins - 20);

      if (!l.disposisi) {
        l.disposisi = {
          unit: petugasInfo.unit,
          unitId: l.assignedUnitId || 'patroli-presisi',
          komandan: petugasInfo.nama,
          waktuDisposisi: formatMinutesToWib(totalMins - 25),
          arahan: 'Respon cepat laporan "' + (l.title || l.jenisInsiden || 'Kamtibmas') + '", amankan lokasi.'
        };
      } else if (!l.disposisi.waktuDisposisi) {
        l.disposisi.waktuDisposisi = formatMinutesToWib(totalMins - 25);
      }

      if (!l.catatanPersiapan) {
        l.catatanPersiapan = 'Armada ' + (l.disposisi?.unit || petugasInfo.unit) + ' bergegas meluncur menuju TKP.';
      }
      if (!l.deskripsiTindakan) {
        l.deskripsiTindakan = 'Petugas tiba di lokasi "' + (l.lokasiKejadian || 'TKP') + '" melaksanakan tindakan kepolisian pertama.';
      }
      if (!l.catatanSelesai) {
        l.catatanSelesai = 'Situasi telah aman dan kondusif, tugas penanganan rampung sesuai SOP Polri Presisi 110.';
      }
    }
  });

  const allEvents = [];

  // =========================================================================
  // EKSTRAKSI RIWAYAT OPERASIONAL LENGKAP PER-TIKET
  // =========================================================================
  appLogs.forEach(l => {
    const petugasInfo = resolvePetugas(l);
    const namaPetugas = petugasInfo.nama;
    const unitPetugas = petugasInfo.unit;
    const judulLog = l.title || l.jenisInsiden || 'Laporan Kamtibmas';
    const tglTeks = l.tanggal || (typeof formatTanggalIndo === 'function' ? formatTanggalIndo() : 'Hari ini');

        // 1. TAHAP 5: Kasus Selesai Ditangani (atau Menunggu Pengesahan)
    if (l.status === 'selesai' || l.status === 'menunggu_pengesahan' || l.waktuSelesai || l.pengesahanPawas) {
      const isSelesai = l.status === 'selesai';
      const waktuEvent = l.pengesahanPawas?.waktu || l.waktuSelesai || l.waktu;
      if (waktuEvent) {
        allEvents.push({
          id: l.id,
          nama: namaPetugas,
          unit: unitPetugas,
          status: isSelesai ? 'selesai' : 'pengesahan',
          aksi: isSelesai ? '✓ Kasus Selesai Ditangani' : '⏳ Menunggu Pengesahan Pawas',
          keterangan: l.pengesahanPawas?.catatan || l.catatanSelesai || (isSelesai ? ('Penanganan kasus "' + judulLog + '" tuntas sesuai SOP Polri Presisi.') : 'Laporan penanganan dikirim, menunggu pengesahan Pawas.'),
          waktu: waktuEvent,
          tanggalTeks: tglTeks,
          waktuMinutes: parseWaktuToMinutes(waktuEvent),
          tahapSort: 5,
          timestamp: l._updatedAt || 0,
          badgeText: isSelesai ? '✓ TUNTAS' : '⏳ PENGESAHAN',
          badgeBg: isSelesai ? '#F0FDF4' : '#FAF5FF',
          badgeColor: isSelesai ? '#16A34A' : '#7C3AED',
          badgeBorder: isSelesai ? '#BBF7D0' : '#E9D5FF',
          dotClass: isSelesai ? 'green' : 'purple'
        });
      }
    }

    // 2. TAHAP 4: Penanganan di TKP (Waktu Tiba)
    if (l.waktuTiba) {
      allEvents.push({
        id: l.id,
        nama: namaPetugas,
        unit: unitPetugas,
        status: 'tkp',
        aksi: '📍 Penanganan di TKP',
        keterangan: l.deskripsiTindakan || ('Petugas tiba di lokasi "' + (l.lokasiKejadian || 'TKP') + '" melaksanakan tindakan kepolisian pertama.'),
        waktu: l.waktuTiba,
        tanggalTeks: tglTeks,
        waktuMinutes: parseWaktuToMinutes(l.waktuTiba),
        tahapSort: 4,
        timestamp: l._updatedAt || 0,
        badgeText: '📍 DI TKP',
        badgeBg: '#EFF6FF',
        badgeColor: '#1D4ED8',
        badgeBorder: '#BFDBFE',
        dotClass: 'blue'
      });
    }

    // 3. TAHAP 3: Personel Menuju Lokasi (Waktu Meluncur)
    if (l.waktuMeluncur) {
      allEvents.push({
        id: l.id,
        nama: namaPetugas,
        unit: unitPetugas,
        status: 'meluncur',
        aksi: '⚡ Personel Menuju Lokasi',
        keterangan: l.catatanPersiapan || ('Armada ' + unitPetugas + ' meluncur cepat menuju lokasi "' + (l.lokasiKejadian || 'TKP') + '".'),
        waktu: l.waktuMeluncur,
        tanggalTeks: tglTeks,
        waktuMinutes: parseWaktuToMinutes(l.waktuMeluncur),
        tahapSort: 3,
        timestamp: l._updatedAt || 0,
        badgeText: '⚡ MELUNCUR',
        badgeBg: '#FFFBEB',
        badgeColor: '#D97706',
        badgeBorder: '#FDE68A',
        dotClass: 'yellow'
      });
    }

    // 4. TAHAP 2: Disposisi Unit Terdekat
    if (l.disposisi && l.disposisi.waktuDisposisi) {
      allEvents.push({
        id: l.id,
        nama: namaPetugas,
        unit: unitPetugas,
        status: 'disposisi',
        aksi: '📋 Disposisi Unit Terdekat',
        keterangan: l.disposisi.arahan ? ('Arahan Pawas: "' + l.disposisi.arahan + '"') : ('Penugasan penanganan insiden "' + judulLog + '".'),
        waktu: l.disposisi.waktuDisposisi,
        tanggalTeks: tglTeks,
        waktuMinutes: parseWaktuToMinutes(l.disposisi.waktuDisposisi),
        tahapSort: 2,
        timestamp: l._updatedAt || 0,
        badgeText: '📋 DISPOSISI',
        badgeBg: '#F1F5F9',
        badgeColor: '#475569',
        badgeBorder: '#CBD5E1',
        dotClass: 'blue'
      });
    }

  });

  // =========================================================================
  // PENGURUTAN KRONOLOGIS MENYELURUH (TANGGAL & WAKTU TERBARU PALING ATAS)
  // =========================================================================
  allEvents.sort((a, b) => {
    if (b.timestamp !== a.timestamp && (b.timestamp > 0 || a.timestamp > 0)) {
      return b.timestamp - a.timestamp;
    }
    if (b.waktuMinutes !== a.waktuMinutes) {
      return b.waktuMinutes - a.waktuMinutes;
    }
    if (b.tahapSort !== a.tahapSort) {
      return b.tahapSort - a.tahapSort;
    }
    return (b.id || 0) - (a.id || 0);
  });

  // Tampilkan top 6 riwayat operasional terkini
  const displayActivities = allEvents.slice(0, 6);

  let html = '';
  displayActivities.forEach((act, idx) => {
    const isLast = idx === displayActivities.length - 1;
    html += `
      <div class="tl-item" style="${isLast ? 'margin-bottom:0;' : 'margin-bottom:12px;'} cursor:pointer;" onclick="switchTab('view-validasi'); selectLogCard(${act.id});" title="Klik untuk lihat detail tiket #${act.id}">
        <div class="tl-dot ${act.dotClass}"></div>
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
          <div style="min-width:0; flex:1;">
            <div style="display:flex; align-items:center; gap:5px; flex-wrap:wrap;">
              <span style="font-weight:800; font-size:12px; color:var(--text); white-space:normal;">${act.nama}</span>
              <span style="font-size:10px; color:#64748B; font-weight:700;">• 📅 ${act.tanggalTeks}, ${act.waktu}</span>
            </div>
            <div style="font-size:11px; font-weight:700; color:#1E40AF; margin-top:2px;">
              ${act.aksi}
            </div>
            <div style="font-size:10.5px; color:#475569; margin-top:2px; line-height:1.35; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">
              ${act.keterangan}
            </div>
          </div>
          <span style="font-size:9.5px; font-weight:800; background:${act.badgeBg}; color:${act.badgeColor}; padding:2px 6px; border-radius:4px; border:1px solid ${act.badgeBorder}; white-space:nowrap; flex-shrink:0;">
            ${act.badgeText}
          </span>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

function renderFeedKomandoPimpinan() {
  const container = document.getElementById('pimpinan-ops-timeline');
  if (!container) return;

  if (!appLogs || appLogs.length === 0) {
    container.innerHTML = '<div style="font-size:12px; color:#94A3B8; text-align:center; padding:16px;">Belum ada riwayat aktivitas penugasan.</div>';
    return;
  }

  // Ambil 4 insiden paling relevan / prioritas
  // Prioritaskan: diproses (sedang berlangsung) -> menunggu_pengesahan -> menunggu -> selesai
  const activeOrRecentLogs = [...appLogs].sort((a, b) => {
    const score = (item) => {
      if (item.status === 'diproses') return 4;
      if (item.status === 'menunggu_pengesahan') return 3;
      if (item.status === 'menunggu') return 2;
      if (item.status === 'selesai') return 1;
      return 0;
    };
    const diff = score(b) - score(a);
    if (diff !== 0) return diff;
    return (b.id || 0) - (a.id || 0);
  }).slice(0, 4);

  let html = '';
  activeOrRecentLogs.forEach((log, index) => {
    let dotClass = 'blue';
    let badgeStyle = 'background:#EFF6FF; color:#1D4ED8; border:1px solid #BFDBFE;';
    let badgeText = 'STATUS SIAGA';
    let subtext = '';

    const namaAktor = log.assignedNama || log.disposisi?.komandan || log.nama || 'Petugas';
    const judul = log.title || (log.jenisInsiden ? ('Penanganan ' + log.jenisInsiden) : '');
    const waktuTeks = log.waktu || '';

    if (log.status === 'menunggu') {
      dotClass = 'red';
      badgeStyle = 'background:#FEF2F2; color:#DC2626; border:1px solid #FECACA;';
      badgeText = '🚨 BUTUH DISPOSISI';
      subtext = `Laporan masuk dari ${log.pelapor?.nama || log.nama || 'Warga'} di ${log.lokasiKejadian || 'TKP'}. Menunggu arahan & disposisi armada dari Pawas.`;
    } else if (log.status === 'diproses') {
      dotClass = 'yellow';
      badgeStyle = 'background:#FFFBEB; color:#D97706; border:1px solid #FDE68A;';
      badgeText = log.tahap === 3 ? '⚡ UNIT MELUNCUR' : (log.tahap === 4 ? '📍 TINDAKAN TKP' : '⏳ VERIFIKASI');
      const unitNama = log.disposisi?.unit || log.assignedUnitId || 'Unit Reaksi Cepat';
      const arahan = log.disposisi?.arahan ? ` • Arahan: "${log.disposisi.arahan}"` : '';
      subtext = `Armada: ${unitNama} (${namaAktor}) merespon di lokasi kejadian.${arahan}`;
    } else if (log.status === 'menunggu_pengesahan') {
      dotClass = 'purple';
      badgeStyle = 'background:#FAF5FF; color:#7E22CE; border:1px solid #E9D5FF;';
      badgeText = '📝 BAP TERKIRIM';
      const unitNama = log.disposisi?.unit || log.assignedUnitId || 'Unit Lapangan';
      subtext = `Armada: ${unitNama} (${namaAktor}) telah menyelesaikan tindakan TKP & mengirim BAP. Menunggu pengesahan akhir Pawas.`;
    } else if (log.status === 'selesai') {
      dotClass = 'green';
      badgeStyle = 'background:#F0FDF4; color:#16A34A; border:1px solid #BBF7D0;';
      const bintang = log.ratingKepuasan?.bintang ? ` (⭐ ${log.ratingKepuasan.bintang}.0)` : '';
      badgeText = `✓ KASUS TUNTAS${bintang}`;
      subtext = `Penanganan diselesaikan oleh ${namaAktor}. ${log.catatanSelesai || 'Situasi aman terkendali.'}`;
    } else if (log.status === 'ditolak') {
      dotClass = 'gray';
      badgeStyle = 'background:#F1F5F9; color:#64748B; border:1px solid #CBD5E1;';
      badgeText = '✕ DITOLAK';
      subtext = `Laporan ditolak oleh Pawas. Alasan: ${log.alasanTolak || 'Laporan Tidak Valid'}`;
    }

    const isLast = index === activeOrRecentLogs.length - 1;
    html += `
      <div class="tl-item" style="${isLast ? 'margin-bottom:0;' : ''} cursor:pointer;" onclick="switchTab('view-validasi'); selectLogCard(${log.id});" title="Klik untuk inspeksi penugasan #${log.nomorTiket || log.id}">
        <div class="tl-dot ${dotClass}"></div>
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px;">
          <div>
            <div style="font-weight:800; font-size:13px; color:var(--text);">${waktuTeks} - ${judul}</div>
            <div style="font-size:11.5px; color:#475569; margin-top:2px; line-height:1.4;">${subtext}</div>
          </div>
          <span style="font-size:10px; font-weight:800; padding:3px 8px; border-radius:6px; white-space:nowrap; ${badgeStyle}">
            ${badgeText}
          </span>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

function renderPimpinanExecutiveKpi() {
  if (!appLogs || appLogs.length === 0) return;

  // 1. HITUNG RATA-RATA WAKTU TANGGAP PATROLI DARI DATA
  let totalMenit = 0;
  let countMenit = 0;
  let lt5Count = 0;
  let range5to10Count = 0;
  let gt10Count = 0;

  appLogs.forEach(l => {
    let durasi = l.slaDurasiMenit;
    if (!durasi) {
      if (l.status === 'selesai' || l.status === 'diproses') {
        durasi = (l.id % 6) + 4; // realistic 4-9 mins
      }
    }
    if (durasi) {
      totalMenit += durasi;
      countMenit++;
      if (durasi < 5) lt5Count++;
      else if (durasi <= 10) range5to10Count++;
      else gt10Count++;
    }
  });

  const avgMenit = countMenit > 0 ? (totalMenit / countMenit).toFixed(1) : '7.4';
  const onTimePercent = countMenit > 0 ? (((lt5Count + range5to10Count) / countMenit) * 100).toFixed(1) : '94.8';
  const lt5Percent = countMenit > 0 ? Math.round((lt5Count / countMenit) * 100) : 65;
  const range5to10Percent = countMenit > 0 ? Math.round((range5to10Count / countMenit) * 100) : 30;
  const gt10Percent = countMenit > 0 ? Math.round((gt10Count / countMenit) * 100) : 5;

  const elAvgMenit = document.getElementById('pimpinan-sla-avg-menit');
  if (elAvgMenit) elAvgMenit.innerText = avgMenit;

  const elOnTime = document.getElementById('pimpinan-sla-on-time-text');
  if (elOnTime) elOnTime.innerHTML = `<span>✓</span> Tepat Waktu: ${onTimePercent}%`;

  const elLt5 = document.getElementById('pimpinan-sla-lt5');
  if (elLt5) elLt5.innerText = `${lt5Count} (${lt5Percent}%)`;

  const el5to10 = document.getElementById('pimpinan-sla-5to10');
  if (el5to10) el5to10.innerText = `${range5to10Count} (${range5to10Percent}%)`;

  const elGt10 = document.getElementById('pimpinan-sla-gt10');
  if (elGt10) elGt10.innerText = `${gt10Count} (${gt10Percent}%)`;

  // Update Doughnut SLA Chart
  const gSla = document.getElementById('gauge-sla-pimpinan');
  if (gSla) {
    const valOnTime = parseFloat(onTimePercent);
    const valLate = Math.max(0, 100 - valOnTime);
    if (chartGaugeSlaPimpinanInstance) {
      chartGaugeSlaPimpinanInstance.data.datasets[0].data = [valOnTime, valLate];
      chartGaugeSlaPimpinanInstance.update();
    } else {
      chartGaugeSlaPimpinanInstance = new Chart(gSla, {
        type: 'doughnut',
        data: {
          datasets: [{
            data: [valOnTime, valLate],
            backgroundColor: ['#15803D', '#E2E8F0'],
            borderWidth: 0,
            circumference: 360
          }]
        },
        options: {
          maintainAspectRatio: false,
          cutout: '75%',
          plugins: { tooltip: { enabled: false } }
        }
      });
    }
  }

  // 2. HITUNG KUAT PERSONEL & RANMOR TERGELAR DARI ROSTER & AKTIVITAS AKTIF
  const totalRosterPersonel = (typeof ROSTER_PERSONEL !== 'undefined' ? ROSTER_PERSONEL.length : 5) * 8 + 6; // 46 pers
  const tugasCount = appLogs.filter(l => l.status === 'diproses').length;
  const persBertugas = Math.min(totalRosterPersonel - 10, Math.max(6, tugasCount * 4));
  const persCadangan = 12;
  const persSiaga = Math.max(10, totalRosterPersonel - persBertugas - persCadangan);

  const elTotalPers = document.getElementById('pimpinan-total-personel-badge');
  if (elTotalPers) elTotalPers.innerText = `TOTAL ${totalRosterPersonel} PERSONEL`;

  const elPersSiaga = document.getElementById('pimpinan-pers-siaga');
  if (elPersSiaga) elPersSiaga.innerText = `${persSiaga} Pers`;

  const elPersTugas = document.getElementById('pimpinan-pers-tugas');
  if (elPersTugas) elPersTugas.innerText = `${persBertugas} Pers`;

  const elPersCadangan = document.getElementById('pimpinan-pers-cadangan');
  if (elPersCadangan) elPersCadangan.innerText = `${persCadangan} Pers`;

  // 3. HITUNG INDEKS KEPUASAN WARGA (IKM) SECARA DINAMIS DARI SELURUH PERSONEL & VOTING MASYARAKAT
  // Menyaring seluruh log kasus yang telah memiliki penilaian rating/voting dari warga
  const ratedLogs = appLogs.filter(l => l.ratingKepuasan && (l.ratingKepuasan.bintang || l.ratingKepuasan.skor));
  let sumStars = 0;
  let ulasanTerbaru = null;

  // Urutkan rating dari yang paling mutakhir (berdasarkan id tiket terbesar / waktu)
  const sortedRatedLogs = [...ratedLogs].sort((a, b) => (b.id || 0) - (a.id || 0));

  sortedRatedLogs.forEach(l => {
    const starVal = Number(l.ratingKepuasan.bintang || l.ratingKepuasan.skor || 5);
    sumStars += starVal;
    if (!ulasanTerbaru && l.ratingKepuasan.ulasan) {
      ulasanTerbaru = {
        ulasan: l.ratingKepuasan.ulasan,
        penulis: l.ratingKepuasan.nama || l.pelapor?.nama || l.nama || 'Warga Masyarakat',
        lokasi: l.lokasiKejadian ? l.lokasiKejadian.split(',')[0] : 'Wilayah Hukum',
        petugas: l.assignedNama || l.disposisi?.komandan || 'Personel Presisi'
      };
    }
  });

  const totalReviews = ratedLogs.length; // Jumlah voting riil masyarakat
  const ikmScore = totalReviews > 0 ? (sumStars / totalReviews).toFixed(1) : '0.0';
  const ikmPercent = totalReviews > 0 ? ((parseFloat(ikmScore) / 5) * 100).toFixed(1) : '0.0';

  const elIkmScore = document.getElementById('pimpinan-ikm-score');
  if (elIkmScore) elIkmScore.innerText = ikmScore;

  const elIkmPercent = document.getElementById('pimpinan-ikm-percent');
  if (elIkmPercent) {
    elIkmPercent.innerText = totalReviews > 0 ? `${ikmPercent}% Warga Menyatakan Puas` : 'Belum Ada Penilaian Warga';
  }

  const elIkmCount = document.getElementById('pimpinan-ikm-count');
  if (elIkmCount) {
    elIkmCount.innerText = `${totalReviews} Ulasan (Voting)`;
  }

  const elIkmStars = document.getElementById('pimpinan-ikm-stars');
  if (elIkmStars) {
    const roundedStars = Math.round(parseFloat(ikmScore)) || 5;
    elIkmStars.innerText = '⭐'.repeat(Math.max(1, Math.min(5, roundedStars)));
  }

  const elQuote = document.getElementById('pimpinan-ikm-quote');
  const elAuthor = document.getElementById('pimpinan-ikm-author');
  if (ulasanTerbaru) {
    if (elQuote) elQuote.innerText = `"${ulasanTerbaru.ulasan}"`;
    if (elAuthor) {
      const aktorInfo = ulasanTerbaru.petugas ? ` • Penangan: ${ulasanTerbaru.petugas}` : '';
      elAuthor.innerText = `— ${ulasanTerbaru.penulis} (${ulasanTerbaru.lokasi})${aktorInfo}`;
    }
  } else {
    if (elQuote) elQuote.innerText = `"Menunggu masukan & survei kepuasan masyarakat dari penanganan kasus yang telah tuntas."`;
    if (elAuthor) elAuthor.innerText = `— Sistem Survei Presisi 110 (Command Center)`;
  }
}

// ============================================================
// AUDIT & DETAIL MODALS UNTUK 3 EXECUTIVE KPI CARDS PIMPINAN
// ============================================================

let currentSlaFilter = 'all';
let currentPersonelFilter = 'semua';
let currentIkmFilter = 'semua';

// ------------------------------------------------------------
// 1. DETAIL MODAL WAKTU TANGGAP PATROLI (SLA QUICK RESPONSE 110)
// ------------------------------------------------------------
function bukaModalDetailSlaPimpinan() {
  const modal = document.getElementById('modal-detail-sla-pimpinan');
  if (!modal) return;
  modal.style.display = 'flex';
  filterModalDetailSla(currentSlaFilter || 'all');
}

function tutupModalDetailSlaPimpinan() {
  const modal = document.getElementById('modal-detail-sla-pimpinan');
  if (modal) modal.style.display = 'none';
}

function filterModalDetailSla(filterKey) {
  currentSlaFilter = filterKey;
  // Update button active states
  ['all', 'lt5', '5to10', 'gt10'].forEach(k => {
    const btn = document.getElementById('tab-sla-' + k);
    if (btn) {
      if (k === filterKey) {
        btn.style.background = '#153E75';
        btn.style.color = 'white';
        btn.style.border = 'none';
        btn.style.fontWeight = '800';
      } else {
        btn.style.background = 'white';
        btn.style.color = '#334155';
        btn.style.border = '1px solid #CBD5E1';
        btn.style.fontWeight = '700';
      }
    }
  });

  renderModalDetailSlaList(filterKey);
}

function renderModalDetailSlaList(filterKey) {
  const container = document.getElementById('modal-sla-list-container');
  if (!container || !appLogs) return;

  // Siapkan data SLA untuk seluruh tiket
  let totalMenit = 0;
  let countMenit = 0;
  let lt5Count = 0;
  let range5to10Count = 0;
  let gt10Count = 0;

  const logsWithSla = appLogs.map(l => {
    let durasi = l.slaDurasiMenit;
    if (!durasi) {
      if (l.status === 'selesai' || l.status === 'diproses') {
        durasi = (l.id % 6) + 4; // 4-9 mins
      } else {
        durasi = (l.id % 7) + 5;
      }
    }
    totalMenit += durasi;
    countMenit++;
    if (durasi < 5) lt5Count++;
    else if (durasi <= 10) range5to10Count++;
    else gt10Count++;

    return {
      log: l,
      durasi: durasi,
      kategori: durasi < 5 ? 'lt5' : durasi <= 10 ? '5to10' : 'gt10'
    };
  });

  // Update ringkasan KPI di modal
  const avg = countMenit > 0 ? (totalMenit / countMenit).toFixed(1) : '7.4';
  const onTimePct = countMenit > 0 ? (((lt5Count + range5to10Count) / countMenit) * 100).toFixed(1) : '94.8';

  const elAvg = document.getElementById('modal-sla-kpi-avg');
  if (elAvg) elAvg.innerHTML = `${avg} <span style="font-size:11px; font-weight:700; color:#64748B;">MENIT</span>`;

  const elPct = document.getElementById('modal-sla-kpi-percent');
  if (elPct) elPct.innerText = `${onTimePct}%`;

  const elLt5 = document.getElementById('modal-sla-kpi-lt5');
  if (elLt5) elLt5.innerText = `${lt5Count} Kasus`;

  const el5to10 = document.getElementById('modal-sla-kpi-5to10');
  if (el5to10) el5to10.innerText = `${range5to10Count} Kasus`;

  const elGt10 = document.getElementById('modal-sla-kpi-gt10');
  if (elGt10) elGt10.innerText = `${gt10Count} Kasus`;

  const elTabAll = document.getElementById('count-sla-tab-all');
  if (elTabAll) elTabAll.innerText = countMenit;

  // Filter logs yang akan ditampilkan
  let filtered = logsWithSla;
  if (filterKey === 'lt5') filtered = logsWithSla.filter(x => x.kategori === 'lt5');
  else if (filterKey === '5to10') filtered = logsWithSla.filter(x => x.kategori === '5to10');
  else if (filterKey === 'gt10') filtered = logsWithSla.filter(x => x.kategori === 'gt10');

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:30px; background:white; border-radius:10px; border:1px dashed #CBD5E1; color:#64748B;">
        <span style="font-size:24px;">📭</span>
        <div style="font-weight:700; margin-top:6px;">Tidak ada kasus dalam kategori filter ini.</div>
      </div>
    `;
    return;
  }

  let html = '';
  filtered.forEach(item => {
    const l = item.log;
    const durasi = item.durasi;
    let badgeBg = '#F0FDF4';
    let badgeColor = '#15803D';
    let badgeBorder = '#BBF7D0';
    let badgeText = `⚡ SANGAT CEPAT (${durasi} Menit)`;

    if (item.kategori === '5to10') {
      badgeBg = '#EFF6FF';
      badgeColor = '#1D4ED8';
      badgeBorder = '#BFDBFE';
      badgeText = `✓ SESUAI SOP (${durasi} Menit)`;
    } else if (item.kategori === 'gt10') {
      badgeBg = '#FEF2F2';
      badgeColor = '#DC2626';
      badgeBorder = '#FECACA';
      badgeText = `⚠️ MELEBIHI TARGET (${durasi} Menit)`;
    }

    const unitInfo = l.disposisi?.unit || l.assignedUnitId || 'Unit Patroli Samapta R4';
    const komandanInfo = l.assignedNama || l.disposisi?.komandan || 'Regu Patroli Presisi';
    const waktuLapor = l.waktu || '10:00 WIB';
    const waktuTiba = l.waktuTiba || (l.waktuMeluncur ? '± ' + durasi + ' mnt stlh lapor' : 'Tercatat ' + durasi + ' mnt');

    html += `
      <div style="background:white; border:1px solid #E2E8F0; border-radius:12px; padding:12px 14px; box-shadow:0 1px 3px rgba(0,0,0,0.04); display:flex; flex-direction:column; gap:8px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:8px;">
          <div>
            <div style="display:flex; align-items:center; gap:6px; margin-bottom:2px;">
              <span style="font-family:monospace; font-weight:800; color:#1E40AF; background:#EFF6FF; padding:1px 6px; border-radius:4px; font-size:11px;">${l.nomorTiket || ('TIKET-110-' + l.id)}</span>
              <span style="font-weight:800; font-size:13px; color:#0F172A;">${l.jenisInsiden || l.title || 'Laporan Kamtibmas'}</span>
            </div>
            <div style="font-size:11.5px; color:#475569; display:flex; align-items:center; gap:4px;">
              <span>📍</span> ${l.lokasiKejadian || l.sektor || 'Wilayah Hukum Jakarta'}
            </div>
          </div>
          <span style="background:${badgeBg}; color:${badgeColor}; border:1px solid ${badgeBorder}; font-weight:800; font-size:11px; padding:3px 10px; border-radius:6px; white-space:nowrap;">
            ${badgeText}
          </span>
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:8px; background:#F8FAFC; border:1px solid #F1F5F9; border-radius:8px; padding:8px 10px; font-size:11px;">
          <div>
            <span style="color:#64748B;">🚔 Unit Petugas:</span>
            <div style="font-weight:700; color:#1E293B; margin-top:1px;">${unitInfo}</div>
          </div>
          <div>
            <span style="color:#64748B;">👤 Komandan / Pimpinan:</span>
            <div style="font-weight:700; color:#153E75; margin-top:1px;">${komandanInfo}</div>
          </div>
          <div>
            <span style="color:#64748B;">🕒 Rantai Waktu:</span>
            <div style="font-weight:700; color:#0F172A; margin-top:1px;">Masuk: ${waktuLapor} ➔ Tiba: ${waktuTiba}</div>
          </div>
          <div>
            <span style="color:#64748B;">⏱️ Respon Time:</span>
            <div style="font-weight:800; color:${badgeColor}; margin-top:1px;">${durasi} Menit (Target &lt; 10m)</div>
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

// ------------------------------------------------------------
// 2. DETAIL MODAL KUAT PERSONEL & RANMOR TERGELAR
// ------------------------------------------------------------
function bukaModalDetailKuatPersonel() {
  const modal = document.getElementById('modal-detail-kuat-personel');
  if (!modal) return;
  modal.style.display = 'flex';
  filterModalDetailPersonel(currentPersonelFilter || 'semua');
}

function tutupModalDetailKuatPersonel() {
  const modal = document.getElementById('modal-detail-kuat-personel');
  if (modal) modal.style.display = 'none';
}

function filterModalDetailPersonel(filterKey) {
  currentPersonelFilter = filterKey;
  // Update button active states
  ['semua', 'tugas', 'siaga', 'cadangan', 'ranmor'].forEach(k => {
    const btn = document.getElementById('tab-pers-' + k);
    if (btn) {
      if (k === filterKey) {
        btn.style.background = '#1E3A8A';
        btn.style.color = 'white';
        btn.style.border = 'none';
        btn.style.fontWeight = '800';
      } else {
        btn.style.background = 'white';
        btn.style.color = '#334155';
        btn.style.border = '1px solid #CBD5E1';
        btn.style.fontWeight = '700';
      }
    }
  });

  renderModalDetailPersonelList(filterKey);
}

function renderModalDetailPersonelList(filterKey) {
  const container = document.getElementById('modal-personel-list-container');
  if (!container) return;

  // Hitung ulang distribusi
  const totalRosterPersonel = (typeof ROSTER_PERSONEL !== 'undefined' ? ROSTER_PERSONEL.length : 5) * 8 + 6; // 46 pers
  const tugasCount = appLogs ? appLogs.filter(l => l.status === 'diproses').length : 0;
  const persBertugas = Math.min(totalRosterPersonel - 10, Math.max(6, tugasCount * 4));
  const persCadangan = 12;
  const persSiaga = Math.max(10, totalRosterPersonel - persBertugas - persCadangan);

  // Update KPI chips
  const elTot = document.getElementById('modal-pers-kpi-total');
  if (elTot) elTot.innerText = `${totalRosterPersonel} PERS`;
  const elSiaga = document.getElementById('modal-pers-kpi-siaga');
  if (elSiaga) elSiaga.innerText = `${persSiaga} Pers`;
  const elTugas = document.getElementById('modal-pers-kpi-tugas');
  if (elTugas) elTugas.innerText = `${persBertugas} Pers`;
  const elCad = document.getElementById('modal-pers-kpi-cadangan');
  if (elCad) elCad.innerText = `${persCadangan} Pers`;

  // DATASET RINCIAN RESMI KUAT PERSONEL & ARMADA
  const DAFTAR_GELAR_PERSONEL = [
    // 1. Bertugas / Di TKP
    {
      kategori: 'tugas',
      regu: 'Unit Patroli Samapta Presisi R4 (Regu Alpha)',
      statusBadge: '🔵 Meluncur / Di TKP',
      statusColor: '#1E40AF',
      statusBg: '#EFF6FF',
      komandan: 'Bripka Ahmad Subagyo (NRP 95020123)',
      kekuatan: '4 Personel Lengkap (Bripka Ahmad, Bripda Kevin, Bripda Reza, Bharada Doni)',
      ranmor: 'Sedan Patroli Mazda 6 Presisi (No Pol 1022-VII)',
      alkom: 'Radio Motorola APX 8000 Ch 110 & Bodycam Aktif #BC-0412',
      lokasiOperasi: 'Sektor Sudirman - Simprug (Menangani Laporan Aktif Tawuran / Mediasi)',
      tiketAktif: 'TIKET-110-16X2F'
    },
    {
      kategori: 'tugas',
      regu: 'Tim Raimas Reaksi Cepat R2 (Regu Motoris)',
      statusBadge: '🔵 Meluncur / Di TKP',
      statusColor: '#1E40AF',
      statusBg: '#EFF6FF',
      komandan: 'Aipda Rudi Hartono (NRP 50129841)',
      kekuatan: '4 Personel Motoris Trail (Aipda Rudi, Bripka Dedi, Briptu Ilham, Bripda Fajar)',
      ranmor: '2 Unit Kawasaki KLX 250 Dual Sport (No Pol 2201-VII & 2202-VII)',
      alkom: 'Radio HT Portable & Headset Taktis Presisi',
      lokasiOperasi: 'Patroli Mobilitas Cepat Jalur Rawan Barito - Blok M',
      tiketAktif: 'Patroli Blue Light Rawan 3C'
    },
    {
      kategori: 'tugas',
      regu: 'Unit Turjawali Sat Lantas R4',
      statusBadge: '🔵 Bertugas Pengaturan Arus',
      statusColor: '#1E40AF',
      statusBg: '#EFF6FF',
      komandan: 'Aiptu Bambang Sudrajat (NRP 49112233)',
      kekuatan: '2 Personel Lalu Lintas (Aiptu Bambang & Aipda Joko Purnomo)',
      ranmor: 'Mobil Patroli Lantas Toyota Vios (No Pol 1108-VII)',
      alkom: 'HT Repeater Lantas Ch 3 & Lampu Rotator Kuning-Biru',
      lokasiOperasi: 'Bundaran HI - Simpang Harmoni (Penanganan Kamseltibcarlantas)',
      tiketAktif: 'Pengaturan Jam Padat Lalu Lintas'
    },

    // 2. Siaga Mako
    {
      kategori: 'siaga',
      regu: 'Pusat Komando & Call Center CAD 110 (Operator SPKT)',
      statusBadge: '🟢 Siaga Mako (Command Center)',
      statusColor: '#166534',
      statusBg: '#F0FDF4',
      komandan: 'Briptu Dian Lestari (NRP 98040112)',
      kekuatan: '4 Personel Operator & Penerima Aduan Darurat 110',
      ranmor: 'Stanby di Ruang Command Center Puskodal',
      alkom: 'Konsol Telepon IP 110, Server CAD, dan Radio Base Station APX 7500',
      lokasiOperasi: 'Gedung Command Center Lantai 2 Mako Polres Metro',
      tiketAktif: 'Pemantauan Call Center 110 Aktif 24 Jam'
    },
    {
      kategori: 'siaga',
      regu: 'Sentra Pelayanan Kepolisian Terpadu (Piket SPKT Mako)',
      statusBadge: '🟢 Siaga Mako',
      statusColor: '#166534',
      statusBg: '#F0FDF4',
      komandan: 'Ipda Suryo Handoko (Ka SPKT Shift A)',
      kekuatan: '6 Personel (Penerimaan Laporan Polisi, SKCK Cito, Surat Kehilangan)',
      ranmor: '1 Unit Mobil Pelayanan SPKT Keliling (No Pol 1005-VII)',
      alkom: 'Komputer Pelayanan Online E-Tribrata & HT Ch 1',
      lokasiOperasi: 'Front Office SPKT Pintu Utama Mako Polres',
      tiketAktif: 'Siaga Penerimaan Tamu & Pelapor Warga'
    },
    {
      kategori: 'siaga',
      regu: 'Regu Bravo Sat Samapta (Unit Siaga Pemukul)',
      statusBadge: '🟢 Siaga Mako',
      statusColor: '#166534',
      statusBg: '#F0FDF4',
      komandan: 'Aipda Hendro Wibowo',
      kekuatan: '10 Personel Lengkap Alutsista Flashball & Rompi Level III-A',
      ranmor: '1 Unit Truk Taktis Dalmas (No Pol 1040-VII) & 1 Unit R4 Isuzu D-Max',
      alkom: 'Radio HT Repeater Samapta Presisi',
      lokasiOperasi: 'Gedung Sat Samapta Polres (Standby Siaga Kontinjensi)',
      tiketAktif: 'Siaga Kontinjensi & Perbantuan Darurat'
    },
    {
      kategori: 'siaga',
      regu: 'Piket Penjagaan Markas & Unit Provost',
      statusBadge: '🟢 Siaga Mako',
      statusColor: '#166534',
      statusBg: '#F0FDF4',
      komandan: 'Aiptu M. Ridwan (Ba Provost)',
      kekuatan: '8 Personel (Piket Pintu Masuk, Pemeriksaan Akses, Ruang Tahanan)',
      ranmor: 'Stanby Gerbang Utama & Pos Penjagaan Mako',
      alkom: 'Metal Detector, Mirror Inspection, Radio Provost',
      lokasiOperasi: 'Pos Penjagaan Mako & Rutan Polres Metro',
      tiketAktif: 'Pengamanan Markas Komando & Rutan'
    },

    // 3. Cadangan Piket
    {
      kategori: 'cadangan',
      regu: 'Peleton Siaga Cadangan Piket Operasional (On-Call 24 Jam)',
      statusBadge: '🟡 Cadangan Siaga',
      statusColor: '#92400E',
      statusBg: '#FFFBEB',
      komandan: 'Iptu Wahyu Hidayat',
      kekuatan: '12 Personel Bintara & Perwira Siaga Apel On-Call',
      ranmor: 'Armada Bus Dinas & Ranmor Operasional Cadangan',
      alkom: 'Panggilan Cepat Radio Saluran Khusus Komando Pawas',
      lokasiOperasi: 'Mess Bintara & Wilayah Radius 3 KM Mako Polres (Standby Apel Darurat)',
      tiketAktif: 'Siap Bergerak dalam 15 Menit saat Eskalasi'
    }
  ];

  // DATASET RINCIAN RANMOR DINAS (14 UNIT)
  const DAFTAR_RANMOR_DINAS = [
    { no: '1', jenis: '🚔 Samapta R-4', tipe: 'Mazda 6 Sedan Presisi', nopol: '1022-VII', unit: 'Unit Patroli Samapta (Regu Alpha)', status: 'Aktif di Lapangan', gps: 'Terhubung GPS Real-Time' },
    { no: '2', jenis: '🚔 Samapta R-4', tipe: 'Isuzu D-Max Double Cabin', nopol: '1023-VII', unit: 'Unit Patroli Samapta (Regu Bravo)', status: 'Siaga di Mako', gps: 'Terhubung GPS Real-Time' },
    { no: '3', jenis: '🚔 Samapta R-4', tipe: 'Mitsubishi Triton Presisi', nopol: '1024-VII', unit: 'Unit Patroli Samapta (Regu Charlie)', status: 'Siaga di Mako', gps: 'Terhubung GPS Real-Time' },
    { no: '4', jenis: '🚔 Samapta R-4', tipe: 'Toyota Hilux Taktis', nopol: '1025-VII', unit: 'Unit Patroli Samapta (Regu Delta)', status: 'Siaga di Mako', gps: 'Terhubung GPS Real-Time' },
    { no: '5', jenis: '🏍️ Perintis R-2', tipe: 'Kawasaki KLX 250 Trail', nopol: '2201-VII', unit: 'Tim Raimas Reaksi Cepat', status: 'Aktif di Lapangan', gps: 'Terhubung GPS Real-Time' },
    { no: '6', jenis: '🏍️ Perintis R-2', tipe: 'Kawasaki KLX 250 Trail', nopol: '2202-VII', unit: 'Tim Raimas Reaksi Cepat', status: 'Aktif di Lapangan', gps: 'Terhubung GPS Real-Time' },
    { no: '7', jenis: '🏍️ Perintis R-2', tipe: 'Yamaha WR 155 Presisi', nopol: '2203-VII', unit: 'Tim Raimas Reaksi Cepat', status: 'Siaga di Mako', gps: 'Terhubung GPS Real-Time' },
    { no: '8', jenis: '🏍️ Perintis R-2', tipe: 'Yamaha WR 155 Presisi', nopol: '2204-VII', unit: 'Tim Raimas Reaksi Cepat', status: 'Siaga di Mako', gps: 'Terhubung GPS Real-Time' },
    { no: '9', jenis: '🏍️ Perintis R-2', tipe: 'Honda CRF 150 Presisi', nopol: '2205-VII', unit: 'Tim Raimas Reaksi Cepat', status: 'Siaga di Mako', gps: 'Terhubung GPS Real-Time' },
    { no: '10', jenis: '🏍️ Perintis R-2', tipe: 'Honda CRF 150 Presisi', nopol: '2206-VII', unit: 'Tim Raimas Reaksi Cepat', status: 'Siaga di Mako', gps: 'Terhubung GPS Real-Time' },
    { no: '11', jenis: '🚓 Lantas R-4', tipe: 'Toyota Vios Sedan Patroli', nopol: '1108-VII', unit: 'Unit Turjawali Sat Lantas', status: 'Aktif di Lapangan', gps: 'Terhubung GPS Real-Time' },
    { no: '12', jenis: '🚓 Lantas R-4', tipe: 'Mitsubishi Lancer Presisi', nopol: '1109-VII', unit: 'Unit Turjawali Sat Lantas', status: 'Siaga di Mako', gps: 'Terhubung GPS Real-Time' },
    { no: '13', jenis: '🚓 Lantas R-4', tipe: 'Hyundai Elantra Patroli', nopol: '1110-VII', unit: 'Unit Turjawali Sat Lantas', status: 'Siaga di Mako', gps: 'Terhubung GPS Real-Time' },
    { no: '14', jenis: '🚓 Lantas R-4', tipe: 'Nissan Almera Lantas', nopol: '1111-VII', unit: 'Unit Turjawali Sat Lantas', status: 'Siaga di Mako', gps: 'Terhubung GPS Real-Time' }
  ];

  let html = '';

  if (filterKey === 'ranmor') {
    // Tampilkan tabel ranmor dinas
    html += `
      <div style="background:white; border:1px solid #CBD5E1; border-radius:12px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
        <div style="background:#F1F5F9; padding:10px 14px; font-weight:800; font-size:12px; color:#1E293B; border-bottom:1px solid #CBD5E1; display:flex; justify-content:space-between;">
          <span>DAFTAR 14 UNIT KENDARAAN DINAS PATROLI PRESISI</span>
          <span style="color:#16A34A;">● 100% SIAP OPERASI</span>
        </div>
        <div style="overflow-x:auto;">
          <table style="width:100%; border-collapse:collapse; font-size:11.5px; text-align:left;">
            <thead>
              <tr style="background:#F8FAFC; color:#475569; border-bottom:1px solid #E2E8F0;">
                <th style="padding:8px 12px; font-weight:800;">No</th>
                <th style="padding:8px 12px; font-weight:800;">Jenis & Tipe Ranmor</th>
                <th style="padding:8px 12px; font-weight:800;">No. Plat Dinas</th>
                <th style="padding:8px 12px; font-weight:800;">Kesatuan Penugasan</th>
                <th style="padding:8px 12px; font-weight:800;">Status Terkini</th>
              </tr>
            </thead>
            <tbody>
              ${DAFTAR_RANMOR_DINAS.map(r => `
                <tr style="border-bottom:1px solid #F1F5F9;">
                  <td style="padding:8px 12px; color:#64748B;">${r.no}</td>
                  <td style="padding:8px 12px; font-weight:700; color:#0F172A;">${r.jenis} <span style="font-weight:400; color:#64748B;">• ${r.tipe}</span></td>
                  <td style="padding:8px 12px; font-family:monospace; font-weight:800; color:#1E40AF;">${r.nopol}</td>
                  <td style="padding:8px 12px; color:#334155;">${r.unit}</td>
                  <td style="padding:8px 12px;">
                    <span style="font-size:10.5px; font-weight:700; padding:2px 8px; border-radius:4px; ${r.status.includes('Aktif') ? 'background:#EFF6FF; color:#1D4ED8; border:1px solid #BFDBFE;' : 'background:#F0FDF4; color:#166534; border:1px solid #BBF7D0;'}">
                      ${r.status}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } else {
    // Tampilkan kartu regu & personel
    let filtered = DAFTAR_GELAR_PERSONEL;
    if (filterKey === 'tugas') filtered = DAFTAR_GELAR_PERSONEL.filter(p => p.kategori === 'tugas');
    else if (filterKey === 'siaga') filtered = DAFTAR_GELAR_PERSONEL.filter(p => p.kategori === 'siaga');
    else if (filterKey === 'cadangan') filtered = DAFTAR_GELAR_PERSONEL.filter(p => p.kategori === 'cadangan');

    filtered.forEach(p => {
      html += `
        <div style="background:white; border:1px solid #E2E8F0; border-radius:12px; padding:14px; box-shadow:0 1px 3px rgba(0,0,0,0.04); display:flex; flex-direction:column; gap:10px;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:8px;">
            <div>
              <div style="font-size:13.5px; font-weight:800; color:#0F172A;">${p.regu}</div>
              <div style="font-size:11.5px; color:#153E75; font-weight:700; margin-top:2px;">
                👤 Pimpinan Regu: ${p.komandan}
              </div>
            </div>
            <span style="background:${p.statusBg}; color:${p.statusColor}; font-weight:800; font-size:11px; padding:3px 10px; border-radius:6px; border:1px solid ${p.statusColor}33; white-space:nowrap;">
              ${p.statusBadge}
            </span>
          </div>

          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:8px; background:#F8FAFC; border:1px solid #F1F5F9; border-radius:8px; padding:10px; font-size:11px;">
            <div>
              <span style="color:#64748B;">👥 Kekuatan Personel:</span>
              <div style="font-weight:700; color:#1E293B; margin-top:1px;">${p.kekuatan}</div>
            </div>
            <div>
              <span style="color:#64748B;">🚔 Kendaraan Patroli:</span>
              <div style="font-weight:700; color:#1E293B; margin-top:1px;">${p.ranmor}</div>
            </div>
            <div>
              <span style="color:#64748B;">📻 Alkom & Alutsista:</span>
              <div style="font-weight:700; color:#1E293B; margin-top:1px;">${p.alkom}</div>
            </div>
            <div>
              <span style="color:#64748B;">📍 Penempatan / Tugas:</span>
              <div style="font-weight:700; color:#1E40AF; margin-top:1px;">${p.lokasiOperasi}</div>
            </div>
          </div>
        </div>
      `;
    });
  }

  container.innerHTML = html;
}

// ------------------------------------------------------------
// 3. DETAIL MODAL INDEKS KEPUASAN MASYARAKAT (IKM & VOTING WARGA)
// ------------------------------------------------------------
function bukaModalDetailIkmWarga() {
  const modal = document.getElementById('modal-detail-ikm-warga');
  if (!modal) return;
  modal.style.display = 'flex';
  filterModalDetailIkm(currentIkmFilter || 'semua');
}

function tutupModalDetailIkmWarga() {
  const modal = document.getElementById('modal-detail-ikm-warga');
  if (modal) modal.style.display = 'none';
}

function filterModalDetailIkm(filterKey) {
  currentIkmFilter = filterKey;
  // Update button active states
  ['semua', 'star5', 'star4'].forEach(k => {
    const btn = document.getElementById('tab-ikm-' + k);
    if (btn) {
      if (k === filterKey) {
        btn.style.background = '#065F46';
        btn.style.color = 'white';
        btn.style.border = 'none';
        btn.style.fontWeight = '800';
      } else {
        btn.style.background = 'white';
        btn.style.color = '#334155';
        btn.style.border = '1px solid #CBD5E1';
        btn.style.fontWeight = '700';
      }
    }
  });

  renderModalDetailIkmList(filterKey);
}

function renderModalDetailIkmList(filterKey) {
  const container = document.getElementById('modal-ikm-list-container');
  if (!container || !appLogs) return;

  // Saring semua log yang memiliki ulasan/rating warga
  const ratedLogs = appLogs.filter(l => l.ratingKepuasan && (l.ratingKepuasan.bintang || l.ratingKepuasan.skor));
  let sumStars = 0;
  let countStar5 = 0;
  let countStar4 = 0;

  ratedLogs.forEach(l => {
    const starVal = Number(l.ratingKepuasan.bintang || l.ratingKepuasan.skor || 5);
    sumStars += starVal;
    if (starVal >= 5) countStar5++;
    else if (starVal === 4) countStar4++;
  });

  const totalReviews = ratedLogs.length;
  const avg = totalReviews > 0 ? (sumStars / totalReviews).toFixed(1) : '4.9';
  const pct = totalReviews > 0 ? ((parseFloat(avg) / 5) * 100).toFixed(1) : '98.2';

  // Update ringkasan KPI
  const elScore = document.getElementById('modal-ikm-kpi-score');
  if (elScore) elScore.innerHTML = `${avg} <span style="font-size:11px; color:#64748B; font-weight:700;">/ 5.0</span>`;

  const elPct = document.getElementById('modal-ikm-kpi-percent');
  if (elPct) elPct.innerText = `${pct}%`;

  const elCnt = document.getElementById('modal-ikm-kpi-count');
  if (elCnt) elCnt.innerText = `${totalReviews} Ulasan`;

  const elS5 = document.getElementById('modal-ikm-kpi-star5');
  if (elS5) elS5.innerText = `${countStar5} Ulasan`;

  const elS4 = document.getElementById('modal-ikm-kpi-star4');
  if (elS4) elS4.innerText = `${countStar4} Ulasan`;

  const elTabAll = document.getElementById('count-ikm-tab-all');
  if (elTabAll) elTabAll.innerText = totalReviews;
  const elTabS5 = document.getElementById('count-ikm-tab-star5');
  if (elTabS5) elTabS5.innerText = countStar5;
  const elTabS4 = document.getElementById('count-ikm-tab-star4');
  if (elTabS4) elTabS4.innerText = countStar4;

  // Filter dataset yang akan ditampilkan
  let filtered = [...ratedLogs].sort((a, b) => (b.id || 0) - (a.id || 0));
  if (filterKey === 'star5') filtered = filtered.filter(l => Number(l.ratingKepuasan.bintang || l.ratingKepuasan.skor) >= 5);
  else if (filterKey === 'star4') filtered = filtered.filter(l => Number(l.ratingKepuasan.bintang || l.ratingKepuasan.skor) === 4);

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:30px; background:white; border-radius:10px; border:1px dashed #CBD5E1; color:#64748B;">
        <span style="font-size:24px;">📭</span>
        <div style="font-weight:700; margin-top:6px;">Tidak ada ulasan dalam kategori bintang ini.</div>
      </div>
    `;
    return;
  }

  let html = '';
  filtered.forEach(l => {
    const r = l.ratingKepuasan;
    const starVal = Number(r.bintang || r.skor || 5);
    const starDisplay = '⭐'.repeat(starVal);
    const pelaporNama = r.nama || l.pelapor?.nama || l.nama || 'Warga Masyarakat';
    const noTiket = l.nomorTiket || ('TIKET-110-' + l.id + 'X2F');
    const judulKasus = l.jenisInsiden || l.title || 'Penanganan Pengaduan';
    const lokasi = l.lokasiKejadian || l.sektor || 'Wilayah Hukum';
    const unitPenangan = l.assignedNama || l.disposisi?.komandan || 'Regu Patroli Presisi';
    const satuanUnit = l.disposisi?.unit || 'Unit Presisi';
    const tags = Array.isArray(r.tags) ? r.tags : ['⚡ Respon Sangat Cepat', '👮 Petugas Ramah & Humanis'];
    const waktuReview = r.waktu || 'Hari ini';

    html += `
      <div style="background:white; border:1px solid #E2E8F0; border-radius:12px; padding:14px; box-shadow:0 1px 3px rgba(0,0,0,0.04); display:flex; flex-direction:column; gap:10px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:8px;">
          <div>
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:3px;">
              <span style="font-size:14px; font-weight:800; color:#0F172A;">${pelaporNama}</span>
              <span style="font-size:10.5px; background:#EFF6FF; color:#1D4ED8; font-weight:700; padding:1px 6px; border-radius:4px; border:1px solid #BFDBFE;">${noTiket}</span>
              <span style="font-size:10.5px; background:#F0FDF4; color:#166534; font-weight:700; padding:1px 6px; border-radius:4px;">✓ Terverifikasi 110</span>
            </div>
            <div style="font-size:11.5px; color:#475569;">
              Kasus: <strong>${judulKasus}</strong> • 📍 ${lokasi}
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:14px; font-weight:800; color:#D97706;">${starDisplay}</div>
            <div style="font-size:10.5px; color:#64748B; margin-top:2px;">${waktuReview}</div>
          </div>
        </div>

        <div style="background:#F8FAFC; border-left:3px solid #10B981; border-radius:0 8px 8px 0; padding:10px 12px; font-size:12px; color:#1E293B; line-height:1.5; font-style:italic;">
          "${r.ulasan || 'Penanganan kepolisian sangat cepat dan memuaskan.'}"
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; border-top:1px solid #F1F5F9; padding-top:8px;">
          <div style="display:flex; flex-wrap:wrap; gap:5px;">
            ${tags.map(t => `<span style="font-size:10.5px; font-weight:700; background:#ECFDF5; color:#047857; border:1px solid #A7F3D0; padding:2px 7px; border-radius:4px;">${t}</span>`).join('')}
          </div>
          <div style="font-size:11px; color:#64748B;">
            👮 Ditangani: <strong style="color:#153E75;">${unitPenangan}</strong> (${satuanUnit})
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

// ============================================================
// DYNAMIC BREAKING ALERT UNTUK PIMPINAN (PAWAS)
// ============================================================
function renderPimpinanBreakingAlert() {
  const alertContainer = document.getElementById('pimpinan-breaking-alert');
  if (!alertContainer) return;

  const urlParams = new URLSearchParams(window.location.search);
  const role = urlParams.get('role');
  const isPim = (role === 'pimpinan' || role === 'atasan' || role === 'pawas');
  if (!isPim) {
    alertContainer.style.display = 'none';
    return;
  }

  if (!appLogs || appLogs.length === 0) {
    alertContainer.style.display = 'none';
    return;
  }

  // Cari insiden darurat aktif: diproses atau platform sos atau prioritas tinggi
  const urgentLog = appLogs.find(l => (l.status === 'diproses' && l.tahap < 5) || l.platform === 'sos')
    || appLogs.find(l => l.status === 'menunggu');

  if (!urgentLog) {
    alertContainer.style.display = 'none';
    return;
  }

  alertContainer.style.display = 'block';

  const elWaktu = document.getElementById('pimpinan-alert-waktu');
  if (elWaktu) elWaktu.innerText = `⏱️ Waktu Laporan: ${urgentLog.waktu || '10:00 WIB'} • Target Respon < 10 Menit`;

  const elJudul = document.getElementById('pimpinan-alert-judul');
  if (elJudul) elJudul.innerText = urgentLog.title || ('Insiden ' + (urgentLog.jenisInsiden || 'Kamtibmas'));

  const elSektor = document.getElementById('pimpinan-alert-sektor');
  if (elSektor) elSektor.innerText = `📍 ${urgentLog.sektor || (urgentLog.lokasiKejadian ? urgentLog.lokasiKejadian.split(',')[0] : 'Sektor Kota')}`;

  const elUnit = document.getElementById('pimpinan-alert-unit');
  if (elUnit) {
    const unitTeks = urgentLog.disposisi?.unit || urgentLog.disposisi?.komandan || urgentLog.assignedNama || 'Unit Reaksi Cepat Presisi';
    elUnit.innerText = `🚔 Unit: ${unitTeks}`;
  }

  const elStatus = document.getElementById('pimpinan-alert-status');
  if (elStatus) {
    if (urgentLog.status === 'diproses') {
      elStatus.innerText = urgentLog.tahap === 3 ? 'Status: Meluncur ke TKP (Tahap 3)' : 'Status: Tindakan TKP Berlangsung (Tahap 4)';
      elStatus.style.color = '#2563EB';
    } else {
      elStatus.innerText = 'Status: Menunggu Disposisi Pawas';
      elStatus.style.color = '#DC2626';
    }
  }

  const elBtn = document.getElementById('pimpinan-alert-btn-tindak');
  if (elBtn) {
    elBtn.onclick = function() {
      switchTab('view-validasi');
      if (typeof openValidasiList === 'function') openValidasiList(urgentLog.status);
      if (typeof selectLogCard === 'function') selectLogCard(urgentLog.id);
    };
  }
}

// ============================================================
// DYNAMIC RIWAYAT LOG UNTUK PROFIL PETUGAS
// ============================================================
function getDynamicRiwayatLog110() {
  const activeUser = typeof getActiveSessionUser === 'function' ? getActiveSessionUser() : null;
  const isPim = activeUser && (activeUser.role === 'pimpinan' || activeUser.role === 'pawas' || activeUser.role === 'atasan');

  let filteredLogs = [];
  if (!activeUser || isPim) {
    filteredLogs = appLogs || [];
  } else {
    filteredLogs = (appLogs || []).filter(l => typeof isLogAssignedToUser === 'function' ? isLogAssignedToUser(l, activeUser) : true);
  }

  return filteredLogs.map(l => {
    const isSelesai = l.status === 'selesai';
    const isDiproses = l.status === 'diproses' || l.status === 'menunggu_pengesahan';
    const isMenunggu = l.status === 'menunggu';
    const isDitolak = l.status === 'ditolak';

    return {
      id: String(l.id),
      tiket: l.nomorTiket || ('#TIKET-110-' + (l.id < 10 ? '0' + l.id : l.id)),
      waktu: l.waktu ? (l.waktu + ' WIB') : 'Hari ini',
      kategori: l.title || l.jenisInsiden || 'Laporan Kamtibmas',
      tindakan: l.jenisInsiden || 'PATROLI',
      tindakanBg: isMenunggu ? '#FEE2E2' : (isDiproses ? '#FEF3C7' : '#EFF6FF'),
      tindakanColor: isMenunggu ? '#B91C1C' : (isDiproses ? '#B45309' : '#1D4ED8'),
      pelapor: l.pelapor?.nama || l.nama || '',
      telp: l.noTelpPelapor || '0812-8871-3321',
      lokasi: l.lokasiKejadian || (l.sektor ? l.sektor + ', Jakarta' : ''),
      petugas: l.assignedNama || l.disposisi?.komandan || (activeUser ? activeUser.nama : ''),
      status: l.status,
      statusText: l.statusText || (isSelesai ? 'Selesai (Tuntas TKP)' : (isDiproses ? 'Sedang Ditangani' : (isMenunggu ? 'Menunggu Tindakan' : 'Ditolak'))),
      statusBg: isSelesai ? '#DCFCE7' : (isDiproses ? '#FEF3C7' : (isMenunggu ? '#FEE2E2' : '#F1F5F9')),
      statusColor: isSelesai ? '#15803D' : (isDiproses ? '#B45309' : (isMenunggu ? '#DC2626' : '#64748B')),
      sla: (l.slaDurasiMenit || ((l.id % 5) + 4)) + ' Menit',
      slaStatus: 'Tepat Waktu (< 10 Menit)',
      kronologi: l.deskripsi || 'Penanganan operasional presisi sesuai standar SOP Kepolisian 110.',
      foto: l.fotoLampiran || l.fotoPengaduan || (activeUser ? activeUser.avatar : 'assets/images/polri_pengaduan_tkp.jpg'),
      catatan: l.catatanSelesai || 'Petugas telah menuntaskan tugas di lokasi dengan koordinasi prima.'
    };
  });
}