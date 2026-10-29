import { describe, it, expect } from 'vitest';
import {
  validateResolutionSubmission,
  isEligibleForRestorativeJustice,
  requiresStrictTkpGps,
  getResolutionPermissions,
  ResolutionValidationContext,
} from '../resolution.rules';

describe('Domain Rules: Case Resolution & Restorative Justice (Perpol No. 8/2021)', () => {
  describe('validateResolutionSubmission', () => {
    it('approves complete and compliant resolution submission', () => {
      const context: ResolutionValidationContext = {
        locationKey: 'TKP',
        documentKey: 'BAP_DAMAI',
        kategoriKey: 'PERSELISIHAN_WARGA',
        hasPhotoEvidence: true,
        evidenceCount: 2,
        catatan: 'Kedua belah pihak sepakat berdamai secara kekeluargaan di hadapan Bhabinkamtibmas.',
      };

      const result = validateResolutionSubmission(context);
      expect(result.isValid).toBe(true);
      expect(result.missingRequirements).toHaveLength(0);
      expect(result.isRestorativeJusticeEligible).toBe(true);
    });

    it('rejects submission if resolution location is missing', () => {
      const context: ResolutionValidationContext = {
        locationKey: null,
        documentKey: 'BAP_DAMAI',
        hasPhotoEvidence: true,
        catatan: 'Penyelesaian damai tanpa memilih lokasi',
      };

      const result = validateResolutionSubmission(context);
      expect(result.isValid).toBe(false);
      expect(result.missingRequirements.some((r) => r.includes('lokasi'))).toBe(true);
    });

    it('rejects submission if photo or physical evidence is completely missing', () => {
      const context: ResolutionValidationContext = {
        locationKey: 'TKP',
        documentKey: 'DOKUMENTASI_KONDUSIF',
        hasPhotoEvidence: false,
        evidenceCount: 0,
        catatan: 'Situasi sudah aman terkendali tanpa foto dokumentasi',
      };

      const result = validateResolutionSubmission(context);
      expect(result.isValid).toBe(false);
      expect(result.missingRequirements.some((r) => r.includes('foto bukti'))).toBe(true);
    });

    it('rejects submission if notes are shorter than 10 characters', () => {
      const context: ResolutionValidationContext = {
        locationKey: 'TKP',
        documentKey: 'DOKUMENTASI_KONDUSIF',
        hasPhotoEvidence: true,
        catatan: 'Aman', // Only 4 chars
      };

      const result = validateResolutionSubmission(context);
      expect(result.isValid).toBe(false);
      expect(result.missingRequirements.some((r) => r.includes('minimal 10 karakter'))).toBe(true);
    });
  });

  describe('Restorative Justice Eligibility (Perpol No. 8/2021 Pasal 5)', () => {
    it('strictly forbids BAP Damai for severe crime categories (Narkoba, Pembunuhan, Terorisme)', () => {
      const severeCrimes = ['NARKOBA', 'PEMBUNUHAN', 'TERORISME', 'SENPI_ILEGAL', 'PERAMPOKAN'];

      for (const crime of severeCrimes) {
        const eligible = isEligibleForRestorativeJustice({
          kategoriKey: crime,
          documentKey: 'BAP_DAMAI',
        });
        expect(eligible).toBe(false);
      }
    });

    it('rejects BAP_DAMAI in validateResolutionSubmission when crime is restricted', () => {
      const context: ResolutionValidationContext = {
        locationKey: 'TKP',
        documentKey: 'BAP_DAMAI',
        kategoriKey: 'NARKOBA_SABU',
        hasPhotoEvidence: true,
        catatan: 'Pelaku berjanji tidak akan mengulang penyalahgunaan narkotika.',
      };

      const result = validateResolutionSubmission(context);
      expect(result.isValid).toBe(false);
      expect(result.isRestorativeJusticeEligible).toBe(false);
      expect(result.missingRequirements.some((r) => r.includes('Restorative Justice'))).toBe(true);
    });

    it('permits Restorative Justice for general tipiring and minor disputes', () => {
      const eligible = isEligibleForRestorativeJustice({
        kategoriKey: 'PENGHINAAN_RINGAN',
        documentKey: 'BAP_DAMAI',
        kerugianEstimasi: 500000,
      });
      expect(eligible).toBe(true);
    });
  });

  describe('requiresStrictTkpGps Rule', () => {
    it('requires strict TKP GPS when resolution occurs on scene (TKP)', () => {
      expect(requiresStrictTkpGps('TKP')).toBe(true);
    });

    it('allows GPS deviation when resolution is conducted at Polsek or Hospital', () => {
      expect(requiresStrictTkpGps('KANTOR_POLISI')).toBe(false);
      expect(requiresStrictTkpGps('RUMAH_SAKIT')).toBe(false);
      expect(requiresStrictTkpGps('KANTOR_KELURAHAN')).toBe(false);
    });
  });

  describe('RBAC Resolution Permissions', () => {
    it('permits assigned officer to submit resolution while ticket is in progress (DIPROSES)', () => {
      const perms = getResolutionPermissions('DIPROSES', 'PERSONIL', true);
      expect(perms.canSubmitResolution).toBe(true);
      expect(perms.canApproveResolution).toBe(false);
    });

    it('permits Pawas to approve or reject resolution when awaiting approval (MENUNGGU_PENGESAHAN)', () => {
      const perms = getResolutionPermissions('MENUNGGU_PENGESAHAN', 'PAWAS', false);
      expect(perms.canApproveResolution).toBe(true);
      expect(perms.canRejectResolution).toBe(true);
    });

    it('prevents regular personnel from approving their own resolution', () => {
      const perms = getResolutionPermissions('MENUNGGU_PENGESAHAN', 'PERSONIL', true);
      expect(perms.canApproveResolution).toBe(false);
    });
  });
});
