import { test, expect } from '@playwright/test';
import { fillLogin, login, loadAccounts, pickAccount, PASSWORD, bindDevice } from './helpers';

test.describe('Login & keamanan akses', () => {
  test('halaman login menampilkan formulir NRP dan kata sandi', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#login-nrp')).toBeVisible();
    await expect(page.locator('#login-pass')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Masuk ke Layanan 110' })).toBeVisible();
  });

  test('menolak login saat kata sandi salah', async ({ page }) => {
    const acc = pickAccount('OPERATOR');
    await fillLogin(page, acc.nrp, 'kataSandiSalah123');
    await page.getByRole('button', { name: 'Masuk ke Layanan 110' }).click();
    await expect(page.getByText('Kata sandi yang Anda masukkan tidak sesuai')).toBeVisible();
    await expect(page).not.toHaveURL(/\/console/);
  });

  test('menolak login saat NRP tidak terdaftar', async ({ page }) => {
    await fillLogin(page, '00000000', PASSWORD);
    await page.getByRole('button', { name: 'Masuk ke Layanan 110' }).click();
    await expect(page.getByText('tidak terdaftar dalam pangkalan data')).toBeVisible();
  });

  test('Personel tanpa perangkat terdaftar ditolak', async ({ page }) => {
    const acc = pickAccount('PERSONIL', { withDevice: false });
    await fillLogin(page, acc.nrp, PASSWORD);
    await page.getByRole('button', { name: 'Masuk ke Layanan 110' }).click();
    await expect(page.locator('#login-alert-text')).toContainText('Akun Belum Aktif');
  });

  test('Personel dengan perangkat berbeda ditolak', async ({ page }) => {
    const acc = pickAccount('PERSONIL', { withDevice: true });
    await bindDevice(page, 'PERANGKAT-LAIN-TIDAK-TERDAFTAR');
    await fillLogin(page, acc.nrp, PASSWORD);
    await page.getByRole('button', { name: 'Masuk ke Layanan 110' }).click();
    await expect(page.locator('#login-alert-text')).toContainText('Perangkat Tidak Terdaftar');
  });

  test('halaman terlindungi mengarahkan tamu ke login', async ({ page }) => {
    await page.goto('/console');
    await expect(page).toHaveURL(/alert=unauthenticated/);
    await expect(page.locator('#login-nrp')).toBeVisible();
  });

  const roles = ['SUPERADMIN', 'OPERATOR', 'PAWAS', 'PERSONIL', 'LOGISTIK'] as const;
  for (const role of roles) {
    test(`login berhasil untuk peran ${role}`, async ({ page }) => {
      const acc = pickAccount(role, role === 'PERSONIL' || role === 'PAWAS' ? { withDevice: true } : {});
      await login(page, acc);
      await expect(page).toHaveURL(/\/console/);
    });
  }

  test('seluruh 21 akun tercatat di database', () => {
    expect(loadAccounts()).toHaveLength(21);
  });
});
