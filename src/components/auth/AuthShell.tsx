'use client';

import React from 'react';
import LoginHeader from './LoginHeader';
import LoginFooter from './LoginFooter';
import '@/app/login.css';

interface AuthShellProps {
  children: React.ReactNode;
}

export default function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="login-body-wrapper">
      {/* Background Humanis Ambient Glow & Soft Wave */}
      <div className="humanis-ambient-glow" />
      <div className="soft-ambient-wave" />

      {/* Top Header Command Bar */}
      <LoginHeader />

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center my-auto py-3 sm:py-6">
        {children}
      </main>

      {/* Bottom Status Footer */}
      <LoginFooter />
    </div>
  );
}
