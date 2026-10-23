import React, { useState, useEffect, useRef } from 'react';
import { Upload, ScanEye, Search, Cpu, CheckCircle2, CheckCheck } from 'lucide-react';

interface Props {
  onComplete: () => void;
  targetSubject?: string;
  targetClass?: string;
  facesCount?: number | null;
  matchedCount?: number | null;
  isLoading?: boolean;
}

const STAGES = [
  { id: 1, title: 'Uploading classroom image...',        doneText: 'Image received',             icon: Upload,    pct: 20  },
  { id: 2, title: 'Detecting faces in the frame...',    doneText: '',                            icon: ScanEye,   pct: 45  },
  { id: 3, title: 'Analysing facial features...',       doneText: '',                            icon: Search,    pct: 70  },
  { id: 4, title: 'Matching against student database...', doneText: 'Students identified',       icon: Cpu,       pct: 90  },
  { id: 5, title: 'Finalising attendance record...',    doneText: 'Ready for review',            icon: CheckCheck,pct: 100 },
];

export const AIProcessingAnimation: React.FC<Props> = ({
  onComplete, targetSubject = 'Subject', targetClass = 'Class',
  facesCount = null, matchedCount = null, isLoading = false,
}) => {
  const [idx, setIdx]   = useState(0);
  const [pct, setPct]   = useState(8);
  const [done, setDone] = useState(false);
  const ref = useRef(onComplete);
  ref.current = onComplete;

  useEffect(() => {
    let i = 0;
    const tick = setInterval(() => {
      if (isLoading && i >= 2) { setIdx(2); setPct(72); return; }
      if (i < STAGES.length - 1) { i++; setIdx(i); setPct(STAGES[i].pct); }
      else if (!done) { setDone(true); setTimeout(() => ref.current(), 600); }
    }, 700);
    return () => clearInterval(tick);
  }, [isLoading, done]);

  const doneText = (id: number, isDone: boolean) => {
    if (!isDone) return '';
    if (id === 2) return facesCount !== null ? `${facesCount} face${facesCount !== 1 ? 's' : ''} detected` : 'Faces detected';
    if (id === 3) return matchedCount !== null ? `${matchedCount} matched` : 'Students matched';
    return STAGES.find(s => s.id === id)?.doneText || '';
  };

  return (
    <div className="nv-card" style={{ padding: '28px 32px', maxWidth: 560, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--tx-primary)', marginBottom: 4 }}>AI Attendance Processing</div>
        <div style={{ fontSize: 12, color: 'var(--tx-muted)' }}>{targetSubject} · {targetClass}</div>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600, color: 'var(--tx-muted)', marginBottom: 6 }}>
          <span>Processing Pipeline</span><span>{pct}%</span>
        </div>
        <div style={{ height: 6, background: 'var(--bg-raised)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent)', borderRadius: 99, transition: 'width 0.5s ease-out' }} />
        </div>
      </div>

      {/* Stages */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {STAGES.map((stage, i) => {
          const isDone    = i < idx;
          const isCurrent = i === idx;
          return (
            <div key={stage.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 14px', borderRadius: 8, border: '1px solid',
              borderColor: isCurrent ? 'var(--accent-border)' : isDone ? 'var(--border)' : 'transparent',
              background: isCurrent ? 'var(--accent-bg)' : isDone ? 'var(--bg-raised)' : 'transparent',
              transition: 'all 0.2s',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {isDone
                  ? <CheckCircle2 size={15} style={{ color: 'var(--success)', flexShrink: 0 }} />
                  : isCurrent
                  ? <div style={{ width: 15, height: 15, borderRadius: '50%', border: '2px solid var(--accent)', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
                  : <div style={{ width: 15, height: 15, borderRadius: '50%', border: '1px solid var(--border)', flexShrink: 0 }} />}
                <span style={{ fontSize: 12.5, color: isCurrent ? 'var(--accent-text)' : isDone ? 'var(--tx-secondary)' : 'var(--tx-muted)', fontWeight: isCurrent ? 600 : 400 }}>
                  {stage.title}
                </span>
              </div>
              {isDone && doneText(stage.id, isDone) && (
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--success)', flexShrink: 0, marginLeft: 8 }}>
                  ✓ {doneText(stage.id, isDone)}
                </span>
              )}
              {isCurrent && isLoading && i === 2 && (
                <span style={{ fontSize: 11, color: 'var(--tx-muted)', animation: 'nv-pulse 1.5s ease-in-out infinite' }}>Waiting for response...</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Live result */}
      {!isLoading && facesCount !== null && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 20 }}>
          {[
            { label: 'Faces Detected',  value: facesCount,   color: 'var(--accent)' },
            { label: 'Students Matched',value: matchedCount ?? 0, color: 'var(--success)' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ padding: '12px 14px', borderRadius: 8, background: 'var(--bg-raised)', border: '1px solid var(--border)', textAlign: 'center' }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--tx-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 26, fontWeight: 700, color, fontFamily: 'monospace', lineHeight: 1 }}>{value}</div>
            </div>
          ))}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};
