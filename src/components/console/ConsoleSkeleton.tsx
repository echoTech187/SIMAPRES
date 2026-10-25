import React from 'react';

export function ConsoleSkeleton({ role = 'PAWAS' }: { role?: 'SUPERADMIN' | 'PAWAS' | 'OPERATOR' | 'PERSONIL' | string }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F8FAFC',
        padding: '16px',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .skeleton-shimmer {
          background: linear-gradient(90deg, #E2E8F0 25%, #F1F5F9 37%, #E2E8F0 63%);
          background-size: 200% 100%;
          animation: shimmer 1.5s ease-in-out infinite;
          border-radius: 8px;
        }
      `}</style>

      {/* Topbar Skeleton */}
      <div
        style={{
          background: 'white',
          padding: '14px 20px',
          borderRadius: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="skeleton-shimmer" style={{ width: '36px', height: '36px', borderRadius: '8px' }} />
          <div>
            <div className="skeleton-shimmer" style={{ width: '180px', height: '18px', marginBottom: '6px' }} />
            <div className="skeleton-shimmer" style={{ width: '120px', height: '12px' }} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="skeleton-shimmer" style={{ width: '140px', height: '36px', borderRadius: '8px' }} />
          <div className="skeleton-shimmer" style={{ width: '90px', height: '36px', borderRadius: '8px' }} />
        </div>
      </div>

      {role === 'SUPERADMIN' && (
        <div style={{ display: 'grid', gridTemplateColumns: '460px 1fr', gap: '20px' }}>
          {/* Sisi Kiri: Form Skeleton */}
          <div
            style={{
              background: 'white',
              padding: '24px',
              borderRadius: '14px',
              border: '1px solid #E2E8F0',
            }}
          >
            <div className="skeleton-shimmer" style={{ width: '200px', height: '22px', marginBottom: '12px' }} />
            <div className="skeleton-shimmer" style={{ width: '100%', height: '14px', marginBottom: '24px' }} />

            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} style={{ marginBottom: '16px' }}>
                <div className="skeleton-shimmer" style={{ width: '120px', height: '14px', marginBottom: '8px' }} />
                <div className="skeleton-shimmer" style={{ width: '100%', height: '42px', borderRadius: '8px' }} />
              </div>
            ))}
          </div>

          {/* Sisi Kanan: Table Skeleton */}
          <div
            style={{
              background: 'white',
              padding: '24px',
              borderRadius: '14px',
              border: '1px solid #E2E8F0',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div className="skeleton-shimmer" style={{ width: '220px', height: '22px' }} />
              <div className="skeleton-shimmer" style={{ width: '100px', height: '22px', borderRadius: '12px' }} />
            </div>

            <div className="skeleton-shimmer" style={{ width: '100%', height: '46px', marginBottom: '16px' }} />

            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 0',
                  borderBottom: '1px solid #F1F5F9',
                }}
              >
                <div className="skeleton-shimmer" style={{ width: '24px', height: '24px', borderRadius: '4px' }} />
                <div className="skeleton-shimmer" style={{ width: '160px', height: '20px' }} />
                <div className="skeleton-shimmer" style={{ width: '100px', height: '20px', borderRadius: '12px' }} />
                <div className="skeleton-shimmer" style={{ width: '140px', height: '20px' }} />
                <div className="skeleton-shimmer" style={{ flex: 1, height: '20px' }} />
                <div className="skeleton-shimmer" style={{ width: '80px', height: '24px', borderRadius: '12px' }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {role !== 'SUPERADMIN' && (
        <div>
          {/* Top Stat Cards Skeleton */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              marginBottom: '20px',
            }}
          >
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{
                  background: 'white',
                  padding: '18px',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                }}
              >
                <div className="skeleton-shimmer" style={{ width: '60px', height: '14px', marginBottom: '10px' }} />
                <div className="skeleton-shimmer" style={{ width: '90px', height: '28px', marginBottom: '8px' }} />
                <div className="skeleton-shimmer" style={{ width: '120px', height: '12px' }} />
              </div>
            ))}
          </div>

          {/* Main Map / Content Area Skeleton */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
            <div
              style={{
                background: 'white',
                padding: '20px',
                borderRadius: '14px',
                border: '1px solid #E2E8F0',
                minHeight: '450px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div className="skeleton-shimmer" style={{ width: '180px', height: '20px' }} />
                <div className="skeleton-shimmer" style={{ width: '120px', height: '20px', borderRadius: '8px' }} />
              </div>
              <div className="skeleton-shimmer" style={{ flex: 1, width: '100%', borderRadius: '10px' }} />
            </div>

            <div
              style={{
                background: 'white',
                padding: '20px',
                borderRadius: '14px',
                border: '1px solid #E2E8F0',
              }}
            >
              <div className="skeleton-shimmer" style={{ width: '160px', height: '20px', marginBottom: '16px' }} />
              {[1, 2, 3, 4].map((i) => (
                <div key={i} style={{ marginBottom: '14px' }}>
                  <div className="skeleton-shimmer" style={{ width: '100%', height: '70px', borderRadius: '10px' }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ConsoleSkeleton;
