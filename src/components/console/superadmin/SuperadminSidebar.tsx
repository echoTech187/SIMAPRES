'use client';

import React, { useState } from 'react';
import { SuperadminTab } from '../SuperadminConsoleView';

interface SidebarGroup {
  id: string;
  title: string;
  icon: string;
  items: SidebarItem[];
}

interface SidebarItem {
  key: SuperadminTab;
  label: string;
  icon: string;
  badge?: string | number;
  badgeColor?: 'blue' | 'slate' | 'sky' | 'emerald';
  description?: string;
}

interface SuperadminSidebarProps {
  activeTab: SuperadminTab;
  onTabChange: (tab: SuperadminTab) => void;
  counters: {
    units?: number;
    ranks?: number;
    roles?: number;
    categories?: number;
    stations?: number;
    vehicles?: number;
    hotspots?: number;
    subcategories?: number;
    knowledgeFaqs?: number;
    resolutionLocations?: number;
    resolutionDocuments?: number;
    [key: string]: any;
  };
  unitsCount: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function SuperadminSidebar({
  activeTab,
  onTabChange,
  counters,
  unitsCount,
  isCollapsed,
  onToggleCollapse,
}: SuperadminSidebarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Grouped Navigation Architecture
  const groups: SidebarGroup[] = [
    {
      id: 'logistik',
      title: 'Logistik & Anggaran DIPA',
      icon: '⛽',
      items: [
        {
          key: 'fuel_type',
          label: 'Master BBM DIPA',
          icon: '🛢️',
          badge: 5,
          badgeColor: 'blue',
          description: 'Tarif acuan liter bahan bakar dinas',
        },
      ],
    },
    {
      id: 'knowledge',
      title: 'Pusat Pengetahuan SOP',
      icon: '📖',
      items: [
        {
          key: 'knowledge_faq',
          label: 'Buku Pintar SOP 110',
          icon: '📖',
          badge: counters.knowledgeFaqs || 12,
          badgeColor: 'blue',
          description: 'Katalog tanya jawab syarat pelayanan',
        },
      ],
    },
    {
      id: 'wilayah',
      title: 'Kewilayahan & Armada',
      icon: '🏢',
      items: [
        {
          key: 'station',
          label: 'Kantor Polisi (Mako)',
          icon: '🏢',
          badge: counters.stations || 20,
          badgeColor: 'slate',
          description: 'Data Mako Polres, Polsek, & Meja Piket',
        },
        {
          key: 'armada',
          label: 'Armada Ranmor Patroli',
          icon: '🚔',
          badge: counters.vehicles || 5,
          badgeColor: 'slate',
          description: 'Kendaraan dinas R4 & R2 patroli presisi',
        },
        {
          key: 'hotspot',
          label: 'Titik Rawan (GIS)',
          icon: '📍',
          badge: counters.hotspots || 0,
          badgeColor: 'slate',
          description: 'Peta pemetaan zona rawan kejahatan',
        },
      ],
    },
    {
      id: 'kasus',
      title: 'Taksonomi Insiden',
      icon: '🚨',
      items: [
        {
          key: 'kategori',
          label: 'Kategori Insiden',
          icon: '🚨',
          badge: counters.categories || 5,
          badgeColor: 'slate',
          description: 'Klasifikasi utama panggilan darurat',
        },
        {
          key: 'subkategori',
          label: 'Subkategori Kasus',
          icon: '📑',
          badge: counters.subcategories || 44,
          badgeColor: 'slate',
          description: 'Perincian 44 jenis tindak pidana & laka',
        },
      ],
    },
    {
      id: 'sdm',
      title: 'Organisasi & Personel',
      icon: '👮',
      items: [
        {
          key: 'unit',
          label: 'Satuan & Personel',
          icon: '👮',
          badge: unitsCount || 10,
          badgeColor: 'blue',
          description: 'Pendaftaran anggota & pairing device GPS',
        },
        {
          key: 'satuan',
          label: 'Satuan Operasional',
          icon: '🛡️',
          badge: counters.units || 5,
          badgeColor: 'slate',
          description: 'Daftar unit Samapta, Reskrim, Lantas, dll.',
        },
      ],
    },
  ];

  // Optional Advanced Masters
  const advancedItems: SidebarItem[] = [
    {
      key: 'lokasi_penyelesaian',
      label: 'Lokasi Selesai (TKP/RS)',
      icon: '📍',
      badge: counters.resolutionLocations || 5,
      badgeColor: 'slate',
    },
    {
      key: 'dokumen_penyelesaian',
      label: 'Dokumen Bukti BAP',
      icon: '📄',
      badge: counters.resolutionDocuments || 6,
      badgeColor: 'slate',
    },
    {
      key: 'hotspot_cat',
      label: 'Kategori Titik Rawan',
      icon: '🗺️',
      badge: 'GIS',
      badgeColor: 'slate',
    },
    {
      key: 'duty',
      label: 'Status Kedinasan',
      icon: '📋',
      badge: 'SOP',
      badgeColor: 'slate',
    },
  ];

  const getBadgeStyle = (color?: string, isActive?: boolean) => {
    if (isActive) {
      return {
        background: '#2563EB',
        color: '#FFFFFF',
      };
    }
    switch (color) {
      case 'sky':
        return { background: '#E0F2FE', color: '#0369A1' };
      case 'emerald':
        return { background: '#D1FAE5', color: '#047857' };
      case 'blue':
        return { background: '#DBEAFE', color: '#1D4ED8' };
      default:
        return { background: '#F1F5F9', color: '#475569' };
    }
  };

  return (
    <aside
      id="simopmas-superadmin-sidebar"
      style={{
        width: isCollapsed ? '76px' : '272px',
        minWidth: isCollapsed ? '76px' : '272px',
        transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
        background: '#FFFFFF',
        borderRight: '1px solid #E2E8F0',
        height: '100%',
        minHeight: '100%',
        maxHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '2px 0 10px rgba(15, 23, 42, 0.03)',
        zIndex: 40,
        userSelect: 'none',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {/* Top Sidebar Header & Collapse Toggle */}
      <div
        style={{
          padding: isCollapsed ? '16px 8px' : '16px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          borderBottom: '1px solid #F1F5F9',
          background: '#FAFAFC',
          flexShrink: 0,
        }}
      >
        {!isCollapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#10B981',
                boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)',
              }}
            />
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: '#64748B',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Master Console
            </span>
          </div>
        )}

        <button
          type="button"
          id="btn-toggle-superadmin-sidebar"
          onClick={onToggleCollapse}
          title={isCollapsed ? 'Perluas Sidebar' : 'Ciutkan Sidebar'}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            border: '1px solid #E2E8F0',
            background: '#FFFFFF',
            color: '#475569',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '13px',
            transition: 'all 0.15s ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#F1F5F9';
            e.currentTarget.style.color = '#1E293B';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#FFFFFF';
            e.currentTarget.style.color = '#475569';
          }}
        >
          {isCollapsed ? '▶' : '◀'}
        </button>
      </div>

      {/* Scrollable Navigation Body */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: isCollapsed ? '14px 8px' : '14px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {groups.map((group) => (
          <div key={group.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {/* Section Category Title */}
            {!isCollapsed ? (
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  letterSpacing: '0.07em',
                  color: '#94A3B8',
                  textTransform: 'uppercase',
                  padding: '4px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>{group.icon}</span>
                <span>{group.title}</span>
              </div>
            ) : (
              <div
                style={{
                  height: '1px',
                  background: '#F1F5F9',
                  margin: '4px 8px 8px 8px',
                }}
              />
            )}

            {/* Menu Items */}
            {group.items.map((item) => {
              const isActive = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  id={`sidebar-item-${item.key}`}
                  type="button"
                  onClick={() => onTabChange(item.key)}
                  title={isCollapsed ? `${item.label} (${item.badge ?? ''})` : item.description}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: isCollapsed ? '10px 0' : '9px 12px',
                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                    borderRadius: '9px',
                    border: isActive ? '1px solid #BFDBFE' : '1px solid transparent',
                    borderLeft: isActive ? '3.5px solid #2563EB' : '3.5px solid transparent',
                    background: isActive ? '#EFF6FF' : 'transparent',
                    color: isActive ? '#153E75' : '#334155',
                    fontSize: '12.5px',
                    fontWeight: isActive ? 700 : 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    textAlign: 'left',
                    width: '100%',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = '#F8FAFC';
                      e.currentTarget.style.color = '#0F172A';
                      e.currentTarget.style.transform = 'translateX(2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#334155';
                      e.currentTarget.style.transform = 'none';
                    }
                  }}
                >
                  <span
                    style={{
                      fontSize: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: '22px',
                    }}
                  >
                    {item.icon}
                  </span>

                  {!isCollapsed && (
                    <>
                      <span
                        style={{
                          flex: 1,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {item.label}
                      </span>

                      {item.badge !== undefined && (
                        <span
                          style={{
                            fontSize: '10.5px',
                            fontWeight: 800,
                            padding: '1.5px 7px',
                            borderRadius: '10px',
                            ...getBadgeStyle(item.badgeColor, isActive),
                          }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}

                  {/* Indicator Dot on Collapsed Mode if Active */}
                  {isCollapsed && isActive && (
                    <span
                      style={{
                        position: 'absolute',
                        right: '4px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '4px',
                        height: '16px',
                        background: '#2563EB',
                        borderRadius: '2px',
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        ))}

        {/* Optional Collapsible Group: Master Lanjutan */}
        <div style={{ marginTop: '8px', borderTop: '1px solid #F1F5F9', paddingTop: '10px' }}>
          {!isCollapsed ? (
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 10px',
                background: 'transparent',
                border: 'none',
                color: '#64748B',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                borderRadius: '6px',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>⚙️</span>
                <span>Master Lanjutan</span>
              </span>
              <span style={{ fontSize: '10px' }}>{showAdvanced ? '▲' : '▼'}</span>
            </button>
          ) : null}

          {(!isCollapsed && showAdvanced) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
              {advancedItems.map((item) => {
                const isActive = activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => onTabChange(item.key)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '7px 12px',
                      borderRadius: '8px',
                      border: isActive ? '1px solid #BFDBFE' : '1px solid transparent',
                      background: isActive ? '#EFF6FF' : 'transparent',
                      color: isActive ? '#153E75' : '#475569',
                      fontSize: '11.5px',
                      fontWeight: isActive ? 700 : 500,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span>{item.icon}</span>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.label}
                    </span>
                    {item.badge !== undefined && (
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '8px',
                          ...getBadgeStyle(item.badgeColor, isActive),
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Footer Info */}
      <div
        style={{
          marginTop: 'auto',
          flexShrink: 0,
          padding: isCollapsed ? '12px 6px' : '12px 16px',
          borderTop: '1px solid #F1F5F9',
          background: '#FAFAFC',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          fontSize: '11px',
          color: '#94A3B8',
        }}
      >
        {!isCollapsed ? (
          <div>
            <div style={{ fontWeight: 700, color: '#475569' }}>SIMOPMAS 110</div>
            <div style={{ fontSize: '10px' }}>Polres Pekalongan</div>
          </div>
        ) : null}
        <span
          title="Sistem Terhubung Presisi"
          style={{
            fontSize: '12px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          🛡️
        </span>
      </div>
    </aside>
  );
}
