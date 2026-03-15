'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { ProgramDTO, SubjectDTO, ModuleSummaryDTO } from '@/types';
import { formatIDR } from '@/lib/utils';
import Link from 'next/link';

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function ProgramDetailPage() {
  const { programId } = useParams<{ programId: string }>();
  const [program, setProgram] = useState<ProgramDTO | null>(null);
  const [subjects, setSubjects] = useState<SubjectDTO[]>([]);
  const [activeTab, setActiveTab] = useState<'semester' | 'all'>('semester');
  const [activeSemester, setActiveSemester] = useState(1);
  const [loading, setLoading] = useState(true);
  const [semesterSubjects, setSemesterSubjects] = useState<SubjectDTO[]>([]);
  const [addingAll, setAddingAll] = useState(false);

  useEffect(() => {
    Promise.all([
      api.catalog.getProgram(programId),
      api.catalog.getSubjects(programId),
    ]).then(([prog, subs]: any[]) => {
      setProgram(prog);
      setSubjects(subs);
    }).finally(() => setLoading(false));
  }, [programId]);

  useEffect(() => {
    if (activeTab === 'semester') {
      setSemesterSubjects(subjects.filter(s => s.semester_hint === activeSemester));
    }
  }, [activeSemester, subjects, activeTab]);

  async function handleAddSemesterToCart() {
    const token = localStorage.getItem('ut_token');
    if (!token) { window.location.href = '/login'; return; }
    setAddingAll(true);
    try {
      const modules = semesterSubjects.flatMap(s =>
        (s.subject_modules || []).map(sm => sm.modules).filter(m => m.is_available)
      );
      const unique = Array.from(new Map(modules.map(m => [m.id, m])).values());
      await Promise.all(unique.map(m => api.cart.addItem(m.id)));
      alert(`${unique.length} modul ditambahkan ke keranjang!`);
    } catch (err) {
      console.error(err);
    } finally {
      setAddingAll(false);
    }
  }

  async function handleAddModuleToCart(moduleId: string) {
    const token = localStorage.getItem('ut_token');
    if (!token) { window.location.href = '/login'; return; }
    await api.cart.addItem(moduleId);
  }

  if (loading) return <div className="text-center py-16 text-slate-400">Memuat...</div>;
  if (!program) return <div className="text-center py-16 text-red-500">Program tidak ditemukan</div>;

  const displaySubjects = activeTab === 'semester' ? semesterSubjects : subjects;

  return (
    <div>
      <div className="mb-6">
        <Link href="/program" className="text-sm text-indigo-600 hover:underline">&larr; Semua Program Studi</Link>
        <h1 className="text-2xl font-bold text-slate-900 mt-2">{program.name}</h1>
        <p className="text-slate-500 text-sm mt-1">
          {program.faculties?.name} &bull; {program.level} &bull; {program.total_sks} SKS
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 mb-6 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('semester')}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'semester' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Per Semester
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'all' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Semua Mata Kuliah
        </button>
      </div>

      {activeTab === 'semester' && (
        <>
          {/* Semester selector */}
          <div className="flex flex-wrap gap-2 mb-6">
            {SEMESTERS.map(sem => {
              const count = subjects.filter(s => s.semester_hint === sem).length;
              return (
                <button
                  key={sem}
                  onClick={() => setActiveSemester(sem)}
                  disabled={count === 0}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors disabled:opacity-30 ${
                    activeSemester === sem
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Semester {sem}
                  {count > 0 && <span className="ml-1.5 text-xs opacity-70">({count})</span>}
                </button>
              );
            })}
          </div>

          {semesterSubjects.length > 0 && (
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-slate-600">{semesterSubjects.length} mata kuliah di Semester {activeSemester}</p>
              <button
                onClick={handleAddSemesterToCart}
                disabled={addingAll}
                className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors font-semibold shadow-sm"
              >
                {addingAll ? 'Menambahkan...' : 'Tambah Semua ke Keranjang'}
              </button>
            </div>
          )}
        </>
      )}

      {/* Subject list */}
      <div className="space-y-4">
        {displaySubjects.length === 0 ? (
          <div className="text-center py-12 text-slate-400">Belum ada data mata kuliah untuk semester ini</div>
        ) : (
          displaySubjects.map(subject => (
            <SubjectCard key={subject.id} subject={subject} onAddToCart={handleAddModuleToCart} />
          ))
        )}
      </div>
    </div>
  );
}

function SubjectCard({ subject, onAddToCart }: { subject: SubjectDTO; onAddToCart: (id: string) => void }) {
  const [expanded, setExpanded] = useState(true);
  const modules = (subject.subject_modules || []).map(sm => sm.modules);

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3 text-left">
          <span className="font-mono text-xs text-indigo-600 font-semibold whitespace-nowrap">{subject.code}</span>
          <span className="font-medium text-slate-900">{subject.name}</span>
          <span className="text-xs text-slate-400 whitespace-nowrap">{subject.sks} SKS</span>
          {subject.notes && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">{subject.notes}</span>}
        </div>
        <svg className={`w-4 h-4 text-slate-400 flex-shrink-0 ml-2 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && modules.length > 0 && (
        <div className="border-t border-slate-100 divide-y divide-slate-50">
          {modules.map(mod => (
            <div key={mod.id} className="flex items-center justify-between px-5 py-3 bg-slate-50">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="font-mono text-xs text-slate-400 whitespace-nowrap">{mod.tbo_code}</span>
                <Link href={`/modules/${mod.id}`} className="text-sm text-slate-800 hover:text-indigo-700 truncate">
                  {mod.name}
                </Link>
              </div>
              <div className="flex items-center gap-4 ml-4 flex-shrink-0">
                {mod.is_available ? (
                  <>
                    <span className="text-sm font-semibold text-slate-900">
                      {mod.price_student ? formatIDR(mod.price_student) : '-'}
                    </span>
                    <button
                      onClick={() => onAddToCart(mod.id)}
                      className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
                    >
                      Tambah
                    </button>
                  </>
                ) : (
                  <span className="text-xs text-red-400">Tidak Tersedia</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {expanded && modules.length === 0 && (
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-sm text-slate-400 italic">
          Belum ada data modul untuk mata kuliah ini
        </div>
      )}
    </div>
  );
}
