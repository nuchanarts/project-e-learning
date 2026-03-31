import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../lib/api';

interface VerifyResult {
  valid: boolean;
  certificate?: {
    id: string;
    verifyToken: string;
    issuedAt: string;
    tier: string | null;
    quizScore: number | null;
    user: { name: string; hospital: string; position: string };
    course: { id: string; title: string; category: string };
  };
}

const TIER_LABEL: Record<string, string> = {
  BRONZE: '🥉 Bronze',
  SILVER: '🥈 Silver',
  GOLD: '🥇 Gold',
  PLATINUM: '💎 Platinum',
};

export default function VerifyPage() {
  const { token } = useParams<{ token: string }>();
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<VerifyResult>(`/certificates/verify/${token}`)
      .then((r) => setResult(r.data))
      .catch(() => setResult({ valid: false }))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: '#F5F3FF',
        }}
      >
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg,#F5F3FF,#EDE9FE)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div style={{ maxWidth: 500, width: '100%' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🏥</div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#4C1D95' }}>รพ.สต. Learning Hub</h1>
          <p style={{ fontSize: 13, color: '#6B7280' }}>ระบบตรวจสอบใบประกาศนียบัตร</p>
        </div>

        {result?.valid ? (
          <div
            style={{
              background: '#fff',
              borderRadius: 20,
              padding: 32,
              boxShadow: '0 20px 60px rgba(123,104,238,0.15)',
              border: '2px solid #7B68EE',
            }}
          >
            {/* Valid badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 24,
                padding: '12px 16px',
                background: '#F0FDF4',
                borderRadius: 12,
                border: '1px solid #86EFAC',
              }}
            >
              <span style={{ fontSize: 28 }}>✅</span>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#16A34A' }}>
                  ใบประกาศนี้ถูกต้องและออกโดยระบบ
                </div>
                <div style={{ fontSize: 12, color: '#6B7280' }}>
                  Certificate ID: {result.certificate?.id.slice(0, 8).toUpperCase()}
                </div>
              </div>
            </div>

            {/* Course */}
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#7B68EE',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: 4,
                }}
              >
                หลักสูตร
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#1F2937' }}>
                {result.certificate?.course.title}
              </div>
              {result.certificate?.course.category && (
                <span
                  style={{
                    fontSize: 11,
                    background: '#EDE9FE',
                    color: '#7B68EE',
                    padding: '2px 8px',
                    borderRadius: 10,
                    fontWeight: 600,
                  }}
                >
                  {result.certificate.course.category}
                </span>
              )}
            </div>

            {/* User */}
            <div
              style={{
                marginBottom: 16,
                padding: '12px 16px',
                background: '#F9FAFB',
                borderRadius: 12,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', marginBottom: 6 }}>
                ผู้เรียน
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#1F2937', marginBottom: 4 }}>
                {result.certificate?.user.name}
              </div>
              {result.certificate?.user.hospital && (
                <div style={{ fontSize: 13, color: '#6B7280' }}>
                  🏥 {result.certificate.user.hospital}
                </div>
              )}
              {result.certificate?.user.position && (
                <div style={{ fontSize: 13, color: '#6B7280' }}>
                  💼 {result.certificate.user.position}
                </div>
              )}
            </div>

            {/* Meta */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div
                style={{
                  flex: 1,
                  minWidth: 120,
                  padding: '10px 14px',
                  background: '#F9FAFB',
                  borderRadius: 10,
                }}
              >
                <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 2 }}>📅 ออกเมื่อ</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1F2937' }}>
                  {new Date(result.certificate!.issuedAt).toLocaleDateString('th-TH', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </div>
              {result.certificate?.quizScore != null && (
                <div
                  style={{
                    flex: 1,
                    minWidth: 100,
                    padding: '10px 14px',
                    background: '#F9FAFB',
                    borderRadius: 10,
                  }}
                >
                  <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 2 }}>
                    📝 คะแนน Quiz
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1F2937' }}>
                    {result.certificate.quizScore}%
                  </div>
                </div>
              )}
              {result.certificate?.tier && (
                <div
                  style={{
                    flex: 1,
                    minWidth: 100,
                    padding: '10px 14px',
                    background: '#F9FAFB',
                    borderRadius: 10,
                  }}
                >
                  <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 2 }}>ระดับ</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#7B68EE' }}>
                    {TIER_LABEL[result.certificate.tier]}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div
            style={{
              background: '#fff',
              borderRadius: 20,
              padding: 32,
              boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 12 }}>❌</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#DC2626', marginBottom: 8 }}>
              ไม่พบใบประกาศ
            </div>
            <div style={{ fontSize: 13, color: '#6B7280' }}>
              Token นี้ไม่ถูกต้องหรือใบประกาศถูกลบออกจากระบบ
            </div>
          </div>
        )}

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: '#9CA3AF' }}>
          ตรวจสอบโดย รพ.สต. Learning Hub — verify.rpst-learning.go.th
        </p>
      </div>
    </div>
  );
}
