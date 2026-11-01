// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TabBerandaPersonil from '../tabs/TabBerandaPersonil';
import TaskAcceptModal from '../components/TaskAcceptModal';
import { isTaskPendingAcceptance, hasOfficerAcceptedTask } from '../types';

describe('Personil Task Acceptance & Hero Alert UI Rules', () => {
  const dummyOfficer: any = {
    id: '150004',
    nrp: '84010567',
    fullName: 'AIPDA Fajar Nugroho',
    pangkat: 'AIPDA',
    satuan: 'Satuan Samapta Presisi',
    unit_id: 5,
    dutyStatus: 'DINAS_PATROLI',
    deviceId: 'DEV-HP-5C7EF02D',
  };

  const pendingComplaint: any = {
    id: '420011',
    nomorTiket: 'TICKET-1814481188',
    jenisKejadian: 'Kasus kecelakaan tabrak lari',
    urgensi: 'DARURAT',
    tkpAlamatTeks: 'Jalan Pahlawan, Gejlig, Pekalongan',
    status: 'DIPROSES',
    tahap: 2,
    dispatches: [
      {
        id: '300073',
        unit_id: 5,
        officer_id: null,
        accepted_at: null,
        personnel_quota: 1,
      },
    ],
  };

  const activeComplaint: any = {
    id: '420010',
    nomorTiket: 'TICKET-1826127457',
    jenisKejadian: 'Penindakan pelanggaran balap liar',
    urgensi: 'DARURAT',
    tkpAlamatTeks: 'Gejlig, Pekalongan',
    status: 'DIPROSES',
    tahap: 2,
    dispatches: [
      {
        id: '300069',
        unit_id: 5,
        officer_id: '150004',
        accepted_at: '2026-10-31T16:28:02.969Z',
        personnel_quota: 1,
      },
    ],
  };

  it('1. should NOT render pending task as an alert card on TabBerandaPersonil before being accepted', () => {
    render(
      <TabBerandaPersonil
        officer={dummyOfficer}
        complaints={[activeComplaint]}
        activeComplaint={activeComplaint}
        pendingAcceptTask={pendingComplaint}
        currentGps={{ lat: -7.0, lng: 109.5 }}
        fleetUnits={[]}
        hotspots={[]}
        policeOffices={[]}
        logbooks={[]}
        onTabChange={vi.fn()}
        onOpenAcceptModal={vi.fn()}
        onOpenChat={vi.fn()}
        onQuickAction={vi.fn()}
      />
    );

    // Hero Alert Banner statis untuk tiket masuk tidak boleh muncul di Beranda
    expect(screen.queryByText(/⚡ DISPOSISI MASUK • BUTUH KONFIRMASI/i)).toBeNull();
    expect(screen.queryByTestId('btn-hero-terima-tugas')).toBeNull();

    // Kartu tiket aktif yang sudah sah diterima tetap wajib tampil
    expect(screen.getByText(/PENUGASAN ADUAN AKTIF/i)).toBeDefined();
    expect(screen.getByText(/Penindakan pelanggaran balap liar/i)).toBeDefined();
  });

  it('2. should reject pending acceptance when officer already has an active task (hasActiveTask=true)', () => {
    const isPending = isTaskPendingAcceptance(
      pendingComplaint,
      dummyOfficer.nrp,
      dummyOfficer.id,
      dummyOfficer.unit_id,
      true // hasActiveTask = true
    );
    expect(isPending).toBe(false);
  });

  it('3. should accurately detect accepted task from dispatches via officer_id / nrp', () => {
    const isAccepted = hasOfficerAcceptedTask(
      activeComplaint,
      dummyOfficer.nrp,
      dummyOfficer.id
    );
    expect(isAccepted).toBe(true);

    const isPendingAccepted = hasOfficerAcceptedTask(
      pendingComplaint,
      dummyOfficer.nrp,
      dummyOfficer.id
    );
    expect(isPendingAccepted).toBe(false);
  });

  it('4. should trigger onClose and clean modal state when Abaikan / Nanti button is clicked', () => {
    const handleClose = vi.fn();
    const handleAccept = vi.fn();

    render(
      <TaskAcceptModal
        isOpen={true}
        task={pendingComplaint}
        officer={dummyOfficer}
        isAccepting={false}
        onAccept={handleAccept}
        onClose={handleClose}
      />
    );

    expect(screen.getByText(/PANGGILAN TUGAS LAPANGAN/i)).toBeDefined();
    expect(screen.getByText(/#TICKET-1814481188/i)).toBeDefined();

    const btnAbaikan = screen.getByText(/Abaikan \/ Nanti/i);
    fireEvent.click(btnAbaikan);

    expect(handleClose).toHaveBeenCalledTimes(1);
    expect(handleAccept).not.toHaveBeenCalled();
  });
});
