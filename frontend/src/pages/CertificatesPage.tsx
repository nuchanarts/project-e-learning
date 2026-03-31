import { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { certificateService, type Certificate } from '../services/certificateService';
import { useLanguage } from '../contexts/LanguageContext';

const TIER_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  BRONZE: { label: 'Bronze', icon: '🥉', color: '#CD7F32' },
  SILVER: { label: 'Silver', icon: '🥈', color: '#A8A9AD' },
  GOLD: { label: 'Gold', icon: '🥇', color: '#FFD700' },
  PLATINUM: { label: 'Platinum', icon: '💎', color: '#8B5CF6' },
};

function QRDisplay({ url }: { url: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, url, {
        width: 80,
        margin: 1,
        color: { dark: '#4C1D95', light: '#fff' },
      });
    }
  }, [url]);
  return <canvas ref={canvasRef} style={{ borderRadius: 6 }} />;
}

export default function CertificatesPage() {
  const { t } = useLanguage();
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedQR, setExpandedQR] = useState<string | null>(null);

  useEffect(() => {
    certificateService
      .list()
      .then(setCerts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div
        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}
      >
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  return (
    <div className="anim-up">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>
          {t.certs_title}
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{t.certs_subtitle}</p>
      </div>

      {certs.length === 0 ? (
        <div className="card" style={{ padding: 40 }}>
          <div className="empty-state">
            <div className="empty-state-icon">🎓</div>
            <div className="empty-state-title">{t.certs_empty_title}</div>
            <div className="empty-state-sub">{t.certs_empty_sub}</div>
            <a
              href="/courses"
              className="btn-primary"
              style={{ display: 'inline-flex', marginTop: 20 }}
            >
              {t.certs_go_courses}
            </a>
          </div>
        </div>
      ) : (
        <>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              marginBottom: 24,
              flexWrap: 'wrap',
            }}
          >
            <div
              className="card"
              style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10 }}
            >
              <span style={{ fontSize: 22 }}>🏆</span>
              <div>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    lineHeight: 1,
                  }}
                >
                  {certs.length}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.certs_total}</div>
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 18,
            }}
          >
            {certs.map((cert) => {
              const tier = cert.tier ? TIER_CONFIG[cert.tier] : null;
              const verifyUrl = cert.verifyToken
                ? certificateService.verifyUrl(cert.verifyToken)
                : null;
              return (
                <div key={cert.id} className="cert-card">
                  <div className="cert-top">
                    <span
                      style={{
                        position: 'relative',
                        zIndex: 1,
                        filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))',
                      }}
                    >
                      🏆
                    </span>
                    {tier && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 10,
                          right: 12,
                          background: 'rgba(255,255,255,0.25)',
                          borderRadius: 20,
                          padding: '3px 10px',
                          fontSize: 12,
                          fontWeight: 700,
                          color: '#fff',
                        }}
                      >
                        {tier.icon} {tier.label}
                      </div>
                    )}
                  </div>

                  <div className="cert-body">
                    <div style={{ marginBottom: 4 }}>
                      <span className="badge badge-green">{t.certs_badge}</span>
                    </div>
                    <h3
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        margin: '8px 0 6px',
                        lineHeight: 1.4,
                      }}
                    >
                      {cert.course?.title ?? 'คอร์ส'}
                    </h3>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                      📅 {t.certs_issued}{' '}
                      {new Date(cert.issuedAt).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>

                    {cert.quizScore != null && (
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                        📝 คะแนน Quiz: <strong>{cert.quizScore}%</strong>
                      </p>
                    )}

                    {/* QR Code section */}
                    {verifyUrl && (
                      <div style={{ marginBottom: 12 }}>
                        <button
                          onClick={() => setExpandedQR(expandedQR === cert.id ? null : cert.id)}
                          style={{
                            width: '100%',
                            padding: '8px',
                            borderRadius: 8,
                            border: '1px solid var(--border)',
                            background: 'var(--bg)',
                            cursor: 'pointer',
                            fontSize: 12,
                            fontWeight: 600,
                            color: 'var(--primary)',
                            fontFamily: 'inherit',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                          }}
                        >
                          <span>🔍</span>
                          <span>{expandedQR === cert.id ? 'ซ่อน QR Code' : 'แสดง QR ยืนยัน'}</span>
                        </button>

                        {expandedQR === cert.id && (
                          <div
                            style={{
                              marginTop: 10,
                              padding: 12,
                              background: '#F5F3FF',
                              borderRadius: 10,
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: 8,
                            }}
                          >
                            <QRDisplay url={verifyUrl} />
                            <div
                              style={{
                                fontSize: 10,
                                color: 'var(--text-muted)',
                                textAlign: 'center',
                                wordBreak: 'break-all',
                              }}
                            >
                              สแกน QR เพื่อยืนยันใบประกาศ
                            </div>
                            <button
                              onClick={() => navigator.clipboard?.writeText(verifyUrl)}
                              style={{
                                fontSize: 11,
                                color: 'var(--primary)',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                              }}
                            >
                              📋 คัดลอก Link ยืนยัน
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    <a
                      href={certificateService.downloadUrl(cert.courseId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary"
                      style={{
                        width: '100%',
                        textAlign: 'center',
                        justifyContent: 'center',
                        color: '#16A34A',
                        borderColor: '#86EFAC',
                        background: '#F0FDF4',
                      }}
                    >
                      {t.certs_download}
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
