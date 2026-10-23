import React, { useState } from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import { Student } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Edit,
  Power,
  CheckCircle2,
  AlertTriangle,
  Upload,
  BookOpen,
} from 'lucide-react';

export const StudentManagement: React.FC = () => {
  const { students, addStudent, updateStudent, toggleStudentStatus, settings } = useAttendance();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const [filterDivision, setFilterDivision] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Add / Edit Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formRoll, setFormRoll] = useState('');
  const [formClass, setFormClass] = useState('TE Computer');
  const [formDiv, setFormDiv] = useState('C');
  const [formEmail, setFormEmail] = useState('');
  const [formParentName, setFormParentName] = useState('');
  const [formParentPhone, setFormParentPhone] = useState('');
  const [formParentPref, setFormParentPref] = useState<'WhatsApp' | 'SMS' | 'Email' | 'App'>('WhatsApp');

  const filteredStudents = students.filter(s => {
    if (filterClass !== 'all' && s.class_id !== filterClass) return false;
    if (filterDivision !== 'all' && s.division !== filterDivision) return false;
    if (filterStatus !== 'all' && s.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.student_id.toLowerCase().includes(q) ||
        s.roll_no.includes(q) ||
        s.email.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setFormName('');
    setFormRoll(`${101 + students.length}`);
    setFormClass('TE Computer');
    setFormDiv('C');
    setFormEmail('');
    setFormParentName('');
    setFormParentPhone('+91 98200 00000');
    setFormParentPref('WhatsApp');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (s: Student) => {
    setEditingStudent(s);
    setFormName(s.name);
    setFormRoll(s.roll_no);
    setFormClass(s.class_id);
    setFormDiv(s.division);
    setFormEmail(s.email);
    setFormParentName(s.parent_name);
    setFormParentPhone(s.parent_phone);
    setFormParentPref(s.parent_pref);
    setIsAddModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingStudent) {
      updateStudent(editingStudent.id, {
        name: formName,
        roll_no: formRoll,
        class_id: formClass,
        division: formDiv,
        email: formEmail,
        parent_name: formParentName,
        parent_phone: formParentPhone,
        parent_pref: formParentPref,
      });
    } else {
      addStudent({
        name: formName,
        roll_no: formRoll,
        class_id: formClass,
        division: formDiv,
        email: formEmail || `${formName.toLowerCase().replace(/\s+/g, '.')}@student.college.edu`,
        parent_name: formParentName || 'Registered Guardian',
        parent_phone: formParentPhone,
        parent_pref: formParentPref,
      });
    }
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Student Management
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage student records, enrolled classes, contact preferences, and facial feature profiles
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-xs flex items-center gap-2 shadow-xs shrink-0 cursor-pointer transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Student</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2 w-full sm:w-72 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search student, roll number, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
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
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-200 focus:outline-hidden"
          >
            <option value="all">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono pl-2">
            Showing: {filteredStudents.length} / {students.length}
          </span>
        </div>
      </div>

      {/* Student Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Student ID</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Roll No</th>
                <th className="py-3 px-4">Class &amp; Div</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Guardian &amp; Channel</th>
                <th className="py-3 px-4">Attendance %</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
              {filteredStudents.map((s) => {
                const isLow = (s.subject_attendance['DBMS'] || s.overall_attendance) < settings.min_attendance_threshold;
                return (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                      {s.student_id}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={s.avatar_url}
                          alt=""
                          className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700"
                        />
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{s.name}</p>
                          <p className="text-[10px] text-slate-500 font-mono">{s.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                      {s.roll_no}
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                      {s.class_id} - Div {s.division}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 truncate max-w-[160px]">
                      {s.email}
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                      <div>{s.parent_name}</div>
                      <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono">{s.parent_pref}</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold">
                      <div className="flex items-center gap-1.5">
                        <span className={isLow ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}>
                          {s.overall_attendance}%
                        </span>
                        {isLow && (
                          <Badge variant="absent" size="sm">
                            Low
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={s.status === 'Active' ? 'active' : 'inactive'} size="sm">
                        {s.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(s)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Edit Student"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => toggleStudentStatus(s.id)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            s.status === 'Active'
                              ? 'text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10'
                              : 'text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'
                          }`}
                          title={s.status === 'Active' ? 'Deactivate Student' : 'Activate Student'}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Student Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingStudent ? `Edit Student: ${editingStudent.name}` : 'Register New Student'}
        subtitle="Manage academic enrolment, biometric face embedding, and guardian notifications"
        maxWidth="lg"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
            >
              {editingStudent ? 'Save Changes' : 'Register Student'}
            </button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 dark:text-slate-300 block mb-1 font-semibold">Full Name *</label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Rahul Patil"
                className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-slate-700 dark:text-slate-300 block mb-1 font-semibold">Roll Number *</label>
              <input
                type="text"
                required
                value={formRoll}
                onChange={(e) => setFormRoll(e.target.value)}
                placeholder="e.g. 101"
                className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-200 font-mono focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 dark:text-slate-300 block mb-1 font-semibold">Class</label>
              <select
                value={formClass}
                onChange={(e) => setFormClass(e.target.value)}
                className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-hidden"
              >
                <option value="TE Computer">TE Computer</option>
                <option value="BE Computer">BE Computer</option>
                <option value="SE IT">SE IT</option>
              </select>
            </div>
            <div>
              <label className="text-slate-700 dark:text-slate-300 block mb-1 font-semibold">Division</label>
              <select
                value={formDiv}
                onChange={(e) => setFormDiv(e.target.value)}
                className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-hidden"
              >
                <option value="C">Division C</option>
                <option value="A">Division A</option>
                <option value="B">Division B</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-slate-700 dark:text-slate-300 block mb-1 font-semibold">Student Email</label>
            <input
              type="email"
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              placeholder="rahul.patil@student.college.edu"
              className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
              Guardian Details (For Automated SMS / WhatsApp Alerts)
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-700 dark:text-slate-300 block mb-1 font-semibold">Parent / Guardian Name</label>
                <input
                  type="text"
                  value={formParentName}
                  onChange={(e) => setFormParentName(e.target.value)}
                  placeholder="e.g. Suresh Patil"
                  className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-slate-700 dark:text-slate-300 block mb-1 font-semibold">Phone Number</label>
                <input
                  type="text"
                  value={formParentPhone}
                  onChange={(e) => setFormParentPhone(e.target.value)}
                  placeholder="+91 98201 44521"
                  className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-200 font-mono focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="mt-3">
              <label className="text-slate-700 dark:text-slate-300 block mb-1 font-semibold">Notification Channel Preference</label>
              <select
                value={formParentPref}
                onChange={(e) => setFormParentPref(e.target.value as any)}
                className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-hidden"
              >
                <option value="WhatsApp">WhatsApp (Instant Delivery)</option>
                <option value="SMS">SMS Text Alert</option>
                <option value="Email">Email Digest</option>
                <option value="App">Mobile App Push</option>
              </select>
            </div>
          </div>

          {/* Biometric Embedding Card */}
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Upload className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">Biometric Face Embedding</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">InsightFace 512-d feature vector extracted</p>
              </div>
            </div>
            <Badge variant="present" size="sm">
              Vector Sync Ready
            </Badge>
          </div>
        </form>
      </Modal>
    </div>
  );
};
