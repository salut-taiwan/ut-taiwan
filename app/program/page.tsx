'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { FacultyDTO, ProgramDTO } from '@/types';

const FACULTY_COLORS: Record<string, string> = {
  FEB: 'bg-indigo-100 text-indigo-700',
  FHISIP: 'bg-green-100 text-green-700',
  FKIP: 'bg-amber-100 text-amber-700',
  FST: 'bg-purple-100 text-purple-700',
};

function ProgramPageContent() {
  const searchParams = useSearchParams();
  const facultyFilter = searchParams.get('faculty');

  const [faculties, setFaculties] = useState<FacultyDTO[]>([]);
  const [programs, setPrograms] = useState<ProgramDTO[]>([]);
  const [selectedFaculty, setSelectedFaculty] = useState<string | null>(facultyFilter);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.catalog.getFaculties().then((data: any) => setFaculties(data));
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
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Program Studi</h1>
      <p className="text-slate-500 mb-8">Pilih program studi untuk melihat daftar modul yang Anda butuhkan</p>

      {/* Faculty filter tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setSelectedFaculty(null)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            !selectedFaculty ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Semua Fakultas
        </button>
        {faculties.map(f => (
          <button
            key={f.code}
            onClick={() => setSelectedFaculty(f.code)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedFaculty === f.code
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {f.code}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400">Memuat program studi...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {programs.map(prog => {
            const facultyCode = prog.faculties?.code || '';
            const badgeClass = FACULTY_COLORS[facultyCode] || 'bg-slate-100 text-slate-700';
            return (
              <Link
                key={prog.id}
                href={`/program/${prog.id}`}
                className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 hover:shadow-md hover:border-indigo-200 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${badgeClass}`}>
                    {facultyCode}
                  </span>
                  <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                    {prog.level}
                  </span>
                </div>
                <h3 className="font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors leading-snug mb-2">
                  {prog.name}
                </h3>
                {prog.total_sks && (
                  <p className="text-xs text-slate-500">{prog.total_sks} SKS</p>
                )}
                <div className="mt-4 text-sm text-indigo-600 font-medium group-hover:underline">
                  Lihat Modul &rarr;
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
    <Suspense fallback={<div className="text-center py-16 text-slate-400">Memuat...</div>}>
      <ProgramPageContent />
    </Suspense>
  );
}
