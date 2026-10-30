'use server';

// SIMAPRES 110 - Device Server Actions (Delivery Adapter / Clean Architecture)
import { UseCaseFactory } from '@/application/factories/use-case.factory';
import { cacheInvalidate } from '@/infrastructure/cache/app-cache';

export async function createDevicePairingSessionAction(input: {
  sessionToken: string;
  nrp?: string;
  unitId?: string;
}) {
  try {
    const repo = UseCaseFactory.getDeviceRepository();
    await repo.createPairingSession(input.sessionToken, input.nrp, input.unitId);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function pairDeviceSessionAction(input: {
  sessionToken?: string | null;
  deviceId: string;
  deviceBrand: string;
  nrp?: string | null;
  unitId?: string | null;
  lat: number;
  lng: number;
}) {
  try {
    const repo = UseCaseFactory.getDeviceRepository();
    await repo.bindOfficerDevice(input);
    cacheInvalidate('active_officers_units');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function checkDevicePairingSessionAction(sessionToken: string) {
  try {
    const repo = UseCaseFactory.getDeviceRepository();
    const data = await repo.checkPairingSession(sessionToken);
    return {
      success: true,
      data,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
