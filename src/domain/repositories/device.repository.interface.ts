/**
 * SIMAPRES 110 - DOMAIN REPOSITORY INTERFACE: DEVICE HARDWARE BINDING
 * Lapisan: Domain (Pure TypeScript, Zero Framework Dependency)
 */

export interface IDeviceRepository {
  createPairingSession(sessionToken: string, nrp?: string, unitId?: string): Promise<any>;
  getPairingSession(sessionToken: string): Promise<any | null>;
  confirmPairingSession(
    sessionToken: string,
    deviceId: string,
    deviceBrand?: string,
    lat?: number,
    lng?: number
  ): Promise<any>;
  bindOfficerDevice(input: {
    sessionToken?: string | null;
    deviceId: string;
    deviceBrand: string;
    nrp?: string | null;
    unitId?: string | null;
    lat: number;
    lng: number;
  }): Promise<void>;
  checkPairingSession(sessionToken: string): Promise<any | null>;
}
