import React, { useState } from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import { Badge } from '../../components/common/Badge';
import {
  History,
  Search,
  Filter,
  Download,
  Shield,
  FileCheck2,
  Calendar,
  Clock,
  User,
} from 'lucide-react';

export const AuditLogsView: React.FC = () => {
  const { auditLogs } = useAttendance();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');

  const filteredLogs = auditLogs.filter(log => {
    if (roleFilter !== 'all' && log.role !== roleFilter) return false;
    if (actionFilter !== 'all' && !log.action.toLowerCase().includes(actionFilter.toLowerCase())) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        log.user.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        (log.affected_student && log.affected_student.toLowerCase().includes(q)) ||
        (log.reason && log.reason.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleExportCSV = () => {
    const headers = ['ID', 'User', 'Role', 'Action', 'Affected Student', 'Previous Value', 'New Value', 'Reason', 'Date', 'Time'];
    const rows = filteredLogs.map(l => [
      l.id,
      `"${l.user}"`,
      l.role,
      `"${l.action}"`,
      `"${l.affected_student || ''}"`,
      `"${l.previous_value || ''}"`,
      `"${l.new_value || ''}"`,
      `"${l.reason || ''}"`,
      l.date,
      l.time,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `NeuroVision_AuditLog_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            System Audit &amp; Governance Logs
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Immutable chronological record of attendance submissions, manual overrides, student registrations, and administrative approvals
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-3.5 py-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors border border-slate-300 dark:border-slate-700 shrink-0 cursor-pointer shadow-xs"
        >
          <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>Export Audit CSV</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2 w-full sm:w-80 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by user, student name, action or reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-200 focus:outline-hidden"
          >
            <option value="all">All Roles</option>
            <option value="Teacher">Teacher</option>
            <option value="Admin">Admin</option>
          </select>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-200 focus:outline-hidden"
          >
            <option value="all">All Actions</option>
            <option value="Attendance Locked">Attendance Locked</option>
            <option value="Modification Requested">Modification Requested</option>
            <option value="Modification Approved">Modification Approved</option>
            <option value="Student Added">Student Added</option>
            <option value="Threshold Updated">Threshold Updated</option>
          </select>

          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono pl-2">
            Entries: {filteredLogs.length}
          </span>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Date &amp; Time</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Affected Student / Entity</th>
                <th className="py-3 px-4">Previous Value</th>
                <th className="py-3 px-4">New Value</th>
                <th className="py-3 px-4">Reason / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap text-[11px]">
                    <div>{log.date}</div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500">{log.time}</div>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                    {log.user}
                  </td>
                  <td className="py-3 px-4">
                    <Badge
                      variant={log.role === 'Admin' ? 'locked' : 'teacher_verified'}
                      size="sm"
                    >
                      {log.role}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                    {log.action}
                  </td>
                  <td className="py-3 px-4 text-indigo-600 dark:text-indigo-400 font-medium">
                    {log.affected_student || '---'}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                    {log.previous_value || '---'}
                  </td>
                  <td className="py-3 px-4 font-mono text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                    {log.new_value || '---'}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300 text-[11px] max-w-xs">
                    <span className="line-clamp-2">{log.reason || 'Routine operation'}</span>
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
