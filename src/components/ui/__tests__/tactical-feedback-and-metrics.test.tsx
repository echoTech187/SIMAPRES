// @vitest-environment happy-dom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import TacticalAlert from '../TacticalAlert';
import TacticalMetricTile from '../TacticalMetricTile';
import TacticalTelemetryPod from '../TacticalTelemetryPod';
import ToastContainer, { toast } from '../Toast';
import { Shield } from 'lucide-react';

describe('Tactical UI Feedback & Telemetry Components', () => {
  describe('TacticalAlert', () => {
    it('returns null when no title, message, or children are provided', () => {
      const { container } = render(<TacticalAlert />);
      expect(container.firstChild).toBeNull();
    });

    it('renders with error variant, title and message', () => {
      render(
        <TacticalAlert
          variant="error"
          title="Gagal Terhubung"
          message="Server tidak dapat dijangkau"
        />
      );

      expect(screen.getByText('Gagal Terhubung')).toBeDefined();
      expect(screen.getByText('Server tidak dapat dijangkau')).toBeDefined();
    });

    it('renders with success variant and custom icon', () => {
      render(
        <TacticalAlert
          variant="success"
          title="Berhasil Disimpan"
          message="Data telah diperbarui"
        />
      );

      expect(screen.getByText('Berhasil Disimpan')).toBeDefined();
      expect(screen.getByText('Data telah diperbarui')).toBeDefined();
    });

    it('triggers onClose when close button is clicked', () => {
      const handleClose = vi.fn();
      render(
        <TacticalAlert
          variant="warning"
          title="Perhatian"
          message="Baterai perangkat rendah"
          onClose={handleClose}
        />
      );

      const closeBtn = screen.getByRole('button', { name: /Tutup pemberitahuan/i });
      fireEvent.click(closeBtn);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('TacticalMetricTile', () => {
    it('renders label, formatted value, and sublabel correctly', () => {
      render(
        <TacticalMetricTile
          label="Total Tiket"
          value={42}
          sublabel="Hari Ini"
          accentColor="#0284c7"
        />
      );

      expect(screen.getByText('Total Tiket')).toBeDefined();
      expect(screen.getByText('42')).toBeDefined();
      expect(screen.getByText('Hari Ini')).toBeDefined();
    });

    it('triggers onClick when clicked', () => {
      const handleClick = vi.fn();
      render(
        <TacticalMetricTile
          label="Selesai"
          value="18"
          accentColor="#10b981"
          onClick={handleClick}
        />
      );

      const tile = screen.getByText('Selesai').closest('div');
      expect(tile).not.toBeNull();
      if (tile) {
        fireEvent.click(tile);
        expect(handleClick).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe('TacticalTelemetryPod', () => {
    it('renders telemetry details and badge correctly', () => {
      render(
        <TacticalTelemetryPod
          icon={Shield}
          iconBgColor="#e0f2fe"
          iconColor="#0369a1"
          title="Unit Patroli Sabhara"
          subtitle="Mobil Ranger 01"
          count={5}
          badgeLabel="Siaga Mako"
          badgeColor="#059669"
          podBg="#f8fafc"
          podBorder="#cbd5e1"
        />
      );

      expect(screen.getByText('Unit Patroli Sabhara')).toBeDefined();
      expect(screen.getByText('Mobil Ranger 01')).toBeDefined();
      expect(screen.getByText('5')).toBeDefined();
      expect(screen.getByText('Siaga Mako')).toBeDefined();
    });

    it('triggers onClick handler on telemetry pod', () => {
      const handleClick = vi.fn();
      render(
        <TacticalTelemetryPod
          icon={Shield}
          iconBgColor="#e0f2fe"
          iconColor="#0369a1"
          title="Pos Polisi"
          subtitle="Subsektor"
          count={1}
          badgeLabel="Aktif"
          badgeColor="#059669"
          podBg="#ffffff"
          podBorder="#e2e8f0"
          onClick={handleClick}
        />
      );

      const pod = screen.getByText('Pos Polisi').closest('div');
      expect(pod).not.toBeNull();
      if (pod) {
        fireEvent.click(pod);
        expect(handleClick).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe('Toast Notification Engine', () => {
    it('renders a toast notification when custom event is dispatched', () => {
      render(<ToastContainer />);

      act(() => {
        toast.success('Pembaruan Sukses', 'Status tiket berhasil diubah');
      });

      expect(screen.getByText('Pembaruan Sukses')).toBeDefined();
      expect(screen.getByText('Status tiket berhasil diubah')).toBeDefined();
    });

    it('auto-detects error keyword with toast.showNotification', () => {
      render(<ToastContainer />);

      act(() => {
        toast.showNotification('Terjadi kegagalan sinkronisasi data');
      });

      expect(screen.getByText('Terjadi Kendala')).toBeDefined();
      expect(screen.getByText('Terjadi kegagalan sinkronisasi data')).toBeDefined();
    });

    it('removes toast when dismiss button is clicked', () => {
      render(<ToastContainer />);

      act(() => {
        toast.info('Pemberitahuan Sistem', 'Sesi dinas masih aktif');
      });

      expect(screen.getByText('Pemberitahuan Sistem')).toBeDefined();

      const closeButtons = screen.getAllByRole('button');
      const dismissBtn = closeButtons.find((btn) => btn.getAttribute('title')?.includes('Tutup'));
      expect(dismissBtn).toBeDefined();

      if (dismissBtn) {
        act(() => {
          fireEvent.click(dismissBtn);
        });
        expect(screen.queryByText('Pemberitahuan Sistem')).toBeNull();
      }
    });
  });
});
