import React, { useState } from 'react';
import {
  MessageSquare,
  Smartphone,
  Mail,
  Send,
  CheckCheck,
  AlertTriangle,
  User,
  Clock,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';

interface NotificationSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionData?: {
    subject: string;
    className: string;
    division: string;
    date: string;
    time: string;
    presentCount: number;
    absentCount: number;
  };
}

export const NotificationSimulatorModal: React.FC<NotificationSimulatorModalProps> = ({
  isOpen,
  onClose,
  sessionData = {
    subject: 'DBMS',
    className: 'TE Computer',
    division: 'C',
    date: '28 September 2026',
    time: '10:00 AM',
    presentCount: 42,
    absentCount: 8,
  },
}) => {
  const [selectedChannel, setSelectedChannel] = useState<'WhatsApp' | 'SMS' | 'Email'>('WhatsApp');
  const [activeScenario, setActiveScenario] = useState<'present' | 'absent' | 'low_attendance'>('present');

  const getScenarioContent = () => {
    switch (activeScenario) {
      case 'present':
        return {
          student: 'Amit Shah (Roll 102)',
          parent: 'Mr. Ramesh Shah',
          phone: '+91 98201 77312',
          email: 'ramesh.shah@example.com',
          status: 'PRESENT',
          subjectAtt: '92%',
          subject: sessionData.subject,
          type: 'Standard Confirmation',
          badgeColor: 'emerald',
          msg: `NeuroVision Attendance Alert\n\nAmit Shah was marked PRESENT for the ${sessionData.subject} lecture on ${sessionData.date} at ${sessionData.time}.\n\nCurrent ${sessionData.subject} Attendance: 92%.\n\n— Academic Office, Imperial Institute`,
        };
      case 'absent':
        return {
          student: 'Rohan More (Roll 103)',
          parent: 'Mr. Deepak More',
          phone: '+91 98334 11290',
          email: 'deepak.more@example.com',
          status: 'ABSENT',
          subjectAtt: '74%',
          subject: sessionData.subject,
          type: 'Absence Alert',
          badgeColor: 'rose',
          msg: `NeuroVision Attendance Alert\n\nRohan More was marked ABSENT for the ${sessionData.subject} lecture on ${sessionData.date} at ${sessionData.time}.\n\nCurrent ${sessionData.subject} Attendance: 74%.\n\nPlease contact faculty if this absence is medical or pre-approved.\n— Academic Office, Imperial Institute`,
        };
      case 'low_attendance':
        return {
          student: 'Rahul Patil (Roll 101)',
          parent: 'Mr. Suresh Patil',
          phone: '+91 98201 44521',
          email: 'suresh.patil@example.com',
          status: 'LOW ATTENDANCE WARNING',
          subjectAtt: '68%',
          subject: sessionData.subject,
          type: 'Defaulter Warning',
          badgeColor: 'amber',
          msg: `⚠ Low Attendance Alert\n\nRahul Patil's attendance in ${sessionData.subject} is currently 68%, which is below the mandatory 75% university threshold.\n\nAction required: Student and parent advisory meeting scheduled for Friday.\n— HOD, Department of Computer Engineering`,
        };
    }
  };

  const current = getScenarioContent();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Parent Notification Dispatch Simulator"
      subtitle="Autonomous communication layer triggered instantly upon attendance lock"
      maxWidth="2xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
            <CheckCircle2 className="w-4 h-4" />
            <span>Simulated Carrier Gateway Online (All 50 Guardians Queued)</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors"
          >
            Done
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Scenario Selectors */}
        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Select Preview Scenario:
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setActiveScenario('present')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                activeScenario === 'present'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500/40'
                  : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-900 dark:text-white">Student Present</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Amit Shah (92%)</p>
            </button>

            <button
              onClick={() => setActiveScenario('absent')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                activeScenario === 'absent'
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 ring-1 ring-rose-500/40'
                  : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-900 dark:text-white">Student Absent</span>
                <span className="w-2 h-2 rounded-full bg-rose-500" />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Rohan More (74%)</p>
            </button>

            <button
              onClick={() => setActiveScenario('low_attendance')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                activeScenario === 'low_attendance'
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 ring-1 ring-amber-500/40'
                  : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-900 dark:text-white">Low Attendance</span>
                <span className="w-2 h-2 rounded-full bg-amber-500" />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Rahul Patil (68% &lt; 75%)</p>
            </button>
          </div>
        </div>

        {/* Channel Switcher */}
        <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-950 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400 pl-3">Delivery Channel:</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSelectedChannel('WhatsApp')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                selectedChannel === 'WhatsApp'
                  ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
            <button
              onClick={() => setSelectedChannel('SMS')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                selectedChannel === 'SMS'
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>SMS</span>
            </button>
            <button
              onClick={() => setSelectedChannel('Email')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                selectedChannel === 'Email'
                  ? 'bg-purple-600 text-white font-semibold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email</span>
            </button>
          </div>
        </div>

        {/* Realistic Smartphone Mockup View */}
        <div className="max-w-md mx-auto rounded-3xl bg-slate-900 dark:bg-slate-950 border-4 border-slate-700 dark:border-slate-800 p-4 shadow-xl relative overflow-hidden text-slate-100">
          {/* Phone top notch */}
          <div className="w-32 h-4 bg-slate-800 mx-auto rounded-b-xl mb-3 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-slate-950 mr-2" />
            <div className="w-8 h-1 bg-slate-700 rounded-full" />
          </div>

          {/* App Header inside Mockup */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                NV
              </div>
              <div>
                <p className="text-xs font-bold text-white flex items-center gap-1">
                  NeuroVision Official
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400 inline" />
                </p>
                <p className="text-[10px] text-slate-400">{current.parent} ({current.phone})</p>
              </div>
            </div>
            <Badge variant="present" size="sm">
              Sent ✓
            </Badge>
          </div>

          {/* Message Bubble */}
          <div className="space-y-3">
            <div
              className={`p-4 rounded-2xl border text-xs shadow-lg relative ${
                selectedChannel === 'WhatsApp'
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-slate-200'
                  : selectedChannel === 'SMS'
                  ? 'bg-slate-800 border-slate-700 text-slate-200'
                  : 'bg-indigo-950/40 border-indigo-800/60 text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-[11px]">
                <span className="font-bold tracking-wide uppercase text-indigo-300">
                  {current.type}
                </span>
                <span className="font-mono text-slate-400">10:45 AM</span>
              </div>

              <div className="whitespace-pre-line leading-relaxed font-sans text-xs">
                {current.msg}
              </div>

              <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
                <span>Ref: NV-DISP-{Date.now().toString().slice(-6)}</span>
                <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                  Delivered <CheckCheck className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>

          {/* Broadcast Summary stats */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center text-[10px]">
            <div className="p-1.5 rounded-lg bg-slate-800/60">
              <span className="text-slate-400 block">Present Dispatched</span>
              <span className="text-emerald-400 font-bold font-mono text-xs">{sessionData.presentCount} SMS/WA</span>
            </div>
            <div className="p-1.5 rounded-lg bg-slate-800/60">
              <span className="text-slate-400 block">Absent Alerts</span>
              <span className="text-rose-400 font-bold font-mono text-xs">{sessionData.absentCount} SMS/WA</span>
            </div>
            <div className="p-1.5 rounded-lg bg-slate-800/60">
              <span className="text-slate-400 block">Delivery SLA</span>
              <span className="text-indigo-400 font-bold font-mono text-xs">&lt; 1.4s</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
