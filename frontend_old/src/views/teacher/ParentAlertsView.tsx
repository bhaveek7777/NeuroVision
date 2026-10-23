import React, { useState } from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import { Badge } from '../../components/common/Badge';
import { NotificationSimulatorModal } from '../../components/notifications/NotificationSimulatorModal';
import { Bell, Send, MessageSquare, Smartphone, Mail, CheckCheck, Sparkles } from 'lucide-react';

export const ParentAlertsView: React.FC = () => {
  const { notifications } = useAttendance();
  const [showSimulator, setShowSimulator] = useState(false);

  const parentNotifs = notifications.filter(
    n => n.recipient_type === 'Parent' || n.type === 'Parent Notification' || n.type === 'Student Absent' || n.type === 'Low Attendance'
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Parent Attendance Notifications Log
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time delivery status of automated guardian alerts across WhatsApp, SMS, and Email
          </p>
        </div>

        <button
          onClick={() => setShowSimulator(true)}
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-2 shadow-xs cursor-pointer transition-colors"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Launch Phone Simulator</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs">
          <span className="text-slate-500 dark:text-slate-400 text-xs block">Total Dispatches</span>
          <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono mt-1 block">{parentNotifs.length + 42}</span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block mt-1">100% Delivery SLA</span>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs">
          <span className="text-slate-500 dark:text-slate-400 text-xs block">WhatsApp Rate</span>
          <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-1 block">72%</span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1">Primary guardian pref</span>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs">
          <span className="text-slate-500 dark:text-slate-400 text-xs block">SMS Fallback</span>
          <span className="text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono mt-1 block">20%</span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1">Offline carriers</span>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs">
          <span className="text-slate-500 dark:text-slate-400 text-xs block">Avg Dispatch Latency</span>
          <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 font-mono mt-1 block">&lt; 1.2s</span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1">Post attendance lock</span>
        </div>
      </div>

      {/* Notifications Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Recipient Guardian</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Alert Type</th>
                <th className="py-3 px-4">Channel</th>
                <th className="py-3 px-4">Message Preview</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
              {parentNotifs.map((n) => (
                <tr key={n.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400 text-[11px] whitespace-nowrap">
                    {n.timestamp}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                    {n.recipient_name}
                  </td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                    {n.student_name || 'Class TE Comp C'}
                  </td>
                  <td className="py-3 px-4">
                    <Badge
                      variant={
                        n.type === 'Student Absent'
                          ? 'absent'
                          : n.type === 'Low Attendance'
                          ? 'needs_review'
                          : 'present'
                      }
                      size="sm"
                    >
                      {n.type}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                      {n.channel === 'WhatsApp' ? (
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      ) : n.channel === 'SMS' ? (
                        <Smartphone className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <Mail className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                      )}
                      {n.channel}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-sm truncate text-[11px]">
                    {n.message}
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold font-mono text-[11px]">
                      Sent <CheckCheck className="w-3.5 h-3.5" />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <NotificationSimulatorModal
        isOpen={showSimulator}
        onClose={() => setShowSimulator(false)}
      />
    </div>
  );
};
