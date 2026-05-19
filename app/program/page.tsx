'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { FacultyDTO, ProgramDTO } from '@/types';
import { cn } from '@/lib/utils';

const FACULTY_COLORS: Record<string, string> = {
  FEB:    'bg-indigo-50 text-indigo-700 border border-indigo-200',
  FHISIP: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  FKIP:   'bg-amber-50 text-amber-700 border border-amber-200',
  FST:    'bg-purple-50 text-purple-700 border border-purple-200',
};

function ProgramSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-[var(--surface)] rounded-2xl border border-[var(--border-subtle)] p-5 flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <div className="h-6 w-14 rounded-full skeleton" />
            <div className="h-6 w-10 rounded-full skeleton" />
          </div>
          <div className="h-4 w-full rounded skeleton" />
          <div className="h-4 w-2/3 rounded skeleton" />
          <div className="h-3 w-16 rounded skeleton" />
          <div className="mt-2 h-4 w-24 rounded skeleton" />
        </div>
      ))}
    </div>
  );
}

function ProgramPageContent() {
  const searchParams = useSearchParams();
  const facultyFilter = searchParams.get('faculty');

  const [faculties, setFaculties] = useState<FacultyDTO[]>([]);
  const [programs, setPrograms] = useState<ProgramDTO[]>([]);
  const [selectedFaculty, setSelectedFaculty] = useState<string | null>(facultyFilter);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.catalog.getFaculties().then((data: any) => setFaculties(data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const faculty = faculties.find(f => f.code === selectedFaculty);
    const facultyId = faculty?.id;
    api.catalog.getPrograms(facultyId)
      .then((data: any) => setPrograms(data))
      .finally(() => setLoading(false));
  }, [selectedFaculty, faculties]);

  return (
    <div>
      <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">Program Studi</h1>
      <p className="text-[var(--text-body)] mb-8">Pilih program studi untuk melihat daftar modul yang Anda butuhkan</p>

      {/* Faculty filter pills */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setSelectedFaculty(null)}
          className={cn(
            'px-4 py-2 rounded-full text-sm font-medium transition-[background-color,border-color,color,box-shadow] duration-150',
            !selectedFaculty
              ? 'bg-indigo-600 text-white shadow-[var(--shadow-sm)]'
              : 'bg-[var(--surface)] border border-[var(--border-default)] text-[var(--text-body)] hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700'
          )}
        >
          Semua Fakultas
        </button>
        {faculties.map(f => (
          <button
            key={f.code}
            onClick={() => setSelectedFaculty(f.code)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium transition-[background-color,border-color,color,box-shadow] duration-150',
              selectedFaculty === f.code
                ? 'bg-indigo-600 text-white shadow-[var(--shadow-sm)]'
                : 'bg-[var(--surface)] border border-[var(--border-default)] text-[var(--text-body)] hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700'
            )}
          >
            {f.code}
          </button>
        ))}
      </div>

      {loading ? (
        <ProgramSkeleton />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {programs.map(prog => {
            const facultyCode = prog.faculties?.code || '';
            const badgeClass = FACULTY_COLORS[facultyCode] || 'bg-[var(--surface-sunken)] text-[var(--text-body)] border border-[var(--border)]';
            return (
              <Link
                key={prog.id}
                href={`/program/${prog.id}`}
                className="group bg-[var(--surface)] rounded-2xl border border-[var(--border-subtle)] shadow-[var(--shadow-xs)] hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 transition-[box-shadow,transform] duration-200 p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${badgeClass}`}>
                    {facultyCode}
                  </span>
                  <span className="text-xs text-[var(--text-body)] bg-[var(--surface-sunken)] border border-[var(--border)] px-2 py-1 rounded-full">
                    {prog.level}
                  </span>
                </div>
                <h3 className="font-semibold text-[var(--foreground)] group-hover:text-indigo-700 transition-colors duration-150 leading-snug mb-2">
                  {prog.name}
                </h3>
                {prog.total_sks && (
                  <p className="text-xs text-[var(--text-muted)]">{prog.total_sks} SKS</p>
                )}
                <div className="mt-4 flex items-center gap-1 text-sm text-indigo-600 font-semibold group-hover:gap-2 transition-all duration-150">
                  Lihat Modul
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ProgramPage() {
  return (
    <Suspense fallback={<div className="text-center py-16 text-[var(--text-muted)]">Memuat...</div>}>
      <ProgramPageContent />
    </Suspense>
  );
}
