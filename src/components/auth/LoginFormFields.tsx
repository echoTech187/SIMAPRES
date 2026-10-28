import React from 'react';
import { User, Lock } from 'lucide-react';
import TacticalInputField from '@/components/ui/TacticalInputField';
import TacticalSubmitButton from '@/components/ui/TacticalSubmitButton';
import { useLoginForm } from './useLoginForm';

interface LoginFormFieldsProps {
  form: ReturnType<typeof useLoginForm>;
}

export default function LoginFormFields({ form }: LoginFormFieldsProps) {
  const {
    nrp,
    setNrp,
    clearNrp,
    password,
    setPassword,
    loading,
    handleLogin,
  } = form;

  return (
    <form onSubmit={handleLogin} className="space-y-4 pt-1">
      {/* Field 1: NRP / ID Petugas */}
      <TacticalInputField
        id="login-nrp"
        label="NRP / ID Petugas"
        icon={<User size={16} />}
        placeholder="Masukkan 8 digit NRP petugas"
        value={nrp}
        onChange={(e) => setNrp(e.target.value)}
        onClear={clearNrp}
        required
        autoComplete="username"
      />

      {/* Field 2: Kata Sandi Kedinasan */}
      <TacticalInputField
        id="login-pass"
        label="Kata Sandi Kedinasan"
        icon={<Lock size={16} />}
        placeholder="Masukkan kata sandi akun dinas"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        isPassword
        required
        autoComplete="current-password"
      />

      {/* Tombol Masuk Dinamis */}
      <TacticalSubmitButton
        loading={loading}
        loadingText="Memverifikasi akun dinas..."
        label="Masuk ke Layanan 110"
      />
    </form>
  );
}
