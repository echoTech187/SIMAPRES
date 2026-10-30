/**
 * Theme Mapper Utility (SIMAPRES 110 Enterprise v4.0)
 * Decouples UI CSS colors, badges, and status styling from database schema.
 */

export interface SourceTheme {
  activeBg: string;
  activeText: string;
  inactiveBg: string;
  inactiveText: string;
  inactiveBorder: string;
  // Backward-compatible snake_case properties
  active_bg?: string;
  active_text?: string;
  inactive_bg?: string;
  inactive_text?: string;
  inactive_border?: string;
}

export const REPORT_SOURCE_THEME: Record<string, SourceTheme> = {
  CALL_110: {
    activeBg: '#EF4444',
    activeText: '#FFFFFF',
    inactiveBg: '#FEF2F2',
    inactiveText: '#991B1B',
    inactiveBorder: '#FECACA',
    active_bg: '#EF4444',
    active_text: '#FFFFFF',
    inactive_bg: '#FEF2F2',
    inactive_text: '#991B1B',
    inactive_border: '#FECACA',
  },
  WHATSAPP_PRESISI: {
    activeBg: '#10B981',
    activeText: '#FFFFFF',
    inactiveBg: '#ECFDF5',
    inactiveText: '#065F46',
    inactiveBorder: '#A7F3D0',
    active_bg: '#10B981',
    active_text: '#FFFFFF',
    inactive_bg: '#ECFDF5',
    inactive_text: '#065F46',
    inactive_border: '#A7F3D0',
  },
  MOBILE_APP: {
    activeBg: '#3B82F6',
    activeText: '#FFFFFF',
    inactiveBg: '#EFF6FF',
    inactiveText: '#1E40AF',
    inactiveBorder: '#BFDBFE',
    active_bg: '#3B82F6',
    active_text: '#FFFFFF',
    inactive_bg: '#EFF6FF',
    inactive_text: '#1E40AF',
    inactive_border: '#BFDBFE',
  },
  SPKT_WALK_IN: {
    activeBg: '#F59E0B',
    activeText: '#FFFFFF',
    inactiveBg: '#FFFBEB',
    inactiveText: '#92400E',
    inactiveBorder: '#FDE68A',
    active_bg: '#F59E0B',
    active_text: '#FFFFFF',
    inactive_bg: '#FFFBEB',
    inactive_text: '#92400E',
    inactive_border: '#FDE68A',
  },
};

export const VEHICLE_STATUS_COLOR: Record<string, string> = {
  SIAGA: '#10B981',
  PATROLI: '#3B82F6',
  MENUJU_TKP: '#EF4444',
  PERAWATAN: '#6B7280',
};

export const DEFAULT_SOURCE_THEME: SourceTheme = {
  activeBg: '#3B82F6',
  activeText: '#FFFFFF',
  inactiveBg: '#F8FAFC',
  inactiveText: '#475569',
  inactiveBorder: '#E2E8F0',
  active_bg: '#3B82F6',
  active_text: '#FFFFFF',
  inactive_bg: '#F8FAFC',
  inactive_text: '#475569',
  inactive_border: '#E2E8F0',
};

export function getReportSourceTheme(sourceKey?: string | null): SourceTheme {
  if (!sourceKey) return DEFAULT_SOURCE_THEME;
  return REPORT_SOURCE_THEME[sourceKey.toUpperCase()] || DEFAULT_SOURCE_THEME;
}

export function getVehicleStatusColor(statusKey?: string | null): string {
  if (!statusKey) return '#10B981';
  return VEHICLE_STATUS_COLOR[statusKey.toUpperCase()] || '#10B981';
}
