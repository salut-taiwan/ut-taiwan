'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { ProgramDTO, SubjectDTO } from '@/types';
import Link from 'next/link';
import { useToast } from '@/components/ui/Toast';
import { useCart } from '@/lib/cart';
import { cn } from '@/lib/utils';

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
  const [addingModule, setAddingModule] = useState<string | null>(null);
  const { user } = useAuth();
  const { showToast } = useToast();
  const { syncCartCount, refreshCart } = useCart();

  useEffect(() => {
    Promise.all([
      api.catalog.getProgram(programId),
      api.catalog.getSubjects(programId),
    ]).then(([prog, subs]) => {
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
    if (!user) { window.location.href = '/login'; return; }
    setAddingAll(true);
    try {
      const allModules = semesterSubjects.flatMap(s =>
        (s.subject_modules || []).map(sm => sm.modules).filter(Boolean)
      );
      const unique = Array.from(new Map(allModules.map(m => [m.id, m])).values());
      const results = await Promise.allSettled(unique.map(m => api.cart.addItem(m.id)));
      const added = results.filter(r => r.status === 'fulfilled').length;
      if (added === 0) { showToast('Gagal menambahkan modul', 'error'); return; }
      const requestCount = unique
        .filter((m, i) => results[i].status === 'fulfilled' && (!m.is_available || !m.price_student))
        .length;
      const normalCount = added - requestCount;
      const msg = requestCount > 0
        ? `${normalCount} modul ditambahkan, ${requestCount} sebagai permintaan`
        : `${added} modul ditambahkan ke keranjang!`;
      showToast(msg);
      await refreshCart();
    } catch (err) {
      showToast('Gagal menambahkan modul', 'error');
    } finally {
      setAddingAll(false);
    }
  }

  async function handleAddModuleToCart(moduleId: string, isRequest: boolean) {
    if (!user) { window.location.href = '/login'; return; }
    setAddingModule(moduleId);
    try {
      const cart = await api.cart.addItem(moduleId);
      syncCartCount(cart.itemCount);
      showToast(isRequest ? 'Modul ditambahkan sebagai permintaan!' : 'Modul ditambahkan ke keranjang!');
    } catch (err) {
      showToast('Gagal menambahkan modul', 'error');
    } finally {
      setAddingModule(null);
    }
  }

  if (loading) return (
    <div className="space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-14 rounded-2xl skeleton" />
      ))}
    </div>
  );
  if (!program) return <div className="text-center py-16 text-red-500">Program tidak ditemukan</div>;

  const displaySubjects = activeTab === 'semester' ? semesterSubjects : subjects;

  return (
    <div>
      <div className="mb-6">
        <Link href="/program" className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 transition-colors duration-150 mb-3">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Semua Program Studi
        </Link>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">{program.name}</h1>
        <p className="text-[var(--text-body)] text-sm mt-1">
          {program.faculties?.name} &bull; {program.level} &bull; {program.total_sks} SKS
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 mb-6 border-b border-[var(--border)]">
        <button
          onClick={() => setActiveTab('semester')}
          className={cn(
            'pb-3 px-1 text-sm font-medium border-b-2 transition-[color,border-color] duration-150',
            activeTab === 'semester' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--foreground)]'
          )}
        >
          Per Semester
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={cn(
            'pb-3 px-1 text-sm font-medium border-b-2 transition-[color,border-color] duration-150',
            activeTab === 'all' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--foreground)]'
          )}
        >
          Semua Mata Kuliah
        </button>
      </div>

      {activeTab === 'semester' && (
        <>
          {/* Semester pills */}
          <div className="flex flex-wrap gap-2 mb-6">
            {SEMESTERS.map(sem => {
              const count = subjects.filter(s => s.semester_hint === sem).length;
              return (
                <button
                  key={sem}
                  onClick={() => setActiveSemester(sem)}
                  disabled={count === 0}
                  className={cn(
                    'px-4 py-2 rounded-full text-sm font-medium transition-[background-color,border-color,color,box-shadow] duration-150 disabled:opacity-30 disabled:cursor-not-allowed',
                    activeSemester === sem
                      ? 'bg-indigo-600 text-white shadow-[var(--shadow-sm)]'
                      : 'bg-[var(--surface)] border border-[var(--border-default)] text-[var(--text-body)] hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700'
                  )}
                >
                  Semester {sem}
                  {count > 0 && <span className="ml-1.5 text-xs opacity-70">({count})</span>}
                </button>
              );
            })}
          </div>

          {semesterSubjects.length > 0 && (
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-[var(--text-body)]">{semesterSubjects.length} mata kuliah di Semester {activeSemester}</p>
              <button
                onClick={handleAddSemesterToCart}
                disabled={addingAll}
                className="inline-flex items-center gap-1.5 text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 hover:-translate-y-px disabled:opacity-50 transition-[background-color,transform,box-shadow] duration-150 font-semibold shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] active:scale-[0.98]"
              >
                {addingAll && <span className="border-2 border-white border-t-transparent rounded-full animate-spin w-3.5 h-3.5" />}
                {addingAll ? 'Menambahkan...' : 'Tambah Semua ke Keranjang'}
              </button>
            </div>
          )}
        </>
      )}

      {/* Subject list */}
      <div className="space-y-3">
        {displaySubjects.length === 0 ? (
          <div className="text-center py-12 text-[var(--text-muted)]">Belum ada data mata kuliah untuk semester ini</div>
        ) : (
          displaySubjects.map(subject => (
            <SubjectCard key={subject.id} subject={subject} onAddToCart={handleAddModuleToCart} addingModule={addingModule} />
          ))
        )}
      </div>
    </div>
  );
}

function SubjectCard({ subject, onAddToCart, addingModule }: { subject: SubjectDTO; onAddToCart: (id: string, isRequest: boolean) => void; addingModule: string | null }) {
  const [expanded, setExpanded] = useState(true);
  const modules = (subject.subject_modules || []).map(sm => sm.modules);

  return (
    <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-subtle)] shadow-[var(--shadow-xs)] overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-[var(--surface-sunken)] transition-colors duration-100"
      >
        <div className="flex items-center gap-3 text-left flex-wrap">
          <span className="font-mono text-xs text-indigo-600 font-semibold whitespace-nowrap">{subject.code}</span>
          <span className="font-medium text-[var(--foreground)]">{subject.name}</span>
          <span className="text-xs text-[var(--text-muted)] whitespace-nowrap">{subject.sks} SKS</span>
          {subject.notes && (
            <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
              {subject.notes}
            </span>
          )}
        </div>
        <svg
          className={cn('w-4 h-4 text-[var(--text-muted)] flex-shrink-0 ml-2 transition-transform duration-200 ease-out', expanded && 'rotate-180')}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && modules.length > 0 && (
        <div className="border-t border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)]">
          {modules.map(mod => (
            <div key={mod.id} className="flex items-center justify-between px-5 py-3 bg-[var(--surface-sunken)] hover:bg-[var(--surface)] transition-colors duration-100">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="font-mono text-xs text-[var(--text-muted)] whitespace-nowrap">{mod.tbo_code}</span>
                <Link href={`/modules/${mod.id}`} className="text-sm text-[var(--foreground)] hover:text-indigo-700 transition-colors duration-150 truncate">
                  {mod.name}
                </Link>
              </div>
              <div className="flex items-center gap-4 ml-4 flex-shrink-0">
                <span className="text-sm font-semibold tabular-nums">
                  {!mod.price_student
                    ? <span className="text-[var(--text-muted)]">Hubungi Kami</span>
                    : mod.is_available
                      ? <span className="text-[var(--foreground)]">{mod.price_student_display}</span>
                      : <span className="text-[var(--text-muted)] line-through">{mod.price_student_display}</span>
                  }
                </span>
                <button
                  onClick={() => onAddToCart(mod.id, !(mod.is_available && mod.price_student))}
                  disabled={addingModule === mod.id}
                  className={`inline-flex items-center gap-1 text-xs px-3 py-2 rounded-lg disabled:opacity-50 transition-[background-color,transform] duration-150 font-semibold active:scale-[0.98] min-h-[32px] ${
                    mod.is_available && mod.price_student
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'bg-amber-500 text-white hover:bg-amber-600'
                  }`}
                >
                  {addingModule === mod.id
                    ? <><span className="border-2 border-white border-t-transparent rounded-full animate-spin w-3 h-3" /> Menambahkan...</>
                    : mod.is_available && mod.price_student ? 'Tambah' : 'Minta'
                  }
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {expanded && modules.length === 0 && (
        <div className="px-5 py-3 bg-[var(--surface-sunken)] border-t border-[var(--border-subtle)] text-sm text-[var(--text-muted)] italic">
          Belum ada data modul untuk mata kuliah ini
        </div>
      )}
    </div>
  );
}
