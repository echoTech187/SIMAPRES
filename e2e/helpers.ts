import { Page, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

export const PASSWORD = 'polripresisi2026';

export type Role = 'SUPERADMIN' | 'OPERATOR' | 'PAWAS' | 'PERSONIL' | 'LOGISTIK';

export interface Account {
  nrp: string;
  full_name: string;
  role: Role;
  rank_pangkat: string;
  jabatan: string;
  device_id: string | null;
}

/** Daftar akun dibaca dari e2e/.data/accounts.json (diambil dari database, tidak ikut Git). */
export function loadAccounts(): Account[] {
  const file = path.join(__dirname, '.data', 'accounts.json');
  return JSON.parse(fs.readFileSync(file, 'utf8')) as Account[];
}

export function pickAccount(role: Role, opts: { withDevice?: boolean } = {}): Account {
  const found = loadAccounts().find(
    (a) => a.role === role && (opts.withDevice === undefined || !!a.device_id === opts.withDevice),
  );
  if (!found) throw new Error(`Akun untuk peran ${role} tidak ditemukan`);
  return found;
}

/** Meniru perangkat dinas terdaftar (wajib untuk peran PERSONIL). */
export async function bindDevice(page: Page, deviceId: string) {
  await page.addInitScript((id) => localStorage.setItem('simapres_hardware_device_id', id), deviceId);
}

export async function fillLogin(page: Page, nrp: string, password: string) {
  await page.goto('/');
  await page.locator('#login-nrp').fill(nrp);
  await page.locator('#login-pass').fill(password);
}

export async function login(page: Page, account: Account, password = PASSWORD) {
  if (account.device_id) await bindDevice(page, account.device_id);
  await fillLogin(page, account.nrp, password);
  await page.getByRole('button', { name: 'Masuk ke Layanan 110' }).click();
  await page.waitForURL('**/console**', { timeout: 30_000 });
  await expect(page).toHaveURL(/\/console/);
}
