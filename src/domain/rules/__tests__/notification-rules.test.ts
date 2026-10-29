import { describe, it, expect } from 'vitest';
import {
  sanitizePhoneNumber,
  isValidIndonesianPhoneNumber,
  evaluateComplaintNotificationPolicy,
  ComplaintNotificationContext,
} from '../notification.rules';

describe('Domain Rules: WhatsApp Notification & Audit Log Policy', () => {
  describe('sanitizePhoneNumber & isValidIndonesianPhoneNumber', () => {
    it('sanitizes messy phone inputs with dashes, spaces, and country codes', () => {
      expect(sanitizePhoneNumber('0812-3456-7890')).toBe('081234567890');
      expect(sanitizePhoneNumber('+62 812 3456 7890')).toBe('6281234567890');
      expect(sanitizePhoneNumber('  087875856918  ')).toBe('087875856918');
    });

    it('returns empty string for placeholder/null phone values', () => {
      expect(sanitizePhoneNumber('-')).toBe('');
      expect(sanitizePhoneNumber('0')).toBe('');
      expect(sanitizePhoneNumber('null')).toBe('');
      expect(sanitizePhoneNumber(null)).toBe('');
      expect(sanitizePhoneNumber(undefined)).toBe('');
    });

    it('validates genuine Indonesian mobile numbers (9 - 15 digits)', () => {
      expect(isValidIndonesianPhoneNumber('081234567890')).toBe(true);
      expect(isValidIndonesianPhoneNumber('6287875856918')).toBe(true);
      expect(isValidIndonesianPhoneNumber('+628123456789')).toBe(true);
    });

    it('rejects short numbers, landline fragments, or letters', () => {
      expect(isValidIndonesianPhoneNumber('110')).toBe(false);
      expect(isValidIndonesianPhoneNumber('12345')).toBe(false);
      expect(isValidIndonesianPhoneNumber('abcdef')).toBe(false);
      expect(isValidIndonesianPhoneNumber('-')).toBe(false);
    });
  });

  describe('evaluateComplaintNotificationPolicy Policy Decision', () => {
    const baseContext: ComplaintNotificationContext = {
      nomorTiket: 'TICKET-20261030-999',
      pelaporNama: 'Siti Aminah',
      pelaporHp: '0812-3456-7890',
      jenisKejadian: 'PENCURIAN',
      tkpAlamatTeks: 'Pasar Kajen Pekalongan',
      assignedOfficerName: 'Bripka Joko',
      assignedOfficerHp: '0878-7585-6918',
      patrolVehicleName: 'Sedan Samapta',
      actorName: 'Operator 110',
      actorRole: 'OPERATOR',
    };

    it('decides to notify citizen when ticket is created', () => {
      const decision = evaluateComplaintNotificationPolicy('TICKET_CREATED', baseContext);

      expect(decision.shouldNotifyCitizen).toBe(true);
      expect(decision.shouldNotifyOfficer).toBe(false);
      expect(decision.cleanCitizenPhone).toBe('081234567890');
      expect(decision.auditLog.action).toBe('WHATSAPP_NOTIFICATION');
    });

    it('decides to notify both citizen and assigned officer when dispatched', () => {
      const decision = evaluateComplaintNotificationPolicy('OFFICER_DISPATCHED', baseContext);

      expect(decision.shouldNotifyCitizen).toBe(true);
      expect(decision.shouldNotifyOfficer).toBe(true);
      expect(decision.cleanCitizenPhone).toBe('081234567890');
      expect(decision.cleanOfficerPhone).toBe('087875856918');
      expect(decision.auditLog.action).toBe('WHATSAPP_DISPATCH_ALERT');
    });

    it('decides to invite citizen to rate IKM when case is resolved', () => {
      const decision = evaluateComplaintNotificationPolicy('CASE_RESOLVED', baseContext);

      expect(decision.shouldNotifyCitizen).toBe(true);
      expect(decision.auditLog.action).toBe('WHATSAPP_RESOLUTION_SURVEY');
    });

    it('suppresses citizen notification if pelaporHp is invalid or absent', () => {
      const contextNoHp: ComplaintNotificationContext = {
        ...baseContext,
        pelaporHp: '-', // Tidak mencantumkan HP
      };

      const decision = evaluateComplaintNotificationPolicy('TICKET_CREATED', contextNoHp);
      expect(decision.shouldNotifyCitizen).toBe(false);
      expect(decision.cleanCitizenPhone).toBeNull();
    });
  });
});
