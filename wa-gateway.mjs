import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  Browsers,
} from '@whiskeysockets/baileys';
import pino from 'pino';
import qrcodeTerminal from 'qrcode-terminal';
import QRCode from 'qrcode';
import http from 'http';
import fs from 'fs';
import path from 'path';

const PORT = process.env.WA_GATEWAY_PORT || 5001;
const AUTH_DIR = path.resolve(process.cwd(), 'wa_auth_session');

if (!fs.existsSync(AUTH_DIR)) {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
}

let sock = null;
let currentQr = null;
let currentQrDataUrl = null;
let connectionStatus = 'initializing';
let connectedPhone = null;

// Format nomor Indonesia
function normalizePhone(phone) {
  let clean = String(phone || '').replace(/\D/g, '');
  if (clean.startsWith('0')) {
    clean = '62' + clean.slice(1);
  } else if (clean.startsWith('8')) {
    clean = '62' + clean;
  }
  return clean;
}

// Filter log internal libsignal agar terminal operator bersih dan rapi
function shouldSilenceLog(msg) {
  return (
    msg.includes('Bad MAC') ||
    msg.includes('Failed to decrypt message') ||
    msg.includes('Session error') ||
    msg.includes('libsignal') ||
    msg.includes('session_cipher') ||
    msg.includes('Closing session') ||
    msg.includes('Closing open session') ||
    msg.includes('Opening session') ||
    msg.includes('Removing old closed session') ||
    msg.includes('Session already closed') ||
    msg.includes('Session already open') ||
    msg.includes('Migrating session to') ||
    msg.includes('prekey bundle') ||
    msg.includes('SessionEntry')
  );
}

const originalConsoleError = console.error;
console.error = function (...args) {
  const msg = args.map((a) => (a && a.stack ? a.stack : String(a))).join(' ');
  if (shouldSilenceLog(msg)) return;
  originalConsoleError.apply(console, args);
};

const originalConsoleWarn = console.warn;
console.warn = function (...args) {
  const msg = args.map((a) => (a && a.stack ? a.stack : String(a))).join(' ');
  if (shouldSilenceLog(msg)) return;
  originalConsoleWarn.apply(console, args);
};

const originalConsoleInfo = console.info;
console.info = function (...args) {
  const msg = args.map((a) => (a && a.stack ? a.stack : String(a))).join(' ');
  if (shouldSilenceLog(msg)) return;
  originalConsoleInfo.apply(console, args);
};

const originalStderrWrite = process.stderr.write.bind(process.stderr);
process.stderr.write = function (chunk, encoding, callback) {
  const str = String(chunk);
  if (shouldSilenceLog(str)) {
    if (typeof encoding === 'function') encoding();
    else if (typeof callback === 'function') callback();
    return true;
  }
  return originalStderrWrite(chunk, encoding, callback);
};

async function startWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version, isLatest } = await fetchLatestBaileysVersion().catch(() => ({
    version: [2, 3000, 1015901307],
    isLatest: true,
  }));

  console.log(`\n========================================================`);
  console.log(`  🚔 WHATSAPP GATEWAY MANDIRI SIMAPRES 110 (BAILEYS)`);
  console.log(`  Versi WA Web: ${version.join('.')}`);
  console.log(`========================================================\n`);

  sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false, // Ditangani manual via qrcodeTerminal
    auth: state,
    browser: Browsers.ubuntu('SIMAPRES 110'),
    syncFullHistory: false,
    markOnlineOnConnect: false,
    generateHighQualityLinkPreview: false,
    shouldIgnoreJid: (jid) =>
      !jid ||
      jid.endsWith('@broadcast') ||
      jid.endsWith('@newsletter') ||
      jid.includes('status@broadcast'),
    getMessage: async () => undefined,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      currentQr = qr;
      connectionStatus = 'qr_ready';
      try {
        currentQrDataUrl = await QRCode.toDataURL(qr);
      } catch (_) {}

      console.log('\n📲 [SCAN QR CODE] Buka WhatsApp di HP > Perangkat Tertaut > Tautkan Perangkat:\n');
      qrcodeTerminal.generate(qr, { small: true });
      console.log(`\nAtau buka di browser: http://localhost:${PORT} untuk scan tampilan visual.\n`);
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      connectionStatus = 'disconnected';
      connectedPhone = null;
      currentQr = null;
      currentQrDataUrl = null;

      console.log(`⚠️ Koneksi WhatsApp terputus (Status: ${statusCode || 'unknown'}).`);

      if (shouldReconnect) {
        console.log('🔄 Menghubungkan ulang dalam 3 detik...');
        setTimeout(startWhatsApp, 3000);
      } else {
        console.log('❌ Sesi telah keluar (Logged out). Silakan restart script untuk memunculkan QR baru.');
      }
    } else if (connection === 'open') {
      connectionStatus = 'connected';
      currentQr = null;
      currentQrDataUrl = null;
      const userJid = sock.user?.id || '';
      connectedPhone = userJid.split(':')[0] || userJid.split('@')[0] || 'Nomor Dinas 110';

      console.log(`\n✅ ========================================================`);
      console.log(`✅ WHATSAPP BERHASIL TERHUBUNG!`);
      console.log(`✅ Nomor Aktif : ${connectedPhone}`);
      console.log(`✅ Bebas Biaya & 100% Tanpa Watermark Pihak Ketiga`);
      console.log(`✅ Gateway Siap Melayani Pengiriman Pesan SIMAPRES 110`);
      console.log(`✅ ========================================================\n`);
    }
  });
}

// ─────────────────────────────────────────────────────────────
// HTTP Server untuk API Pengiriman Pesan & Dashboard Monitor
// ─────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  // Endpoint: GET /status (JSON)
  if (url.pathname === '/status' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        success: true,
        status: connectionStatus,
        phone: connectedPhone,
        hasQr: Boolean(currentQr),
        qrDataUrl: currentQrDataUrl,
        timestamp: new Date().toISOString(),
      })
    );
    return;
  }

  // Endpoint: POST /send (Kirim Pesan WhatsApp)
  if (url.pathname === '/send' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });

    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const rawTo = payload.to || payload.phone || payload.recipient;
        const messageText = payload.message || payload.text;

        if (!rawTo || !messageText) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              success: false,
              error: 'Parameter "to" dan "message" wajib diisi.',
            })
          );
          return;
        }

        if (connectionStatus !== 'connected' || !sock) {
          res.writeHead(503, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              success: false,
              status: connectionStatus,
              error: 'Gateway WhatsApp belum terhubung. Silakan scan QR code terlebih dahulu.',
            })
          );
          return;
        }

        const cleanPhone = normalizePhone(rawTo);
        const jid = `${cleanPhone}@s.whatsapp.net`;

        // Kirim pesan langsung via Baileys (Tanpa watermark apa pun)
        const result = await sock.sendMessage(jid, { text: String(messageText) });

        console.log(`✉️ Pesan terkirim ke ${cleanPhone} (ID: ${result?.key?.id || '-'})`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            success: true,
            messageId: result?.key?.id,
            statusText: 'Pesan berhasil dikirim via Baileys Gateway Mandiri',
            to: cleanPhone,
          })
        );
      } catch (err) {
        console.error('❌ Error saat mengirim pesan:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            success: false,
            error: err.message || 'Gagal mengirim pesan WhatsApp.',
          })
        );
      }
    });
    return;
  }

  // Endpoint: Web Dashboard UI Sederhana (Bisa dibuka di browser http://localhost:5001)
  if (url.pathname === '/' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WhatsApp Gateway Mandiri - SIMAPRES 110</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    body { background: #0A0D14; color: #F8FAFC; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
    .card { background: #121826; border: 1px solid rgba(236,196,115,0.3); border-radius: 20px; padding: 32px 28px; max-width: 480px; width: 100%; text-align: center; box-shadow: 0 20px 50px rgba(0,0,0,0.6); }
    .badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 14px; border-radius: 999px; font-size: 11px; font-weight: 800; letter-spacing: 0.5px; margin-bottom: 16px; }
    .badge-online { background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.4); color: #34D399; }
    .badge-scan { background: rgba(245,158,11,0.15); border: 1px solid rgba(245,158,11,0.4); color: #FBBF24; }
    h1 { font-size: 20px; font-weight: 900; color: #ECC473; margin-bottom: 8px; }
    p { font-size: 13px; color: #94A3B8; line-height: 1.6; margin-bottom: 24px; }
    .qr-container { background: #FFFFFF; padding: 16px; border-radius: 16px; display: inline-block; margin-bottom: 20px; box-shadow: 0 8px 30px rgba(0,0,0,0.4); }
    .qr-container img { width: 250px; height: 250px; display: block; }
    .info-box { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 14px; text-align: left; font-size: 12px; color: #CBD5E1; line-height: 1.5; margin-bottom: 20px; }
    .phone { color: #ECC473; font-weight: 800; font-family: monospace; font-size: 15px; }
    .btn { display: inline-block; padding: 10px 20px; background: linear-gradient(135deg, #ECC473, #C99635); color: #0A0D14; font-weight: 800; font-size: 12.5px; border-radius: 10px; text-decoration: none; border: none; cursor: pointer; }
  </style>
</head>
<body>
  <div class="card">
    ${
      connectionStatus === 'connected'
        ? `
      <div class="badge badge-online">● GATEWAY AKTIF & TERHUBUNG</div>
      <h1>SIMAPRES 110 WhatsApp Gateway</h1>
      <p>Nomor dinas kepolisian telah terhubung secara mandiri tanpa watermark pihak ketiga.</p>
      <div class="info-box">
        <div>Nomor Tertaut: <span class="phone">+${connectedPhone}</span></div>
        <div style="margin-top: 6px; color: #10B981;">✓ 100% Gratis Selamanya & Bebas Watermark Promosi</div>
        <div style="margin-top: 4px; color: #94A3B8;">✓ Terintegrasi Langsung ke CAD 110 & Monitoring Pawas</div>
      </div>
      <button class="btn" onclick="window.location.reload()">Periksa Status Koneksi</button>
    `
        : connectionStatus === 'qr_ready' && currentQrDataUrl
        ? `
      <div class="badge badge-scan">● SILAKAN SCAN QR CODE</div>
      <h1>Tautkan WhatsApp 110</h1>
      <p>Buka WhatsApp di HP Anda > Menu <strong>Perangkat Tertaut</strong> > Pilih <strong>Tautkan Perangkat</strong>, lalu scan QR berikut:</p>
      <div class="qr-container">
        <img src="${currentQrDataUrl}" alt="Scan QR Code WhatsApp" />
      </div>
      <div class="info-box">
        💡 Halaman ini otomatis memuat ulang saat perangkat Anda berhasil tersambung.
      </div>
      <script>
        setInterval(() => {
          fetch('/status')
            .then(r => r.json())
            .then(data => {
              if (data.status === 'connected') {
                window.location.reload();
              }
            }).catch(() => {});
        }, 2000);
      </script>
    `
        : `
      <div class="badge badge-scan">⏳ MEMULAI ENGINE BAILEYS...</div>
      <h1>Menyiapkan Sesi WhatsApp</h1>
      <p>Sedang menghubungkan ke server WhatsApp Web. Harap tunggu beberapa detik...</p>
      <script>
        setTimeout(() => window.location.reload(), 2500);
      </script>
    `
    }
  </div>
</body>
</html>`;
    res.end(html);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: false, error: 'Endpoint tidak ditemukan.' }));
});

// Mulai HTTP Server & Baileys
server.listen(PORT, () => {
  console.log(`🌐 Server Gateway Mandiri berjalan di http://localhost:${PORT}`);
  startWhatsApp();
});
