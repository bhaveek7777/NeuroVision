import React, { useState } from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import { Badge } from '../../components/common/Badge';
import {
  CheckSquare,
  Filter,
  Sliders,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Users,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

export const AttendanceMonitoring: React.FC = () => {
  const { students, teachers, sessions, settings, updateSettings } = useAttendance();

  // Filters
  const [filterClass, setFilterClass] = useState('all');
  const [filterDivision, setFilterDivision] = useState('all');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterTeacher, setFilterTeacher] = useState('all');
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  // Interactive threshold config slider
  const [thresholdInput, setThresholdInput] = useState<number>(settings.min_attendance_threshold);

  const handleThresholdChange = (val: number) => {
    setThresholdInput(val);
    updateSettings({ min_attendance_threshold: val });
  };

  // Filtered Students and stats
  const filteredStudents = students.filter(s => {
    if (filterClass !== 'all' && s.class_id !== filterClass) return false;
    if (filterDivision !== 'all' && s.division !== filterDivision) return false;
    return true;
  });

  // Calculate low attendance students based on current dynamic threshold
  const lowAttendanceStudents = filteredStudents.filter(s => {
    const val = filterSubject !== 'all'
      ? (s.subject_attendance[filterSubject] || s.overall_attendance)
      : s.overall_attendance;
    return val < thresholdInput;
  });

  const totalStudentsCount = filteredStudents.length;
  const avgAttPercentage = totalStudentsCount > 0
    ? Math.round(filteredStudents.reduce((acc, s) => acc + s.overall_attendance, 0) / totalStudentsCount)
    : 0;

  // Chart datasets
  const weeklyData = [
    { label: 'Week 1', rate: 82 },
    { label: 'Week 2', rate: 85 },
    { label: 'Week 3', rate: 84 },
    { label: 'Week 4', rate: 89 },
  ];

  const dailyData = [
    { label: 'Mon 22', rate: 85 },
    { label: 'Tue 23', rate: 87 },
    { label: 'Wed 24', rate: 82 },
    { label: 'Thu 25', rate: 88 },
    { label: 'Fri 26', rate: 90 },
    { label: 'Sat 27', rate: 83 },
  ];

  const monthlyData = [
    { label: 'Jul', rate: 88 },
    { label: 'Aug', rate: 86 },
    { label: 'Sep', rate: 84 },
  ];

  const chartData = timeframe === 'daily' ? dailyData : timeframe === 'weekly' ? weeklyData : monthlyData;

  const subjectWise = [
    { name: 'DBMS', rate: 82 },
    { name: 'OS', rate: 86 },
    { name: 'ML', rate: 88 },
    { name: 'CN', rate: 79 },
    { name: 'DSA', rate: 85 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Attendance Monitoring &amp; Analytics
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Cross-department attendance tracking, multi-variable filters, and dynamic defaulter threshold controls
          </p>
        </div>

        {/* Live Threshold Config Slider */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl flex items-center gap-3 shadow-xs">
          <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <div>
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-slate-600 dark:text-slate-400">Min. Attendance Threshold:</span>
              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-xs ml-2">{thresholdInput}%</span>
            </div>
            <input
              type="range"
              min={60}
              max={90}
              step={1}
              value={thresholdInput}
              onChange={(e) => handleThresholdChange(Number(e.target.value))}
              className="w-36 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex flex-wrap items-center gap-3 shadow-xs">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Filter className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span className="font-medium">Filters:</span>
        </div>

        <select
          value={filterClass}
          onChange={(e) => setFilterClass(e.target.value)}
          className="px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-200 focus:outline-hidden"
        >
          <option value="all">All Classes</option>
          <option value="TE Computer">TE Computer</option>
          <option value="BE Computer">BE Computer</option>
          <option value="SE IT">SE IT</option>
        </select>

        <select
          value={filterDivision}
          onChange={(e) => setFilterDivision(e.target.value)}
          className="px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-200 focus:outline-hidden"
        >
          <option value="all">All Divisions</option>
          <option value="C">Div C</option>
          <option value="A">Div A</option>
          <option value="B">Div B</option>
        </select>

        <select
          value={filterSubject}
          onChange={(e) => setFilterSubject(e.target.value)}
          className="px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-200 focus:outline-hidden"
        >
          <option value="all">All Subjects</option>
          <option value="DBMS">DBMS</option>
          <option value="Operating Systems">Operating Systems</option>
          <option value="Machine Learning">Machine Learning</option>
          <option value="Computer Networks">Computer Networks</option>
        </select>

        <select
          value={filterTeacher}
          onChange={(e) => setFilterTeacher(e.target.value)}
          className="px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-200 focus:outline-hidden"
        >
          <option value="all">All Faculty</option>
          {teachers.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs">
          <span className="text-slate-500 dark:text-slate-400 text-xs block">Enrolled Cohort</span>
          <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono mt-1 block">{totalStudentsCount}</span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-1">Students analyzed</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs">
          <span className="text-slate-500 dark:text-slate-400 text-xs block">Present Average</span>
          <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-1 block">
            {Math.round((totalStudentsCount * avgAttPercentage) / 100)}
          </span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block mt-1">Avg daily presence</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs">
          <span className="text-slate-500 dark:text-slate-400 text-xs block">Absent Average</span>
          <span className="text-2xl font-bold text-rose-600 dark:text-rose-400 font-mono mt-1 block">
            {totalStudentsCount - Math.round((totalStudentsCount * avgAttPercentage) / 100)}
          </span>
          <span className="text-[10px] text-rose-600 dark:text-rose-400 block mt-1">Avg daily absence</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs">
          <span className="text-slate-500 dark:text-slate-400 text-xs block">Overall Attendance %</span>
          <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 font-mono mt-1 block">{avgAttPercentage}%</span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1">&gt; {thresholdInput}% required</span>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily / Weekly / Monthly Timeline Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Attendance Timeline Progression
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Temporal variance across lectures</p>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
              {(['daily', 'weekly', 'monthly'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeframe(t)}
                  className={`px-2.5 py-1 rounded-md capitalize transition-colors font-medium cursor-pointer ${
                    timeframe === t ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b830" />
                <XAxis dataKey="label" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" domain={[60, 100]} fontSize={11} unit="%" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#fff',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#10b981' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subject-wise Bar Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl space-y-4 shadow-xs">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              Subject-wise Attendance Distribution
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Curriculum engagement across engineering modules</p>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectWise}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b830" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" domain={[60, 100]} fontSize={11} unit="%" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="rate" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Low Attendance Section */}
      <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/40 p-5 rounded-xl space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Low Attendance Defaulters List (&lt; {thresholdInput}% Mandatory Mark)
              </h3>
              <p className="text-xs text-rose-600 dark:text-rose-400/80">
                {lowAttendanceStudents.length} students currently fail the threshold criteria and risk university detention.
              </p>
            </div>
          </div>
          <Badge variant="absent" size="sm">
            {lowAttendanceStudents.length} Flagged
          </Badge>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs bg-slate-50 dark:bg-slate-950/60">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase text-slate-600 dark:text-slate-400 font-semibold bg-slate-100 dark:bg-slate-900">
                <th className="py-2.5 px-3">Student Name</th>
                <th className="py-2.5 px-3">Roll No</th>
                <th className="py-2.5 px-3">Class</th>
                <th className="py-2.5 px-3">Subject</th>
                <th className="py-2.5 px-3">Attendance</th>
                <th className="py-2.5 px-3">Required</th>
                <th className="py-2.5 px-3">Parent Contact</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
              {lowAttendanceStudents.map((s) => {
                const dbmsAtt = s.subject_attendance['DBMS'] || s.overall_attendance;
                return (
                  <tr key={s.student_id} className="hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <img src={s.avatar_url} alt="" className="w-5 h-5 rounded-full ring-1 ring-slate-300 dark:ring-slate-700" />
                      <span>{s.name}</span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400">{s.roll_no}</td>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">{s.class_id} - Div {s.division}</td>
                    <td className="py-2.5 px-3 font-semibold text-indigo-600 dark:text-indigo-400">DBMS</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-rose-600 dark:text-rose-400">{dbmsAtt}%</td>
                    <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400">{thresholdInput}%</td>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                      {s.parent_name} ({s.parent_phone})
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge variant="absent" size="sm">
                        Low Attendance
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
