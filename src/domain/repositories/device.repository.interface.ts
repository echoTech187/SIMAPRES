/**
 * SIMAPRES 110 - DOMAIN REPOSITORY INTERFACE: DEVICE HARDWARE BINDING
 * Lapisan: Domain (Pure TypeScript, Zero Framework Dependency)
 */

export interface DevicePairingSession {
  id?: bigint | number;
  session_token?: string;
  sessionToken?: string;
  nrp?: string | null;
  unit_id?: string | null;
  unitId?: string | null;
  deviceId?: string | null;
  deviceBrand?: string | null;
  device_id?: string | null;
  device_brand?: string | null;
  status?: string;
  lat?: number | null;
  lng?: number | null;
  scanned_at?: Date | null;
  scannedAt?: Date | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface BindOfficerDeviceInput {
  sessionToken?: string | null;
  deviceId: string;
  deviceBrand: string;
  nrp?: string | null;
  unitId?: string | null;
  lat: number;
  lng: number;
}

export interface IDeviceRepository {
  createPairingSession(sessionToken: string, nrp?: string, unitId?: string): Promise<DevicePairingSession>;
  getPairingSession(sessionToken: string): Promise<DevicePairingSession | null>;
  confirmPairingSession(
    sessionToken: string,
    deviceId: string,
    deviceBrand?: string,
    lat?: number,
    lng?: number
  ): Promise<DevicePairingSession | null>;
  bindOfficerDevice(input: BindOfficerDeviceInput): Promise<void>;
  checkPairingSession(sessionToken: string): Promise<DevicePairingSession | null>;
}

