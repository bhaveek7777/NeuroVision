import React from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import { Badge } from '../../components/common/Badge';
import { FileCheck2, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export const TeacherModifications: React.FC = () => {
  const { modificationRequests, currentUser } = useAttendance();

  const myRequests = modificationRequests.filter(
    m => m.teacher_name.toLowerCase().includes(currentUser.name.toLowerCase()) ||
         m.teacher_id === currentUser.id ||
         currentUser.role === 'Admin'
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            My Attendance Modification Requests
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Track status of corrections requested on finalized lecture rosters
          </p>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800/40 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-slate-900 dark:text-white">Why are modification requests required?</p>
          <p className="text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
            To prevent arbitrary attendance alterations post-session, attendance locks permanently once confirmed. Any subsequent adjustment is audited and signed off by the Academic Dean / Administrator.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Request ID</th>
                <th className="py-3 px-4">Date &amp; Time</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Subject &amp; Class</th>
                <th className="py-3 px-4">Previous Status</th>
                <th className="py-3 px-4">Requested</th>
                <th className="py-3 px-4">Reason Given</th>
                <th className="py-3 px-4">Admin Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
              {myRequests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {req.request_id}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                    {req.date} {req.time}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                    {req.student_name}
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Roll: {req.roll_no}</div>
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
                    {req.admin_comment && (
                      <p className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-1 font-mono">
                        Admin Note: {req.admin_comment}
                      </p>
                    )}
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
                      icon={
                        req.status === 'Approved' ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : req.status === 'Rejected' ? (
                          <XCircle className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )
                      }
                    >
                      {req.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
