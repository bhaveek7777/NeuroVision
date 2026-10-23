import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { AttendanceStatus, ModificationReason, VerificationStatus } from '../../types';
import { Check, X, AlertCircle, Edit3, UserCheck, ShieldAlert } from 'lucide-react';

interface ManualCorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: {
    student_id: string;
    student_name: string;
    roll_no: string;
    current_status: AttendanceStatus;
    ai_status: AttendanceStatus;
    confidence: number;
    verification_status: VerificationStatus;
  } | null;
  onSaveCorrection: (
    studentId: string,
    newStatus: AttendanceStatus,
    reason: ModificationReason,
    customNote?: string
  ) => void;
}

const reasons: ModificationReason[] = [
  'Face not detected',
  'Poor image quality',
  'Student was manually verified',
  'Incorrect AI match',
  'Arrived late with permission',
  'Other',
];

export const ManualCorrectionModal: React.FC<ManualCorrectionModalProps> = ({
  isOpen,
  onClose,
  student,
  onSaveCorrection,
}) => {
  const [targetStatus, setTargetStatus] = useState<AttendanceStatus>('Present');
  const [selectedReason, setSelectedReason] = useState<ModificationReason>('Student was manually verified');
  const [customNote, setCustomNote] = useState('');

  // Sync state when student opens
  React.useEffect(() => {
    if (student) {
      setTargetStatus(student.current_status === 'Present' ? 'Absent' : 'Present');
      if (student.confidence < 75) {
        setSelectedReason('Poor image quality');
      } else {
        setSelectedReason('Student was manually verified');
      }
    }
  }, [student]);

  if (!student) return null;

  const handleSave = () => {
    onSaveCorrection(student.student_id, targetStatus, selectedReason, customNote);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Manual Attendance Correction"
      subtitle="Teacher override for AI detection pipeline anomalies"
      maxWidth="md"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-sm cursor-pointer"
          >
            Apply Correction
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Student identity banner */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">{student.student_name}</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Roll No: <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">{student.roll_no}</span> | ID: {student.student_id}
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block">AI Confidence</span>
            <span className={`font-mono text-sm font-bold ${
              student.confidence >= 90 ? 'text-emerald-600 dark:text-emerald-400' : student.confidence >= 75 ? 'text-blue-600 dark:text-blue-400' : 'text-amber-600 dark:text-amber-400'
            }`}>
              {student.confidence}%
            </span>
          </div>
        </div>

        {/* Status Switcher Toggle */}
        <div>
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
            Correct Status To:
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setTargetStatus('Present')}
              className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs transition-all cursor-pointer ${
                targetStatus === 'Present'
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-700 dark:text-emerald-400 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Check className="w-4 h-4" />
              Mark Present
            </button>

            <button
              type="button"
              onClick={() => setTargetStatus('Absent')}
              className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs transition-all cursor-pointer ${
                targetStatus === 'Absent'
                  ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-500 text-rose-700 dark:text-rose-400 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <X className="w-4 h-4" />
              Mark Absent
            </button>
          </div>
        </div>

        {/* Reason for Modification (MANDATORY REQUIREMENT) */}
        <div>
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
            Reason for Modification <span className="text-rose-500">*</span>
          </label>
          <div className="space-y-1.5">
            {reasons.map((r) => (
              <label
                key={r}
                className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                  selectedReason === r
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-900 dark:text-white font-medium'
                    : 'bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'
                }`}
              >
                <input
                  type="radio"
                  name="reason"
                  checked={selectedReason === r}
                  onChange={() => setSelectedReason(r)}
                  className="w-3.5 h-3.5 text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
                <span>{r}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Optional Notes */}
        <div>
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
            Teacher Notes / Audit Remarks
          </label>
          <textarea
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            placeholder="e.g. Student sat near the left window corner with backlight reflection."
            rows={2}
            className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <span>
            This correction will be tagged as <strong>Manually Modified</strong> and logged in the immutable system audit trail with the selected reason.
          </span>
        </div>
      </div>
    </Modal>
  );
};
