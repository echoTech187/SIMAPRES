import { test, expect } from '@playwright/test';

test.describe('Halaman publik warga', () => {
  test('formulir pengaduan dapat diisi dengan data realistis (tanpa dikirim)', async ({ page }) => {
    await page.goto('/warga');
    await expect(page.getByRole('heading', { name: /Pusat Bantuan & Pengaduan Presisi/ })).toBeVisible();

    await page.locator('#input-nama-pelapor').fill('Siti Nurhaliza');
    await page.locator('#input-telp-pelapor').fill('081327645890');
    await page.locator('#select-kategori-kasus').selectOption({ index: 1 });
    await page.locator('#input-alamat-tkp').fill('Jalan Raya Kajen, depan Pasar Kajen, RT 02 RW 01, Kecamatan Kajen');
    await page
      .locator('#input-uraian-kejadian')
      .fill('Telah terjadi kecelakaan antara dua sepeda motor di pertigaan depan pasar. Satu pengendara terluka di bagian kaki dan lalu lintas mulai macet.');

    await expect(page.locator('#input-nama-pelapor')).toHaveValue('Siti Nurhaliza');
    await expect(page.locator('#input-telp-pelapor')).toHaveValue('081327645890');
    await expect(page.getByRole('button', { name: 'KIRIM PENGADUAN' })).toBeVisible();
  });

  test('tombol bantuan tersedia: SOS, deteksi GPS, dan pilih titik di peta', async ({ page }) => {
    await page.goto('/warga');
    await expect(page.getByRole('button', { name: /PANGGILAN DARURAT SOS/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Deteksi GPS Saya/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Pilih Titik di Peta/ })).toBeVisible();
  });
});

test.describe('Halaman pelacakan laporan', () => {
  test('menampilkan kolom nomor tiket dan kode pelacak', async ({ page }) => {
    await page.goto('/tracking');
    await expect(page.getByRole('heading', { name: 'Lacak Laporan Saya' })).toBeVisible();
    await expect(page.getByPlaceholder('Contoh: TICKET-1897638850')).toBeVisible();
    await expect(page.getByPlaceholder('Contoh: 8646b7f837e4f414')).toBeVisible();
  });

  test('nomor tiket dan kode palsu tidak menampilkan data laporan', async ({ page }) => {
    await page.goto('/tracking');
    await page.getByPlaceholder('Contoh: TICKET-1897638850').fill('TICKET-0000000001');
    await page.getByPlaceholder('Contoh: 8646b7f837e4f414').fill('0000000000000000');
    await page.getByRole('button', { name: 'Lacak Sekarang' }).click();
    await page.waitForTimeout(2500);
    await expect(page.getByText(/Kronologi|Timeline|Riwayat Penanganan/i)).toHaveCount(0);
  });
});
