import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useAttendance } from '../../context/AttendanceContext';
import { AttendanceSession, AttendanceRecord, AttendanceStatus } from '../../types';
import { AlertCircle, Lock, Send, ShieldAlert, Check } from 'lucide-react';

interface ModificationRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  session?: AttendanceSession | null;
  record?: AttendanceRecord | null;
}

export const ModificationRequestModal: React.FC<ModificationRequestModalProps> = ({
  isOpen,
  onClose,
  session,
  record,
}) => {
  const { createModificationRequest } = useAttendance();

  const [targetStatus, setTargetStatus] = useState<AttendanceStatus>('Present');
  const [reason, setReason] = useState(
    'Student was present but face was not detected due to poor image quality and angle.'
  );
  const [submitted, setSubmitted] = useState(false);

  React.useEffect(() => {
    if (record) {
      setTargetStatus(record.status === 'Present' ? 'Absent' : 'Present');
      setSubmitted(false);
    }
  }, [record]);

  if (!session || !record) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    createModificationRequest({
      sessionId: session.id,
      studentId: record.student_id,
      previousStatus: record.status,
      requestedStatus: targetStatus,
      reason: reason.trim(),
    });

    setSubmitted(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Request Attendance Modification"
      subtitle="Formal correction request for a locked attendance session"
      maxWidth="md"
    >
      {submitted ? (
        <div className="py-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
            <Check className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-white">Modification Request Submitted!</h4>
          <p className="text-xs text-slate-400">
            Request dispatched to academic dean / administrator for approval. Audit trail recorded.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5 text-xs text-amber-300">
            <Lock className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              This session (<strong>{session.id}</strong>) is securely <strong>LOCKED</strong>. Any status alteration requires administrative sign-off.
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Student:</span>
              <span className="font-semibold text-white">{record.student_name} ({record.student_id})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Lecture:</span>
              <span className="text-slate-300">{session.subject} ({session.class_name} - {session.division})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Date & Time:</span>
              <span className="text-slate-300 font-mono">{session.date} at {session.time}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-800">
              <span className="text-slate-400">Current Status:</span>
              <span className={record.status === 'Present' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                {record.status}
              </span>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
              Requested Status:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTargetStatus('Present')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                  targetStatus === 'Present'
                    ? 'bg-emerald-950/40 border-emerald-500 text-emerald-400'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                Mark Present
              </button>
              <button
                type="button"
                onClick={() => setTargetStatus('Absent')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                  targetStatus === 'Absent'
                    ? 'bg-rose-950/40 border-rose-500 text-rose-400'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                Mark Absent
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
              Reason for Request <span className="text-rose-400">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Student was present but face was not detected due to poor image quality."
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:border-indigo-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
            >
              <Send className="w-3.5 h-3.5" />
              Submit Request
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
