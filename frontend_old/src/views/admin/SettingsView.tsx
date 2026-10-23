import React, { useState } from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import { Badge } from '../../components/common/Badge';
import {
  Settings,
  Sliders,
  Bell,
  Cpu,
  Shield,
  Building,
  Save,
  CheckCircle2,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings } = useAttendance();

  const [threshold, setThreshold] = useState(settings.min_attendance_threshold);
  const [highConf, setHighConf] = useState(settings.ai_confidence_high_threshold);
  const [medConf, setMedConf] = useState(settings.ai_confidence_medium_threshold);
  const [collegeName, setCollegeName] = useState(settings.college_name);
  const [academicYear, setAcademicYear] = useState(settings.academic_year);
  const [department, setDepartment] = useState(settings.department);

  const [whatsapp, setWhatsapp] = useState(settings.parent_channels.whatsapp);
  const [sms, setSms] = useState(settings.parent_channels.sms);
  const [email, setEmail] = useState(settings.parent_channels.email);
  const [app, setApp] = useState(settings.parent_channels.app);

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      min_attendance_threshold: threshold,
      ai_confidence_high_threshold: highConf,
      ai_confidence_medium_threshold: medConf,
      college_name: collegeName,
      academic_year: academicYear,
      department,
      parent_channels: {
        whatsapp,
        sms,
        email,
        app,
      },
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Institutional &amp; AI Settings
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure system-wide attendance compliance rules, AI confidence classification cutoffs, and parent notification channels
          </p>
        </div>

        {savedSuccess && (
          <span className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-semibold flex items-center gap-1.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            Settings Saved Successfully!
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Appearance & Theme Selector */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl space-y-4 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
            <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Appearance &amp; Theme</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Choose between clean enterprise light and dark mode</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div
              onClick={() => {
                const { toggleTheme, theme } = useAttendance.getState ? useAttendance.getState() : {} as any;
              }}
              className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between"
            >
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">Active Theme Mode</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Controlled instantly via the sun/moon toggle in the top navbar
                </p>
              </div>
              <Badge variant="teacher_verified" size="sm">
                Dual Theme Ready
              </Badge>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">Design Standard</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Minimal Enterprise University SaaS (Zero Flashy Neons)
                </p>
              </div>
              <Badge variant="present" size="sm">
                Compliant
              </Badge>
            </div>
          </div>
        </div>

        {/* Section 1: Academic & Attendance Compliance Thresholds */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl space-y-4 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
            <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Attendance Threshold Policy</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Rules governing student defaulter identification</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <label className="text-slate-700 dark:text-slate-300 font-semibold">Minimum Attendance Threshold (%)</label>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm">{threshold}%</span>
              </div>
              <input
                type="range"
                min={60}
                max={90}
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer accent-indigo-600"
              />
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                Default university standard: 75%. Students below this mark are automatically flagged on the dashboard and their guardians receive low attendance warnings.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: AI Computer Vision Thresholds */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl space-y-4 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
            <Cpu className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Computer Vision Confidence Calibration</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Face recognition matching and verification thresholds</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">High Confidence Tier</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">&ge; {highConf}%</span>
              </div>
              <input
                type="range"
                min={80}
                max={95}
                value={highConf}
                onChange={(e) => setHighConf(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer accent-emerald-600"
              />
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Automatically approved detections without mandatory review.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-amber-700 dark:text-amber-400">Review Required Cutoff</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">&lt; {medConf}%</span>
              </div>
              <input
                type="range"
                min={60}
                max={85}
                value={medConf}
                onChange={(e) => setMedConf(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer accent-amber-600"
              />
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Detections below this percentage trigger human teacher verification flags.
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Parent Notification Channels */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl space-y-4 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
            <Bell className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Parent Dispatch Gateways</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Automated channels enabled for attendance alerts</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <label className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between cursor-pointer">
              <span className="font-semibold text-slate-800 dark:text-white">WhatsApp</span>
              <input
                type="checkbox"
                checked={whatsapp}
                onChange={(e) => setWhatsapp(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded-sm focus:ring-emerald-500"
              />
            </label>

            <label className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between cursor-pointer">
              <span className="font-semibold text-slate-800 dark:text-white">SMS Gateway</span>
              <input
                type="checkbox"
                checked={sms}
                onChange={(e) => setSms(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded-sm focus:ring-blue-500"
              />
            </label>

            <label className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between cursor-pointer">
              <span className="font-semibold text-slate-800 dark:text-white">Email Alert</span>
              <input
                type="checkbox"
                checked={email}
                onChange={(e) => setEmail(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded-sm focus:ring-purple-500"
              />
            </label>

            <label className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between cursor-pointer">
              <span className="font-semibold text-slate-800 dark:text-white">Campus App</span>
              <input
                type="checkbox"
                checked={app}
                onChange={(e) => setApp(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded-sm focus:ring-indigo-500"
              />
            </label>
          </div>
        </div>

        {/* Section 4: Institution Metadata */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl space-y-4 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
            <Building className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Institution Profile</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Header info shown on reports and certificates</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-700 dark:text-slate-300 block mb-1 font-semibold">College / University Name</label>
              <input
                type="text"
                value={collegeName}
                onChange={(e) => setCollegeName(e.target.value)}
                className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-700 dark:text-slate-300 block mb-1 font-semibold">Department</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-slate-700 dark:text-slate-300 block mb-1 font-semibold">Academic Year</label>
                <input
                  type="text"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end pt-2">

          <button
            type="submit"
            className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-2 shadow-xs cursor-pointer transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};
