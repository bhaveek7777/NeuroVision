import React, { useState } from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import { ModificationRequest } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import {
  FileCheck2,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Lock,
  Send,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export const ModificationApprovals: React.FC = () => {
  const {
    modificationRequests,
    approveModificationRequest,
    rejectModificationRequest,
    currentUser,
  } = useAttendance();

  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
  const [selectedReq, setSelectedReq] = useState<ModificationRequest | null>(null);
  const [adminComment, setAdminComment] = useState('Approved following visual confirmation of classroom footage.');

  const displayedRequests = modificationRequests.filter(req => {
    if (activeTab === 'pending') return req.status === 'Pending';
    return true;
  });

  const handleApprove = (reqId: string) => {
    approveModificationRequest(reqId, adminComment);
    setSelectedReq(null);
  };

  const handleReject = (reqId: string) => {
    rejectModificationRequest(reqId, adminComment || 'Rejected due to insufficient verification proof.');
    setSelectedReq(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            Attendance Modification Approvals
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Review teacher override requests on locked lecture attendance rosters
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Pending Review ({modificationRequests.filter(m => m.status === 'Pending').length})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
              activeTab === 'all'
                ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All Requests ({modificationRequests.length})
          </button>
        </div>
      </div>

      {/* Info Callout */}
      <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800/40 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-3">
        <Lock className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-slate-900 dark:text-white">Attendance Policy Enforcement</p>
          <p className="text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
            Once attendance is locked by the teacher, records cannot be modified without administrative approval. Approving a request updates the session record, adjusts the student&apos;s cumulative attendance %, logs an audit trail entry, and dispatches a notification to the parent.
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Request ID</th>
                <th className="py-3 px-4">Date &amp; Time</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Subject &amp; Class</th>
                <th className="py-3 px-4">Previous</th>
                <th className="py-3 px-4">Requested</th>
                <th className="py-3 px-4">Instructor Reason</th>
                <th className="py-3 px-4">Faculty</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
              {displayedRequests.length > 0 ? (
                displayedRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {req.request_id}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                      {req.date} {req.time}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900 dark:text-white">{req.student_name}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Roll: {req.roll_no} • {req.student_id}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                      {req.subject} ({req.class_name} - {req.division})
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={req.previous_status === 'Present' ? 'present' : 'absent'} size="sm">
                        {req.previous_status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={req.requested_status === 'Present' ? 'present' : 'absent'} size="sm">
                        {req.requested_status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-xs text-[11px]">
                      <p className="line-clamp-2">{req.reason}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-medium">
                      {req.teacher_name}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          req.status === 'Approved'
                            ? 'approved'
                            : req.status === 'Rejected'
                            ? 'rejected'
                            : 'pending'
                        }
                        size="sm"
                      >
                        {req.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {req.status === 'Pending' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedReq(req);
                              setAdminComment('Approved following visual confirmation of classroom footage.');
                            }}
                            className="px-2.5 py-1 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[11px] transition-colors cursor-pointer"
                          >
                            Review
                          </button>
                          <button
                            onClick={() => approveModificationRequest(req.id, 'Directly approved by Administrator')}
                            className="px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-semibold text-[11px] transition-colors cursor-pointer"
                          >
                            Approve
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setSelectedReq(req)}
                          className="px-2 py-1 rounded-md text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-[11px] cursor-pointer"
                        >
                          View Details
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-xs text-slate-500">
                    No modification requests match the active filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review & Details Modal */}
      {selectedReq && (
        <Modal
          isOpen={Boolean(selectedReq)}
          onClose={() => setSelectedReq(null)}
          title={`Review Modification: ${selectedReq.request_id}`}
          subtitle={`Requested by ${selectedReq.teacher_name} for ${selectedReq.student_name}`}
          maxWidth="md"
          footer={
            selectedReq.status === 'Pending' ? (
              <div className="flex items-center justify-between w-full">
                <button
                  onClick={() => handleReject(selectedReq.id)}
                  className="px-3.5 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Reject Request
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedReq(null)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleApprove(selectedReq.id)}
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
                  >
                    Approve &amp; Update Session
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setSelectedReq(null)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Close
              </button>
            )
          }
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Student Name:</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedReq.student_name} ({selectedReq.student_id})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Lecture:</span>
                <span className="text-slate-700 dark:text-slate-300">{selectedReq.subject} — {selectedReq.class_name} Div {selectedReq.division}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Date &amp; Time:</span>
                <span className="text-slate-700 dark:text-slate-300 font-mono">{selectedReq.date} at {selectedReq.time}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Current Locked Value:</span>
                <Badge variant={selectedReq.previous_status === 'Present' ? 'present' : 'absent'} size="sm">
                  {selectedReq.previous_status}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Requested Correction:</span>
                <Badge variant={selectedReq.requested_status === 'Present' ? 'present' : 'absent'} size="sm">
                  {selectedReq.requested_status}
                </Badge>
              </div>
            </div>

            <div>
              <span className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Instructor Justification:</span>
              <p className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 italic leading-relaxed">
                &quot;{selectedReq.reason}&quot;
              </p>
            </div>

            {selectedReq.status === 'Pending' ? (
              <div>
                <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                  Administrative Remark / Audit Note:
                </label>
                <textarea
                  rows={2}
                  value={adminComment}
                  onChange={(e) => setAdminComment(e.target.value)}
                  placeholder="Reason for administrative sign-off..."
                  className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            ) : (
              <div>
                <span className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Resolution Details:</span>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                  <p className="text-slate-700 dark:text-slate-300">Reviewed by: {selectedReq.reviewed_by}</p>
                  <p className="text-slate-500 dark:text-slate-400 font-mono text-[10px]">{selectedReq.reviewed_at}</p>
                  {selectedReq.admin_comment && (
                    <p className="text-emerald-700 dark:text-emerald-400 text-[11px] pt-1 border-t border-slate-200 dark:border-slate-800">
                      Note: {selectedReq.admin_comment}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
