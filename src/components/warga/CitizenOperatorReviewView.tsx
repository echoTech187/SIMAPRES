'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Headphones,
  Shield,
  Star,
  CheckCircle2,
  Clock,
  MessageSquare,
  ArrowLeft,
  Copy,
  Check,
  Sparkles,
  PhoneCall,
  FileText,
  ThumbsUp,
  HelpCircle,
  Award,
  AlertCircle,
  Radio,
} from 'lucide-react';
import { submitRatingAction } from '@/app/actions/complaint.actions';

export interface CitizenOperatorReviewViewProps {
  nomorTiket: string;
  token?: string;
  initialData?: any;
  onBack?: () => void;
  onSwitchToRadar?: () => void;
}

export const OPERATOR_RATING_CRITERIA = [
  {
    id: 'callResponseTime',
    number: '1',
    title: 'Kecepatan Angkat Telepon 110 (Response Time)',
    question: 'Seberapa cepat panggilan telepon 110 Anda diangkat dan direspons oleh operator sejak nada dering pertama?',
    tagLabel: 'Respon Cepat',
    icon: '⏱️',
  },
  {
    id: 'humanisEtika',
    number: '2',
    title: 'Keramahan & Etika Berbicara (Humanis & Empati)',
    question: 'Bagaimana keramahan, kesopanan, kesabaran, serta nada bicara operator saat mendengarkan dan melayani Anda?',
    tagLabel: 'Ramah & Sopan',
    icon: '🤝',
  },
  {
    id: 'kejelasanInformasi',
    number: '3',
    title: 'Kejelasan Informasi & Petunjuk Solusi (Transparansi SOP)',
    question: 'Seberapa jelas, rinci, dan mudah dipahami informasi prosedur, syarat kepolisian, atau arahan yang diberikan?',
    tagLabel: 'Informasi Jelas',
    icon: '📖',
  },
  {
    id: 'efisiensiSolusi',
    number: '4',
    title: 'Efisiensi & Ketepatan Penanganan (Solutif)',
    question: 'Apakah konsultasi atau pertanyaan Anda tertangani secara tuntas dan efisien tanpa bertele-tele?',
    tagLabel: 'Tuntas Solutif',
    icon: '⚡',
  },
  {
    id: 'overallKepuasan',
    number: '5',
    title: 'Kepuasan Layanan Operator 110 Secara Keseluruhan (Overall)',
    question: 'Secara menyeluruh, seberapa puas Anda terhadap mutu pelayanan operator SPKT 110 dalam panggilan ini?',
    tagLabel: 'Overall Prima',
    icon: '⭐',
  },
];

export const OPERATOR_SCORE_LABELS: Record<number, { label: string; desc: string; color: string }> = {
  1: { label: 'Sangat Kecewa', desc: 'Pelayanan kurang memuaskan dan perlu evaluasi SOP.', color: '#EF4444' },
  2: { label: 'Kurang Puas', desc: 'Penanganan lambat atau informasi belum cukup jelas.', color: '#F97316' },
  3: { label: 'Cukup Puas', desc: 'Pelayanan standar, panggilan terjawab dengan baik.', color: '#FBBF24' },
  4: { label: 'Puas & Baik', desc: 'Operator ramah, responsif, dan penjelasan mudah dipahami.', color: '#3B82F6' },
  5: { label: 'Sangat Puas (Prima)', desc: 'Pelayanan prima, cepat, humanis, dan solutif!', color: '#10B981' },
};

const SUGGESTED_TAGS = [
  '⚡ Angkat Sangat Cepat',
  '🤝 Ramah & Sabar',
  '📖 Informasi Jelas & Tepat',
  '💡 Solutif & Membantu',
  '🗣️ Artikulasi Jelas',
  '⏱️ Tidak Bertele-tele',
  '⭐ Pelayanan Presisi',
  '🛡️ Sigap Melayani',
];

export default function CitizenOperatorReviewView({
  nomorTiket,
  token,
  initialData,
  onBack,
  onSwitchToRadar,
}: CitizenOperatorReviewViewProps) {
  const cleanTiket = (nomorTiket || '').trim();
  const [loading, setLoading] = useState(!initialData);
  const [complaint, setComplaint] = useState<any | null>(initialData || null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Ratings State (per kriteria 1-5, default 5 bintang)
  const [fiveRatings, setFiveRatings] = useState<Record<string, number>>({
    callResponseTime: 5,
    humanisEtika: 5,
    kejelasanInformasi: 5,
    efisiensiSolusi: 5,
    overallKepuasan: 5,
  });
  const [hoverRatings, setHoverRatings] = useState<Record<string, number | undefined>>({});

  // Tags & Review Text
  const [selectedTags, setSelectedTags] = useState<string[]>(['⚡ Angkat Sangat Cepat', '📖 Informasi Jelas & Tepat']);
  const [reviewText, setReviewText] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingDone, setRatingDone] = useState(false);
  const [copiedTicket, setCopiedTicket] = useState(false);

  // Fetch data complaint jika belum ada initialData
  useEffect(() => {
    if (initialData) {
      setComplaint(initialData);
      setLoading(false);
      return;
    }
    if (!cleanTiket) return;

    let isMounted = true;
    setLoading(true);

    const tokenQuery = token ? `&token=${encodeURIComponent(token)}` : '';
    fetch(`/api/tracking?tiket=${encodeURIComponent(cleanTiket)}${tokenQuery}`)
      .then(async (res) => {
        if (!isMounted) return;
        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.error || 'Gagal memuat rincian laporan.');
        }
        return res.json();
      })
      .then((data) => {
        if (!isMounted) return;
        if (data?.complaint) {
          setComplaint(data.complaint);
          if (data.complaint.citizenRating) {
            setRatingDone(true);
          }
        }
      })
      .catch((err) => {
        if (isMounted) setErrorMsg(err.message || 'Kendala memuat data.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [cleanTiket, token, initialData]);

  // Cek apakah di localStorage sudah pernah memberikan rating untuk tiket ini
  useEffect(() => {
    if (typeof window !== 'undefined' && cleanTiket) {
      const stored = localStorage.getItem(`simopmas_rating_operator_${cleanTiket}`);
      if (stored === 'true') {
        setRatingDone(true);
      }
    }
  }, [cleanTiket]);

  const handleCopyTicket = () => {
    if (!cleanTiket) return;
    navigator.clipboard.writeText(cleanTiket);
    setCopiedTicket(true);
    setTimeout(() => setCopiedTicket(false), 2000);
  };

  const handleRatingChange = (critId: string, score: number) => {
    setFiveRatings((prev) => ({ ...prev, [critId]: score }));
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Skor Komposit Rata-Rata (1-5)
  const averageScore = useMemo(() => {
    const scores = Object.values(fiveRatings);
    if (!scores.length) return 5;
    const sum = scores.reduce((a, b) => a + b, 0);
    return Math.round((sum / scores.length) * 10) / 10;
  }, [fiveRatings]);

  const roundedStars = Math.max(1, Math.min(5, Math.round(averageScore)));
  const scoreInfo = OPERATOR_SCORE_LABELS[roundedStars] || OPERATOR_SCORE_LABELS[5];

  // Submit Penilaian Warga
  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRating) return;

    setSubmittingRating(true);
    try {
      const critTagsFormatted = OPERATOR_RATING_CRITERIA.map(
        (c) => `${c.tagLabel}: ${fiveRatings[c.id] || 5}★`
      ).join(', ');

      const allTagsCombined = [
        ...selectedTags,
        `[Skor Operator: ${averageScore}★]`,
        critTagsFormatted,
      ].filter(Boolean).join(' | ');

      const res = await submitRatingAction({
        nomorTiket: cleanTiket,
        rating: roundedStars,
        review: reviewText.trim() || undefined,
        tags: allTagsCombined,
      });

      if (res?.success) {
        setRatingDone(true);
        if (typeof window !== 'undefined' && cleanTiket) {
          localStorage.setItem(`simopmas_rating_operator_${cleanTiket}`, 'true');
        }
        setComplaint((prev: any) =>
          prev
            ? {
                ...prev,
                citizenRating: roundedStars,
                citizenReview: reviewText.trim(),
                citizenTags: allTagsCombined,
              }
            : prev
        );
      } else {
        alert(res?.error || 'Gagal mengirim evaluasi.');
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan saat mengirim evaluasi.');
    } finally {
      setSubmittingRating(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#090A0F',
        backgroundImage:
          'radial-gradient(ellipse at 50% -10%, rgba(236,196,115,0.18) 0%, transparent 60%)',
        color: '#F1F5F9',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        padding: '24px 16px 80px',
      }}
    >
      <div style={{ maxWidth: '820px', margin: '0 auto' }}>
        {/* TOP NAV BAR */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <button
            type="button"
            onClick={onBack || (() => window.history.back())}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#CBD5E1',
              padding: '7px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <ArrowLeft size={14} />
            <span>Kembali ke Pelacakan</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: '#ECC473',
                background: 'rgba(236,196,115,0.12)',
                padding: '4px 10px',
                borderRadius: '20px',
                border: '1px solid rgba(236,196,115,0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <Headphones size={12} color="#ECC473" />
              <span>SURVEI LAYANAN OPERATOR 110</span>
            </span>

            {onSwitchToRadar && (
              <button
                type="button"
                onClick={onSwitchToRadar}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: 'rgba(37,99,235,0.15)',
                  border: '1px solid rgba(59,130,246,0.3)',
                  color: '#93C5FD',
                  padding: '5px 12px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <Radio size={12} />
                <span>Peta Radar</span>
              </button>
            )}
          </div>
        </div>

        {/* LOADING & ERROR STATES */}
        {loading && (
          <div
            style={{
              padding: '60px 20px',
              textAlign: 'center',
              background: '#0D111A',
              borderRadius: '16px',
              border: '1px solid rgba(236,196,115,0.2)',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                margin: '0 auto 14px',
                border: '3px solid rgba(236,196,115,0.2)',
                borderTopColor: '#ECC473',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }}
            />
            <div style={{ color: '#ECC473', fontSize: '13.5px', fontWeight: 700 }}>
              Menghubungkan ke Sistem Survei Presisi 110...
            </div>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {errorMsg && !loading && (
          <div
            style={{
              padding: '16px 20px',
              background: 'rgba(239,68,68,0.12)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '12px',
              color: '#FCA5A5',
              fontSize: '13px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <AlertCircle size={18} color="#EF4444" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* MAIN CARD CONTENT */}
        {!loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* HERO CARD: INFORMASI LAYANAN OPERATOR 110 */}
            <div
              style={{
                background: 'linear-gradient(135deg, #0F172A 0%, #172554 50%, #0B1329 100%)',
                borderRadius: '16px',
                border: '1px solid rgba(236,196,115,0.25)',
                padding: '24px 26px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '-15px',
                  right: '-15px',
                  width: '120px',
                  height: '120px',
                  background: 'radial-gradient(circle, rgba(236,196,115,0.15) 0%, transparent 70%)',
                  pointerEvents: 'none',
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span
                      style={{
                        background: '#2563EB',
                        padding: '6px',
                        borderRadius: '8px',
                        display: 'inline-flex',
                        color: 'white',
                      }}
                    >
                      <Headphones size={18} />
                    </span>
                    <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.3px' }}>
                      Evaluasi Layanan Operator SPKT 110
                    </h1>
                  </div>
                  <p style={{ margin: 0, color: '#94A3B8', fontSize: '12.5px', lineHeight: 1.5, maxWidth: '580px' }}>
                    Layanan pengaduan dan konsultasi masyarakat melalui Call Center 110 Polres Pekalongan. Kasus diselesaikan secara tuntas langsung oleh operator tanpa disposisi personil lapangan.
                  </p>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>Nomor Tiket Layanan</div>
                  <div
                    onClick={handleCopyTicket}
                    title="Klik untuk menyalin nomor tiket"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'rgba(236,196,115,0.15)',
                      border: '1px solid rgba(236,196,115,0.35)',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      color: '#ECC473',
                      fontFamily: 'monospace',
                      fontWeight: 800,
                      fontSize: '13px',
                      cursor: 'pointer',
                      marginTop: '4px',
                    }}
                  >
                    <span>{cleanTiket || 'TKT-110-POLRES'}</span>
                    {copiedTicket ? <Check size={13} color="#4ADE80" /> : <Copy size={13} />}
                  </div>
                </div>
              </div>

              {/* DETAIL RINGKASAN LAYANAN */}
              <div
                style={{
                  marginTop: '18px',
                  paddingTop: '16px',
                  borderTop: '1px solid rgba(255,255,255,0.1)',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>Jenis Layanan</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#F8FAFC', marginTop: '2px' }}>
                    {complaint?.jenisKejadian || 'Konsultasi & Layanan Informasi 110'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>Saluran Penanganan</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#38BDF8', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <PhoneCall size={12} />
                    <span>Call Center 110 (Telepon Langsung)</span>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>Status Penyelesaian</div>
                  <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#4ADE80', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={13} />
                    <span>Tuntas di Meja Operator</span>
                  </div>
                </div>
              </div>

              {/* URAIAN / CATATAN KONSULTASI */}
              {complaint?.deskripsiKejadian && (
                <div
                  style={{
                    marginTop: '14px',
                    background: 'rgba(15,23,42,0.6)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    fontSize: '12px',
                    color: '#CBD5E1',
                    lineHeight: 1.5,
                  }}
                >
                  <strong style={{ color: '#E2E8F0' }}>Ringkasan Panggilan: </strong>
                  {complaint.deskripsiKejadian}
                </div>
              )}
            </div>

            {/* IF ALREADY RATED: THANK YOU CARD */}
            {ratingDone ? (
              <div
                style={{
                  background: 'linear-gradient(135deg, #0D1322 0%, #0A0F1D 100%)',
                  borderRadius: '16px',
                  border: '1.5px solid rgba(236,196,115,0.4)',
                  padding: '32px 24px',
                  textAlign: 'center',
                  boxShadow: '0 12px 36px rgba(0,0,0,0.4)',
                }}
              >
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    margin: '0 auto 16px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(236,196,115,0.25) 0%, rgba(236,196,115,0.05) 70%)',
                    border: '2px solid rgba(236,196,115,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '28px',
                    boxShadow: '0 0 20px rgba(236,196,115,0.3)',
                  }}
                >
                  ⭐
                </div>

                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '3px 10px',
                    borderRadius: '12px',
                    background: 'rgba(16,185,129,0.12)',
                    border: '1px solid rgba(16,185,129,0.3)',
                    color: '#34D399',
                    fontSize: '11px',
                    fontWeight: 800,
                    marginBottom: '10px',
                  }}
                >
                  <CheckCircle2 size={12} />
                  <span>SURVEI IKM 110 BERHASIL TERCATAT</span>
                </div>

                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: '#ECC473' }}>
                  Terima Kasih Atas Penilaian Anda!
                </h2>

                <p style={{ maxWidth: '520px', margin: '10px auto 20px', fontSize: '13px', color: '#94A3B8', lineHeight: 1.6 }}>
                  Ulasan dan penilaian Anda terhadap layanan Operator 110 telah disimpan ke basis data resmi kepolisian. Penilaian masyarakat merupakan tolok ukur pembinaan personel dan peningkatan mutu pelayanan Polri Presisi.
                </p>

                {/* SKOR YANG DIBERIKAN */}
                <div
                  style={{
                    maxWidth: '400px',
                    margin: '0 auto 20px',
                    padding: '14px 18px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-around',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>Peringkat Bintang</div>
                    <div style={{ fontSize: '18px', fontWeight: 900, color: '#ECC473', marginTop: '2px' }}>
                      {'★'.repeat(complaint?.citizenRating || roundedStars)}
                    </div>
                  </div>

                  <div style={{ width: '1px', height: '30px', background: 'rgba(255,255,255,0.1)' }} />

                  <div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>Predikat Layanan</div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#34D399', marginTop: '2px' }}>
                      {scoreInfo.label}
                    </div>
                  </div>
                </div>

                {complaint?.citizenReview && (
                  <div
                    style={{
                      maxWidth: '520px',
                      margin: '0 auto 24px',
                      padding: '12px 16px',
                      background: 'rgba(236,196,115,0.05)',
                      border: '1px dashed rgba(236,196,115,0.3)',
                      borderRadius: '8px',
                      fontSize: '12.5px',
                      color: '#E2E8F0',
                      fontStyle: 'italic',
                    }}
                  >
                    &ldquo;{complaint.citizenReview}&rdquo;
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <Link
                    href="/warga"
                    style={{
                      padding: '9px 20px',
                      borderRadius: '8px',
                      background: '#1E293B',
                      border: '1px solid #334155',
                      color: '#F1F5F9',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      textDecoration: 'none',
                    }}
                  >
                    Kembali ke Beranda Portal Warga
                  </Link>

                  <button
                    type="button"
                    onClick={() => setRatingDone(false)}
                    style={{
                      padding: '9px 16px',
                      borderRadius: '8px',
                      background: 'transparent',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: '#94A3B8',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    Perbarui Penilaian Saya
                  </button>
                </div>
              </div>
            ) : (
              /* FORMULIR RATING SURVEI IKM OPERATOR 110 */
              <form
                onSubmit={handleSubmitRating}
                style={{
                  background: 'linear-gradient(135deg, #0C101A 0%, #111726 100%)',
                  borderRadius: '16px',
                  border: '1px solid rgba(236,196,115,0.25)',
                  padding: '24px',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
                }}
              >
                {/* HEADER FORM */}
                <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'rgba(236,196,115,0.1)',
                      border: '1px solid rgba(236,196,115,0.25)',
                      padding: '3px 12px',
                      borderRadius: '20px',
                      color: '#ECC473',
                      fontSize: '11px',
                      fontWeight: 800,
                      letterSpacing: '0.4px',
                      marginBottom: '8px',
                    }}
                  >
                    <Award size={13} color="#ECC473" />
                    <span>SURVEI KEPUASAN MASYARAKAT (IKM)</span>
                  </div>

                  <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: '#FFFFFF' }}>
                    Penilaian Kualitas Pelayanan Operator 110
                  </h2>

                  <p style={{ margin: '6px auto 0', color: '#94A3B8', fontSize: '12px', maxWidth: '520px', lineHeight: 1.5 }}>
                    Beri rating bintang (1-5) pada 5 indikator pelayanan di bawah ini untuk menilai mutu komunikasi dan bantuan operator:
                  </p>
                </div>

                {/* 5 KRITERIA RATING OPERATOR */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
                  {OPERATOR_RATING_CRITERIA.map((crit) => {
                    const currentScore = hoverRatings[crit.id] ?? fiveRatings[crit.id] ?? 5;
                    const descObj = OPERATOR_SCORE_LABELS[currentScore] || OPERATOR_SCORE_LABELS[5];

                    return (
                      <div
                        key={crit.id}
                        style={{
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          borderRadius: '12px',
                          padding: '14px 18px',
                          transition: 'border-color 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', flexWrap: 'wrap' }}>
                          <div style={{ flex: 1, minWidth: '240px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                              <span style={{ fontSize: '14px' }}>{crit.icon}</span>
                              <span style={{ fontSize: '10px', fontWeight: 900, color: '#ECC473', background: 'rgba(236,196,115,0.12)', padding: '1px 6px', borderRadius: '4px' }}>
                                INDIKATOR {crit.number}
                              </span>
                              <h3 style={{ margin: 0, fontSize: '13.5px', fontWeight: 800, color: '#F1F5F9' }}>
                                {crit.title}
                              </h3>
                            </div>
                            <p style={{ margin: 0, fontSize: '12px', color: '#94A3B8', lineHeight: 1.45 }}>
                              {crit.question}
                            </p>
                          </div>

                          {/* BINTANG & LABEL STATUS */}
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                              {[1, 2, 3, 4, 5].map((star) => {
                                const isFilled = currentScore >= star;
                                return (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() => handleRatingChange(crit.id, star)}
                                    onMouseEnter={() => setHoverRatings((prev) => ({ ...prev, [crit.id]: star }))}
                                    onMouseLeave={() => setHoverRatings((prev) => ({ ...prev, [crit.id]: undefined }))}
                                    style={{
                                      background: 'transparent',
                                      border: 'none',
                                      cursor: 'pointer',
                                      fontSize: '26px',
                                      padding: '2px',
                                      color: isFilled ? '#ECC473' : '#334155',
                                      textShadow: isFilled ? '0 0 10px rgba(236,196,115,0.5)' : 'none',
                                      transition: 'transform 0.1s ease',
                                    }}
                                    title={`${star} Bintang - ${OPERATOR_SCORE_LABELS[star]?.label}`}
                                  >
                                    ★
                                  </button>
                                );
                              })}
                            </div>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: descObj.color, marginTop: '2px' }}>
                              {descObj.label} ({currentScore}/5)
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* SKOR KOMPOSIT OVERALL BANNER */}
                <div
                  style={{
                    background: 'rgba(236,196,115,0.08)',
                    border: '1px solid rgba(236,196,115,0.25)',
                    borderRadius: '12px',
                    padding: '14px 18px',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ fontSize: '24px' }}>📊</div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#CBD5E1', fontWeight: 600 }}>
                        Skor Kepuasan Rata-Rata Warga
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: '#ECC473' }}>
                        {averageScore} dari 5.0 Bintang • <span style={{ color: scoreInfo.color }}>{scoreInfo.label}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: '11.5px', color: '#94A3B8', maxWidth: '300px', lineHeight: 1.4 }}>
                    {scoreInfo.desc}
                  </div>
                </div>

                {/* QUICK TAGS / KATA KUNCI APRESIASI */}
                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#CBD5E1', marginBottom: '8px' }}>
                    Apresiasi &amp; Sorotan Layanan (Pilih yang sesuai):
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {SUGGESTED_TAGS.map((tag) => {
                      const isSel = selectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTag(tag)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '20px',
                            fontSize: '11.5px',
                            fontWeight: isSel ? 800 : 600,
                            border: isSel ? '1px solid #ECC473' : '1px solid rgba(255,255,255,0.1)',
                            background: isSel ? 'rgba(236,196,115,0.18)' : 'rgba(255,255,255,0.03)',
                            color: isSel ? '#ECC473' : '#94A3B8',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {tag} {isSel && '✓'}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* CATATAN ULASAN TERTULIS */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#CBD5E1' }}>
                      Catatan atau Pesan Tambahan Untuk Operator (Opsional)
                    </label>
                    <span style={{ fontSize: '10.5px', color: '#64748B' }}>Maks 500 karakter</span>
                  </div>
                  <textarea
                    rows={3}
                    maxLength={500}
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Tuliskan apresiasi, saran keramahan, atau masukan kejelasan informasi operator..."
                    style={{
                      width: '100%',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      color: '#F8FAFC',
                      fontSize: '12.5px',
                      lineHeight: 1.5,
                      outline: 'none',
                      resize: 'vertical',
                    }}
                  />
                </div>

                {/* TOMBOL SUBMIT */}
                <button
                  type="submit"
                  disabled={submittingRating}
                  style={{
                    width: '100%',
                    padding: '13px 20px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #D97706 0%, #B45309 50%, #92400E 100%)',
                    color: '#FFFFFF',
                    fontSize: '14px',
                    fontWeight: 900,
                    letterSpacing: '0.4px',
                    cursor: submittingRating ? 'wait' : 'pointer',
                    boxShadow: '0 4px 16px rgba(217,119,6,0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Sparkles size={16} />
                  <span>
                    {submittingRating
                      ? 'Menyimpan Penilaian...'
                      : `Kirim Evaluasi Operator (${averageScore}★)`}
                  </span>
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
