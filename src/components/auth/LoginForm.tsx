'use client';

import React from 'react';
import { useLoginForm } from './useLoginForm';
import LoginCardHeader from './LoginCardHeader';
import LoginAlerts from './LoginAlerts';
import LoginFormFields from './LoginFormFields';
import LoginCardFooter from './LoginCardFooter';

export default function LoginForm() {
  const form = useLoginForm();

  return (
    <div className="w-full lg:col-span-5 mx-auto max-w-md lg:max-w-none">
      <div className="obsidian-card rounded-3xl p-6 sm:p-8 shadow-2xl">
        {/* Terminal Card Header & Mobile Info Pill */}
        <LoginCardHeader greeting={form.dynamicGreeting} />

        {/* Notifikasi Alert Status Sesi & Error */}
        <LoginAlerts
          alertType={form.alertType}
          alertRole={form.alertRole}
          alertRequired={form.alertRequired}
          errorMsg={form.errorMsg}
        />

        {/* Formulir Input Kredensial & Tombol Masuk */}
        <LoginFormFields form={form} />

        {/* Link Publik Pelacakan Aduan Warga & Tagline */}
        <LoginCardFooter />
      </div>
    </div>
  );
}
