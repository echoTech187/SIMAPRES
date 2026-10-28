'use client';

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import '@/app/login.css';

interface TacticalInputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClear?: () => void;
  isPassword?: boolean;
  rightAction?: React.ReactNode;
}

export default function TacticalInputField({
  id,
  label,
  icon,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  autoComplete,
  className = '',
  onClear,
  isPassword = false,
  rightAction,
  ...rest
}: TacticalInputFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  const effectiveType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={`form-group-tactical ${className}`}>
      <label className="form-label-tactical" htmlFor={id}>
        <span>{label}</span>
      </label>

      <div className="input-container-tactical">
        {icon && <span className="input-icon-tactical">{icon}</span>}

        <input
          id={id}
          type={effectiveType}
          className="form-control-tactical font-mono"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          autoComplete={autoComplete}
          {...rest}
        />

        {/* Clear Button (Bila onClear disediakan dan value tidak kosong) */}
        {!isPassword && onClear && value && (
          <button
            type="button"
            onClick={onClear}
            className="input-action-tactical"
            title="Bersihkan input"
          >
            ✕
          </button>
        )}

        {/* Password Toggle Button (Bila isPassword aktif) */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="input-action-tactical"
            title={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}

        {/* Custom Right Action (Jika ada) */}
        {!isPassword && !onClear && rightAction && (
          <div className="input-action-tactical">{rightAction}</div>
        )}
      </div>
    </div>
  );
}
