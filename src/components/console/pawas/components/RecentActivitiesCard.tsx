'use client';

import React from 'react';
import { Activity } from 'lucide-react';

export interface ActivityItem {
  time: string;
  text: string;
  color: string;
}

export interface RecentActivitiesCardProps {
  isReady: boolean;
  activities: ActivityItem[];
}

export default function RecentActivitiesCard({
  isReady,
  activities,
}: RecentActivitiesCardProps) {
  if (!isReady) {
    return (
      <div
        className="cyber-skeleton"
        style={{
          height: '160px',
          borderRadius: '16px',
        }}
      />
    );
  }

  return (
    <div className="card-panel futuristic-card" style={{ padding: '18px', borderRadius: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div>
          <div
            className="card-title"
            style={{
              marginBottom: '2px',
              fontSize: '13px',
              fontWeight: 900,
              color: '#0F172A',
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
            }}
          >
            <Activity size={16} color="#0284C7" />
            <span>AKTIVITAS PERSONEL TERBARU</span>
          </div>
          <div style={{ fontSize: '10.5px', color: '#64748B' }}>
            Log pergerakan regu patroli di lapangan
          </div>
        </div>
        <span
          style={{
            background: '#F0F9FF',
            color: '#0284C7',
            fontWeight: 800,
            fontSize: '9.5px',
            padding: '3px 8px',
            borderRadius: '4px',
            border: '1px solid #BAE6FD',
          }}
        >
          REAL-TIME
        </span>
      </div>

      {activities.length > 0 ? (
        <div className="timeline" style={{ display: 'flex', flexDirection: 'column', gap: '9px', marginTop: '10px' }}>
          {activities.map((act, i) => (
            <div
              key={i}
              style={{
                fontSize: '11.5px',
                color: '#334155',
                borderLeft: `3px solid ${act.color}`,
                paddingLeft: '9px',
                lineHeight: 1.4,
              }}
            >
              <strong>{act.time}</strong> - {act.text}
            </div>
          ))}
        </div>
      ) : (
        <div
          style={{
            padding: '14px',
            background: '#F8FAFC',
            border: '1px dashed #CBD5E1',
            borderRadius: '10px',
            textAlign: 'center',
            color: '#64748B',
            fontSize: '11px',
            marginTop: '10px',
          }}
        >
          Belum ada log pergerakan regu patroli tercatat hari ini
        </div>
      )}
    </div>
  );
}
