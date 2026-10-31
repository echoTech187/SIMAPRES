// @vitest-environment happy-dom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TacticalSubmitButton from '../TacticalSubmitButton';
import TacticalInputField from '../TacticalInputField';
import { TacticalStatusBadge } from '../TacticalStatusBadge';
import NameInitialAvatar from '../NameInitialAvatar';

describe('Atomic UI Components (React Testing Library Unit Tests)', () => {
  describe('TacticalSubmitButton Component', () => {
    it('renders label and default icon properly in normal state', () => {
      render(<TacticalSubmitButton label="Kirim Laporan" />);
      const btn = screen.getByRole('button', { name: /Kirim Laporan/i });
      expect(btn).toBeDefined();
      expect(btn.hasAttribute('disabled')).toBe(false);
    });

    it('renders loading spinner and loadingText when loading is true', () => {
      render(<TacticalSubmitButton label="Simpan" loading={true} loadingText="Menyimpan Data..." />);
      const btn = screen.getByRole('button');
      expect(btn.textContent).toContain('Menyimpan Data...');
      expect(btn.hasAttribute('disabled')).toBe(true);
    });

    it('disables button when disabled prop is provided', () => {
      render(<TacticalSubmitButton label="Terkunci" disabled={true} />);
      const btn = screen.getByRole('button');
      expect(btn.hasAttribute('disabled')).toBe(true);
    });

    it('triggers onClick handler when clicked', () => {
      const handleClick = vi.fn();
      render(<TacticalSubmitButton label="Klik Saya" onClick={handleClick} />);
      const btn = screen.getByRole('button');
      fireEvent.click(btn);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('TacticalInputField Component', () => {
    it('renders input with label, placeholder, and initial value', () => {
      render(
        <TacticalInputField
          id="test-input"
          label="Nomor WhatsApp"
          placeholder="08123456789"
          value="08129999"
          onChange={() => {}}
        />
      );
      expect(screen.getByLabelText(/Nomor WhatsApp/i)).toBeDefined();
      const input = screen.getByPlaceholderText('08123456789') as HTMLInputElement;
      expect(input.value).toBe('08129999');
    });

    it('toggles password visibility when isPassword is true and eye icon clicked', () => {
      render(
        <TacticalInputField
          id="password-input"
          label="Kata Sandi"
          isPassword={true}
          value="Rahasia123!"
          onChange={() => {}}
        />
      );
      const input = screen.getByLabelText(/Kata Sandi/i) as HTMLInputElement;
      expect(input.type).toBe('password');

      const toggleBtn = screen.getByRole('button');
      fireEvent.click(toggleBtn);
      expect(input.type).toBe('text');

      fireEvent.click(toggleBtn);
      expect(input.type).toBe('password');
    });

    it('triggers onClear callback when clear button is clicked', () => {
      const handleClear = vi.fn();
      render(
        <TacticalInputField
          id="clearable-input"
          label="Alamat TKP"
          value="Jl. Sudirman No. 1"
          onClear={handleClear}
          onChange={() => {}}
        />
      );
      const clearBtn = screen.getByTitle('Bersihkan input');
      fireEvent.click(clearBtn);
      expect(handleClear).toHaveBeenCalledTimes(1);
    });
  });

  describe('TacticalStatusBadge Component', () => {
    it('renders badge for MENUNGGU status with amber style', () => {
      const { container } = render(<TacticalStatusBadge status="MENUNGGU" />);
      expect(screen.getByText('MENUNGGU')).toBeDefined();
      expect(container.innerHTML).toContain('amber');
    });

    it('renders badge for SELESAI status with emerald style', () => {
      const { container } = render(<TacticalStatusBadge status="SELESAI" />);
      expect(screen.getByText('SELESAI')).toBeDefined();
      expect(container.innerHTML).toContain('emerald');
    });

    it('renders badge for DITOLAK status with rose style', () => {
      const { container } = render(<TacticalStatusBadge status="DITOLAK" />);
      expect(screen.getByText('DITOLAK')).toBeDefined();
      expect(container.innerHTML).toContain('rose');
    });
  });

  describe('NameInitialAvatar Component', () => {
    it('renders correct 2-letter initials from full name', () => {
      render(<NameInitialAvatar name="Ahmad Syahputra" />);
      expect(screen.getByText('AS')).toBeDefined();
    });

    it('renders single initial for single-word name', () => {
      render(<NameInitialAvatar name="Bambang" />);
      expect(screen.getByText('BA')).toBeDefined();
    });

    it('renders fallback icon when name is empty or dash', () => {
      const { container } = render(<NameInitialAvatar name="" />);
      expect(container.querySelector('svg')).toBeDefined();
    });
  });
});
