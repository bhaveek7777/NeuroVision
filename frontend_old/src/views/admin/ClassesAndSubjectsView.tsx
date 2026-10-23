import React from 'react';
import { Badge } from '../../components/common/Badge';
import { BookOpen, Layers, Users, GraduationCap, MapPin, Sparkles } from 'lucide-react';

export const ClassesAndSubjectsView: React.FC = () => {
  const classesList = [
    {
      id: 'CLS-01',
      name: 'TE Computer (Third Year)',
      department: 'Computer Engineering',
      divisions: ['A (48)', 'B (52)', 'C (50)'],
      classTeacher: 'Prof. Ramesh Sharma (Div C)',
      room: 'Smart Lab 304 / Class 302',
      subjects: ['DBMS', 'Operating Systems', 'Computer Networks', 'Machine Learning'],
    },
    {
      id: 'CLS-02',
      name: 'BE Computer (Final Year)',
      department: 'Computer Engineering',
      divisions: ['A (46)', 'B (49)'],
      classTeacher: 'Dr. Rajesh Gupta',
      room: 'Seminar Hall B',
      subjects: ['Deep Learning', 'Cloud Computing', 'Cybersecurity', 'Capstone Project'],
    },
    {
      id: 'CLS-03',
      name: 'SE Computer (Second Year)',
      department: 'Computer Engineering',
      divisions: ['A (54)', 'B (56)'],
      classTeacher: 'Prof. Anita Desai',
      room: 'Room 201',
      subjects: ['Data Structures', 'Discrete Mathematics', 'OOP in Java', 'Computer Graphics'],
    },
    {
      id: 'CLS-04',
      name: 'SE IT (Information Technology)',
      department: 'Information Technology',
      divisions: ['A (45)'],
      classTeacher: 'Prof. Vivek Joshi',
      room: 'IT Lab 102',
      subjects: ['Web Programming', 'Database Systems', 'Algorithms', 'Software Engineering'],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Badge variant="neutral" size="sm" className="mb-1">
            Academic Structure
          </Badge>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Classes, Divisions & Course Allotment
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Curriculum mapping, active course allotments, and classroom schedules across degree programs
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {classesList.map((cls) => (
          <div
            key={cls.id}
            className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md space-y-4 transition-all"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{cls.name}</h3>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">{cls.department}</p>
              </div>
              <Badge variant="teacher_verified" size="sm">
                Active Cohort
              </Badge>
            </div>

            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Divisions: <strong className="text-slate-800 dark:text-slate-200">{cls.divisions.join(' • ')}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <GraduationCap className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>Class Advisor: <strong className="text-slate-800 dark:text-slate-200">{cls.classTeacher}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Base Venue: <strong className="text-slate-800 dark:text-slate-200">{cls.room}</strong></span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider block mb-1.5">
                Curriculum Modules
              </span>
              <div className="flex flex-wrap gap-1.5">
                {cls.subjects.map((sub, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300 font-medium"
                  >
                    {sub}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
