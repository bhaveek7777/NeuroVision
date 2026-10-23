import React from 'react';

export type BadgeVariant =
  | 'present' | 'absent' | 'needs_review' | 'ai_detected' | 'teacher_verified'
  | 'manually_modified' | 'locked' | 'pending' | 'approved' | 'rejected'
  | 'high_conf' | 'med_conf' | 'active' | 'inactive' | 'default';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'default', children, className = '', size = 'md', icon }) => {
  type StyleDef = { bg: string; color: string; border: string };

  const styles: Record<BadgeVariant, StyleDef> = {
    present:          { bg: 'var(--success-bg)',  color: 'var(--success-text)',  border: 'rgba(5,150,105,0.2)' },
    approved:         { bg: 'var(--success-bg)',  color: 'var(--success-text)',  border: 'rgba(5,150,105,0.2)' },
    high_conf:        { bg: 'var(--success-bg)',  color: 'var(--success-text)',  border: 'rgba(5,150,105,0.2)' },
    active:           { bg: 'var(--success-bg)',  color: 'var(--success-text)',  border: 'rgba(5,150,105,0.2)' },
    absent:           { bg: 'var(--danger-bg)',   color: 'var(--danger-text)',   border: 'rgba(220,38,38,0.2)' },
    rejected:         { bg: 'var(--danger-bg)',   color: 'var(--danger-text)',   border: 'rgba(220,38,38,0.2)' },
    inactive:         { bg: 'var(--danger-bg)',   color: 'var(--danger-text)',   border: 'rgba(220,38,38,0.2)' },
    needs_review:     { bg: 'var(--warning-bg)',  color: 'var(--warning-text)',  border: 'rgba(217,119,6,0.2)' },
    pending:          { bg: 'var(--warning-bg)',  color: 'var(--warning-text)',  border: 'rgba(217,119,6,0.2)' },
    locked:           { bg: 'var(--accent-bg)',   color: 'var(--accent-text)',   border: 'var(--accent-border)' },
    ai_detected:      { bg: 'var(--accent-bg)',   color: 'var(--accent-text)',   border: 'var(--accent-border)' },
    teacher_verified: { bg: 'var(--info-bg)',     color: 'var(--info-text)',     border: 'rgba(37,99,235,0.2)' },
    med_conf:         { bg: 'var(--info-bg)',     color: 'var(--info-text)',     border: 'rgba(37,99,235,0.2)' },
    manually_modified:{ bg: 'rgba(139,92,246,0.1)', color: '#7C3AED', border: 'rgba(139,92,246,0.2)' },
    default:          { bg: 'var(--bg-raised)',   color: 'var(--tx-secondary)',  border: 'var(--border)' },
  };

  const sz = size === 'sm' ? { padding: '2px 7px', fontSize: 10 } : size === 'lg' ? { padding: '4px 12px', fontSize: 13 } : { padding: '3px 9px', fontSize: 11 };
  const s  = styles[variant] || styles.default;

  return (
    <span
      className={className}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, borderRadius: 4, fontWeight: 600, letterSpacing: '0.01em', border: `1px solid ${s.border}`, background: s.bg, color: s.color, ...sz }}
    >
      {icon && <span style={{ flexShrink: 0 }}>{icon}</span>}
      {children}
    </span>
  );
};
