import { useEffect, useState } from 'react';
import { quizService, type QuizQuestion, type QuizResult } from '../../services/quizService';

interface Props {
  courseId: string;
  onClose: () => void;
  onPassed: () => void;
}

type Phase = 'loading' | 'quiz' | 'result' | 'error';

export function QuizModal({ courseId, onClose, onPassed }: Props) {
  const [phase, setPhase] = useState<Phase>('loading');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    quizService
      .getQuestions(courseId)
      .then((qs) => {
        setQuestions(qs);
        setAnswers(new Array(qs.length).fill(null));
        setPhase('quiz');
      })
      .catch(() => setPhase('error'));
  }, [courseId]);

  const handleSubmit = async () => {
    if (answers.some((a) => a === null)) return;
    setSubmitting(true);
    try {
      const res = await quizService.submitAttempt(courseId, answers as number[]);
      setResult(res);
      setPhase('result');
      if (res.passed) onPassed();
    } catch {
      setPhase('error');
    } finally {
      setSubmitting(false);
    }
  };

  const allAnswered = answers.length > 0 && answers.every((a) => a !== null);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: 20,
          width: '100%',
          maxWidth: 560,
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
            📝 แบบทดสอบ
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 20,
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: '0 4px',
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: 24 }}>
          {/* Loading */}
          {phase === 'loading' && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
              <div className="spinner spinner-lg" />
            </div>
          )}

          {/* Error */}
          {phase === 'error' && (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>❌</div>
              <p style={{ color: '#DC2626', fontWeight: 600 }}>เกิดข้อผิดพลาด กรุณาลองใหม่</p>
              <button onClick={onClose} className="btn-secondary" style={{ marginTop: 16 }}>
                ปิด
              </button>
            </div>
          )}

          {/* Quiz */}
          {phase === 'quiz' && questions.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
              <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
                คอร์สนี้ไม่มีแบบทดสอบ
              </p>
              <button onClick={onClose} className="btn-primary" style={{ marginTop: 8 }}>
                ปิด
              </button>
            </div>
          )}

          {phase === 'quiz' && questions.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {questions.map((q, qi) => (
                <div key={q.id}>
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      marginBottom: 12,
                    }}
                  >
                    {qi + 1}. {q.text}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {q.options.map((opt, oi) => (
                      <label
                        key={oi}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '10px 14px',
                          borderRadius: 10,
                          cursor: 'pointer',
                          border: `1px solid ${answers[qi] === oi ? 'var(--primary)' : 'var(--border)'}`,
                          background: answers[qi] === oi ? 'var(--primary-light)' : 'var(--bg)',
                          transition: 'all 0.15s',
                        }}
                      >
                        <input
                          type="radio"
                          name={`q-${qi}`}
                          checked={answers[qi] === oi}
                          onChange={() =>
                            setAnswers((prev) => {
                              const a = [...prev];
                              a[qi] = oi;
                              return a;
                            })
                          }
                          style={{ accentColor: 'var(--primary)' }}
                        />
                        <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              <button
                onClick={handleSubmit}
                disabled={!allAnswered || submitting}
                className="btn-primary"
                style={{ marginTop: 8 }}
              >
                {submitting ? (
                  <>
                    <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />{' '}
                    กำลังส่ง...
                  </>
                ) : (
                  'ส่งคำตอบ'
                )}
              </button>
            </div>
          )}

          {/* Result */}
          {phase === 'result' && result && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>{result.passed ? '🎉' : '😔'}</div>
              <h4
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: result.passed ? '#16A34A' : '#DC2626',
                  marginBottom: 8,
                }}
              >
                {result.passed ? 'ผ่านแล้ว!' : 'ยังไม่ผ่าน'}
              </h4>
              <p style={{ fontSize: 15, color: 'var(--text-muted)', marginBottom: 20 }}>
                คะแนน {result.score}% ({result.correctCount}/{result.total} ข้อ) — เกณฑ์ผ่าน 60%
              </p>
              {result.passed ? (
                <p style={{ fontSize: 13, color: '#16A34A', fontWeight: 600, marginBottom: 20 }}>
                  ✅ คุณสามารถดาวน์โหลดใบประกาศได้แล้ว!
                </p>
              ) : (
                <p style={{ fontSize: 13, color: '#F59E0B', fontWeight: 600, marginBottom: 20 }}>
                  💡 ลองทำใหม่อีกครั้งได้เลย
                </p>
              )}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                {!result.passed && (
                  <button
                    onClick={() => {
                      setPhase('quiz');
                      setAnswers(new Array(questions.length).fill(null));
                      setResult(null);
                    }}
                    className="btn-secondary"
                  >
                    ทำใหม่
                  </button>
                )}
                <button onClick={onClose} className="btn-primary">
                  ปิด
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
