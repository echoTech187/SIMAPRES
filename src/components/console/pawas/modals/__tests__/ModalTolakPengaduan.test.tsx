// @vitest-environment happy-dom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ModalTolakPengaduan from '../ModalTolakPengaduan';

describe('ModalTolakPengaduan (React Testing Library Unit Test)', () => {
  const mockComplaint = {
    id: 101,
    nomorTiket: 'TIKET-110-20261031-001',
    namaPelapor: 'Warga Tester',
    teleponPelapor: '081234567890',
    jenisKejadian: 'Curat Ruko',
    alamatTkp: 'Jl. Merdeka No. 45',
  };

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <ModalTolakPengaduan
        isOpen={false}
        complaint={mockComplaint}
        onClose={vi.fn()}
        onConfirmReject={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders modal with complaint details and default reasons when isOpen is true', () => {
    render(
      <ModalTolakPengaduan
        isOpen={true}
        complaint={mockComplaint}
        onClose={vi.fn()}
        onConfirmReject={vi.fn()}
      />
    );
    expect(screen.getByText(/Tolak Pengaduan Masyarakat/i)).toBeDefined();
    expect(screen.getByText(/TIKET-110-20261031-001/i)).toBeDefined();
    expect(screen.getByText(/Laporan Palsu \/ Fiktif \/ Prank \/ Spam/i)).toBeDefined();
  });

  it('submits selected reason and notes when form is submitted', async () => {
    const handleReject = vi.fn().mockResolvedValue(undefined);
    render(
      <ModalTolakPengaduan
        isOpen={true}
        complaint={mockComplaint}
        onClose={vi.fn()}
        onConfirmReject={handleReject}
      />
    );

    const textarea = screen.getByPlaceholderText(/Tambahkan catatan penjelasan/i);
    fireEvent.change(textarea, { target: { value: 'Suara telepon terdengar prank anak-anak' } });

    const submitBtn = screen.getByRole('button', { name: /Konfirmasi Tolak Laporan/i });
    fireEvent.click(submitBtn);

    expect(handleReject).toHaveBeenCalledTimes(1);
    expect(handleReject).toHaveBeenCalledWith(
      expect.stringContaining('Laporan Palsu'),
      'Suara telepon terdengar prank anak-anak'
    );
  });

  it('disables submit button if "Lainnya" is selected and notes are empty', () => {
    render(
      <ModalTolakPengaduan
        isOpen={true}
        complaint={mockComplaint}
        onClose={vi.fn()}
        onConfirmReject={vi.fn()}
      />
    );

    const lainnyaOption = screen.getByText('Lainnya');
    fireEvent.click(lainnyaOption);

    const submitBtn = screen.getByRole('button', { name: /Konfirmasi Tolak Laporan/i });
    expect(submitBtn.hasAttribute('disabled')).toBe(true);
  });

  it('calls onClose when Batalkan button is clicked', () => {
    const handleClose = vi.fn();
    render(
      <ModalTolakPengaduan
        isOpen={true}
        complaint={mockComplaint}
        onClose={handleClose}
        onConfirmReject={vi.fn()}
      />
    );

    const cancelBtn = screen.getByRole('button', { name: /Batalkan/i });
    fireEvent.click(cancelBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
