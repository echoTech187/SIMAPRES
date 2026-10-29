import { test, expect } from '@playwright/test';
import { login, pickAccount, Role } from './helpers';

/** Menu yang wajib terlihat untuk tiap peran setelah login (teks sesuai tampilan aplikasi). */
const MENU: Record<Role, { opts?: { withDevice?: boolean }; items: string[] }> = {
  SUPERADMIN: { items: ['Buku Pintar SOP 110', 'Kantor Polisi (Mako)', 'Armada Ranmor Patroli', 'Satuan & Personel', 'Jadwal & Roster Piket'] },
  OPERATOR: { items: ['Sentra Layanan 110 & CAD', 'Peta Situasi Wilayah', 'Buku Pintar SOP & Layanan', 'Kinerja & Peringkat 110'] },
  PAWAS: { opts: { withDevice: true }, items: ['Beranda', 'Peta Taktis', 'Komando Pawas', 'Kinerja', 'Buku Pintar SOP', 'Jadwal Piket'] },
  PERSONIL: { opts: { withDevice: true }, items: ['Beranda', 'Peta Patroli', 'Profil Kedinasan'] },
  LOGISTIK: { items: ['Audit Mileage & SPJ BBM Patroli', 'Master BBM DIPA & Rasio Konsumsi', 'Profil & Keamanan Akun Staf'] },
};

for (const role of Object.keys(MENU) as Role[]) {
  test.describe(`Menu konsol peran ${role}`, () => {
    test(`seluruh menu utama ${role} tampil setelah login`, async ({ page }) => {
      await login(page, pickAccount(role, MENU[role].opts));
      for (const text of MENU[role].items) {
        await expect(page.getByText(text, { exact: false }).first(), `menu "${text}"`).toBeVisible({ timeout: 20_000 });
      }
    });
  });
}

test.describe('Perpindahan halaman', () => {
  test('Operator dapat membuka Buku Pintar SOP dan Kinerja', async ({ page }) => {
    await login(page, pickAccount('OPERATOR'));
    await page.getByText('Buku Pintar SOP & Layanan').first().click();
    await expect(page.getByText(/SOP/i).first()).toBeVisible();
    await page.getByText('Kinerja & Peringkat 110').first().click();
    await expect(page.getByText(/Kinerja/i).first()).toBeVisible();
  });

  test('Pawas dapat membuka Jadwal Piket dan Peta Taktis', async ({ page }) => {
    await login(page, pickAccount('PAWAS', { withDevice: true }));
    await page.getByText('Jadwal Piket').first().click();
    await expect(page.getByText(/Piket/i).first()).toBeVisible();
    await page.getByText('Peta Taktis').first().click();
    await expect(page.getByText(/Peta/i).first()).toBeVisible();
  });

  test('Logistik dapat berpindah antarmenu BBM', async ({ page }) => {
    await login(page, pickAccount('LOGISTIK'));
    await page.getByText('Master BBM DIPA & Rasio Konsumsi').first().click();
    await expect(page.getByText(/DIPA/i).first()).toBeVisible();
    await page.getByText('Audit Mileage & SPJ BBM Patroli').first().click();
    await expect(page.getByText(/SPJ/i).first()).toBeVisible();
  });
});
