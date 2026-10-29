import { describe, it, expect } from 'vitest';
import {
  getComplaintActionPermissions,
  ComplaintActionContext,
} from '../complaint.rules';

describe('Domain Rules: Complaint Action Permissions & State Machine', () => {
  describe('Operator Permissions', () => {
    it('allows Operator to dispatch new tickets with status MENUNGGU', () => {
      const context: ComplaintActionContext = {
        status: 'MENUNGGU',
        role: 'OPERATOR',
      };
      const perms = getComplaintActionPermissions(context);
      expect(perms.canDispatch).toBe(true);
      expect(perms.canRejectTicket).toBe(true);
    });

    it('prevents Operator from approving resolutions (only Pawas can approve)', () => {
      const context: ComplaintActionContext = {
        status: 'MENUNGGU_PENGESAHAN',
        tahap: 5,
        role: 'OPERATOR',
      };
      const perms = getComplaintActionPermissions(context);
      expect(perms.canApproveResolution).toBe(false);
      expect(perms.canRejectResolution).toBe(false);
    });
  });

  describe('Pawas (Perwira Pengawas) Permissions', () => {
    it('allows Pawas to approve resolution when ticket is awaiting approval', () => {
      const context: ComplaintActionContext = {
        status: 'MENUNGGU_PENGESAHAN',
        tahap: 5,
        role: 'PAWAS',
      };
      const perms = getComplaintActionPermissions(context);
      expect(perms.canApproveResolution).toBe(true);
      expect(perms.canRejectResolution).toBe(true);
    });

    it('allows Pawas to reassign ticket before personnel departs', () => {
      const context: ComplaintActionContext = {
        status: 'DIPROSES',
        tahap: 2,
        role: 'PAWAS',
        dispatchStatus: 'DISPATCHED',
      };
      const perms = getComplaintActionPermissions(context);
      expect(perms.canReassign).toBe(true);
    });
  });

  describe('Field Personnel (Personil Lapangan) Lifecycle', () => {
    it('allows assigned personnel to meluncur (depart) when in preparation stage', () => {
      const context: ComplaintActionContext = {
        status: 'DIPROSES',
        tahap: 2,
        role: 'PERSONIL',
        isAssignedOfficer: true,
        dispatchStatus: 'DISPATCHED',
      };
      const perms = getComplaintActionPermissions(context);
      expect(perms.canStartMeluncur).toBe(true);
      expect(perms.canArriveTkp).toBe(false);
    });

    it('allows personnel to confirm arrival at TKP once en route (DEPARTED)', () => {
      const context: ComplaintActionContext = {
        status: 'DIPROSES',
        tahap: 3,
        role: 'PERSONIL',
        isAssignedOfficer: true,
        dispatchStatus: 'DEPARTED',
      };
      const perms = getComplaintActionPermissions(context);
      expect(perms.canStartMeluncur).toBe(false);
      expect(perms.canArriveTkp).toBe(true);
    });

    it('allows personnel to submit BAP and request Pawas approval once arrived at TKP', () => {
      const context: ComplaintActionContext = {
        status: 'DIPROSES',
        tahap: 4,
        role: 'PERSONIL',
        isAssignedOfficer: true,
        dispatchStatus: 'ARRIVED',
      };
      const perms = getComplaintActionPermissions(context);
      expect(perms.canSubmitTindakan).toBe(true);
      expect(perms.canRequestPawasApproval).toBe(true);
    });

    it('prevents non-assigned personnel from taking field actions', () => {
      const context: ComplaintActionContext = {
        status: 'DIPROSES',
        tahap: 3,
        role: 'PERSONIL',
        isAssignedOfficer: false, // Not assigned
        dispatchStatus: 'DEPARTED',
      };
      const perms = getComplaintActionPermissions(context);
      expect(perms.canArriveTkp).toBe(false);
      expect(perms.canSubmitTindakan).toBe(false);
    });
  });

  describe('Citizen (Warga) Permissions', () => {
    it('allows citizen to rate IKM only when ticket is completed (SELESAI)', () => {
      const completedContext: ComplaintActionContext = {
        status: 'SELESAI',
        role: 'WARGA',
      };
      expect(getComplaintActionPermissions(completedContext).canRateIKM).toBe(true);

      const inProgressContext: ComplaintActionContext = {
        status: 'DIPROSES',
        role: 'WARGA',
      };
      expect(getComplaintActionPermissions(inProgressContext).canRateIKM).toBe(false);
    });
  });
});
