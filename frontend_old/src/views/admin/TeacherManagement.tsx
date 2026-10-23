import React, { useState } from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import { Teacher } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import {
  GraduationCap,
  UserPlus,
  BookOpen,
  Calendar,
  Mail,
  Phone,
  Edit,
  CheckCircle2,
} from 'lucide-react';

export const TeacherManagement: React.FC = () => {
  const { teachers, addTeacher, updateTeacher, timetable } = useAttendance();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formDept, setFormDept] = useState('Computer Engineering');
  const [formDesignation, setFormDesignation] = useState('Assistant Professor');
  const [formSubjects, setFormSubjects] = useState('DBMS, Database Lab');
  const [formClasses, setFormClasses] = useState('TE Computer, BE Computer');
  const [formDivs, setFormDivs] = useState('C, A');

  // Schedule modal
  const [scheduleTeacher, setScheduleTeacher] = useState<Teacher | null>(null);

  const handleOpenAdd = () => {
    setEditingTeacher(null);
    setFormName('');
    setFormEmail('');
    setFormPhone('+91 98200 12345');
    setFormDept('Computer Engineering');
    setFormDesignation('Assistant Professor');
    setFormSubjects('DBMS');
    setFormClasses('TE Computer');
    setFormDivs('C');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: Teacher) => {
    setEditingTeacher(t);
    setFormName(t.name);
    setFormEmail(t.email);
    setFormPhone(t.phone);
    setFormDept(t.department);
    setFormDesignation(t.designation);
    setFormSubjects(t.assigned_subjects.join(', '));
    setFormClasses(t.assigned_classes.join(', '));
    setFormDivs(t.assigned_divisions.join(', '));
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const subjectsArr = formSubjects.split(',').map(s => s.trim()).filter(Boolean);
    const classesArr = formClasses.split(',').map(s => s.trim()).filter(Boolean);
    const divsArr = formDivs.split(',').map(s => s.trim()).filter(Boolean);

    if (editingTeacher) {
      updateTeacher(editingTeacher.id, {
        name: formName,
        email: formEmail,
        phone: formPhone,
        department: formDept,
        designation: formDesignation,
        assigned_subjects: subjectsArr,
        assigned_classes: classesArr,
        assigned_divisions: divsArr,
      });
    } else {
      addTeacher({
        name: formName,
        email: formEmail || `${formName.toLowerCase().replace(/\s+/g, '.')}@neurovision.com`,
        phone: formPhone,
        department: formDept,
        designation: formDesignation,
        assigned_subjects: subjectsArr,
        assigned_classes: classesArr,
        assigned_divisions: divsArr,
      });
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Badge variant="neutral" size="sm" className="mb-1">
            Faculty Directory
          </Badge>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Teacher Management
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure faculty accounts, subject allotments, classroom assignments, and timetable schedules
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all shrink-0 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Teacher</span>
        </button>
      </div>

      {/* Teachers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teachers.map((teacher) => (
          <div
            key={teacher.id}
            className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={teacher.avatar_url}
                  alt={teacher.name}
                  className="w-12 h-12 rounded-2xl object-cover ring-2 ring-slate-100 dark:ring-slate-800"
                />
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">{teacher.name}</h4>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">{teacher.designation}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{teacher.teacher_id}</p>
                </div>
              </div>
              <button
                onClick={() => handleOpenEdit(teacher)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Edit Teacher"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <Mail className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span className="truncate">{teacher.email}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <Phone className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span className="font-mono">{teacher.phone}</span>
              </div>
            </div>

            {/* Assigned Subjects & Classes */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider block mb-1">
                  Assigned Subjects
                </span>
                <div className="flex flex-wrap gap-1">
                  {teacher.assigned_subjects.map((sub, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-[10px] font-semibold border border-indigo-200 dark:border-indigo-800/40"
                    >
                      {sub}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider block mb-1">
                  Classes & Divisions
                </span>
                <div className="flex flex-wrap gap-1">
                  {teacher.assigned_classes.map((cls, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-[10px] font-semibold border border-purple-200 dark:border-purple-800/40"
                    >
                      {cls}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setScheduleTeacher(teacher)}
                className="w-full py-2 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>View Lecture Schedule</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Teacher Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTeacher ? `Edit Faculty: ${editingTeacher.name}` : 'Add New Faculty Member'}
        subtitle="Manage department credentials, assigned lecture load, and timetable allotment"
        maxWidth="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm cursor-pointer"
            >
              {editingTeacher ? 'Save Changes' : 'Register Faculty'}
            </button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-700 dark:text-slate-300 block mb-1 font-semibold">Teacher Name *</label>
            <input
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Prof. Ramesh Sharma"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 dark:text-slate-300 block mb-1 font-semibold">Email</label>
              <input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="faculty@neurovision.com"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-slate-700 dark:text-slate-300 block mb-1 font-semibold">Phone</label>
              <input
                type="text"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="+91 98200 00000"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 dark:text-slate-300 block mb-1 font-semibold">Department</label>
              <select
                value={formDept}
                onChange={(e) => setFormDept(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Computer Engineering">Computer Engineering</option>
                <option value="Information Technology">Information Technology</option>
              </select>
            </div>
            <div>
              <label className="text-slate-700 dark:text-slate-300 block mb-1 font-semibold">Designation</label>
              <input
                type="text"
                value={formDesignation}
                onChange={(e) => setFormDesignation(e.target.value)}
                placeholder="Associate Professor"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-700 dark:text-slate-300 block mb-1 font-semibold">
              Assigned Subjects (comma separated)
            </label>
            <input
              type="text"
              value={formSubjects}
              onChange={(e) => setFormSubjects(e.target.value)}
              placeholder="DBMS, Database Lab"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 dark:text-slate-300 block mb-1 font-semibold">Classes</label>
              <input
                type="text"
                value={formClasses}
                onChange={(e) => setFormClasses(e.target.value)}
                placeholder="TE Computer, BE Computer"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-slate-700 dark:text-slate-300 block mb-1 font-semibold">Divisions</label>
              <input
                type="text"
                value={formDivs}
                onChange={(e) => setFormDivs(e.target.value)}
                placeholder="C, A"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* View Schedule Modal */}
      {scheduleTeacher && (
        <Modal
          isOpen={Boolean(scheduleTeacher)}
          onClose={() => setScheduleTeacher(null)}
          title={`Schedule: ${scheduleTeacher.name}`}
          subtitle={`${scheduleTeacher.designation} • ${scheduleTeacher.department}`}
          maxWidth="md"
        >
          <div className="space-y-3 text-xs">
            {timetable
              .filter(t => t.teacher_id === scheduleTeacher.id || t.teacher_name.includes(scheduleTeacher.name.split(' ')[1]))
              .map((lec) => (
                <div
                  key={lec.id}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">{lec.subject}</span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">{lec.start_time} - {lec.end_time}</span>
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 flex items-center justify-between">
                    <span>{lec.class_name} - Div {lec.division}</span>
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{lec.classroom}</span>
                  </div>
                </div>
              ))}
          </div>
        </Modal>
      )}
    </div>
  );
};
