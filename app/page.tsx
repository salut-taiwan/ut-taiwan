import Link from 'next/link';

const faculties = [
  { code: 'FEB', name: 'Ekonomi dan Bisnis', programs: '7 Program Studi', color: 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100 border-l-4 border-l-indigo-500', icon: '📊' },
  { code: 'FHISIP', name: 'Hukum, Ilmu Sosial & Politik', programs: '11 Program Studi', color: 'bg-green-50 border-green-200 hover:bg-green-100 border-l-4 border-l-green-500', icon: '⚖️' },
  { code: 'FKIP', name: 'Keguruan & Ilmu Pendidikan', programs: '12 Program Studi', color: 'bg-amber-50 border-amber-200 hover:bg-amber-100 border-l-4 border-l-amber-500', icon: '🎓' },
  { code: 'FST', name: 'Sains dan Teknologi', programs: '8 Program Studi', color: 'bg-purple-50 border-purple-200 hover:bg-purple-100 border-l-4 border-l-purple-500', icon: '🔬' },
];

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-8 mb-16 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 text-white px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-block text-xs font-semibold uppercase tracking-wide bg-white/20 text-white/90 px-3 py-1 rounded-full mb-6">
            Toko Modul Resmi Universitas Terbuka
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-5 leading-tight">
            Temukan Modul Kuliah<br className="hidden sm:block" />
            Sesuai Program Studi Anda
          </h1>
          <p className="text-lg text-indigo-100 max-w-2xl mx-auto mb-10">
            Beli bahan ajar Universitas Terbuka dengan mudah. Pilih program studi, lihat modul per semester, dan pesan langsung dari Taiwan.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/program"
              className="inline-flex items-center justify-center gap-2 bg-white text-indigo-700 text-base font-semibold px-8 py-4 rounded-xl hover:bg-indigo-50 transition-colors shadow-lg">
              Pilih Program Studi
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link href="/modules"
              className="inline-flex items-center justify-center gap-2 border-2 border-white/40 text-white text-base font-semibold px-8 py-4 rounded-xl hover:bg-white/10 transition-colors">
              Cari Modul
            </Link>
          </div>
        </div>
      </section>

      {/* Faculty Selection */}
      <section className="mb-16">
        <div className="text-center mb-8">
          <span className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Mulai dari sini</span>
          <h2 className="text-3xl font-bold text-slate-900 mt-2 mb-2">Pilih Fakultas</h2>
          <p className="text-slate-500">Mulai dari fakultas Anda untuk menemukan modul yang tepat</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {faculties.map(f => (
            <Link key={f.code} href={`/program?faculty=${f.code}`}
              className={`border-2 rounded-xl p-6 text-center transition-all cursor-pointer hover:shadow-md ${f.color}`}>
              <div className="text-4xl mb-3">{f.icon}</div>
              <div className="font-bold text-slate-900 text-sm mb-1">{f.code}</div>
              <div className="font-semibold text-slate-800 mb-2 text-sm leading-snug">{f.name}</div>
              <div className="text-xs text-slate-500">{f.programs}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 mb-16">
        <div className="text-center mb-8">
          <span className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Proses mudah & cepat</span>
          <h2 className="text-3xl font-bold text-slate-900 mt-2">Cara Pemesanan</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 text-center">
          {[
            { step: '1', title: 'Pilih Program', desc: 'Pilih fakultas dan program studi Anda' },
            { step: '2', title: 'Pilih Modul', desc: 'Pilih modul per semester atau satu per satu' },
            { step: '3', title: 'Checkout', desc: 'Isi alamat pengiriman ke Taiwan' },
            { step: '4', title: 'Bayar & Terima', desc: 'Bayar via transfer bank, modul dikirim ke Taiwan' },
          ].map(item => (
            <div key={item.step} className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-indigo-600 text-white text-xl font-bold flex items-center justify-center mb-4 shadow-md shadow-indigo-200">
                {item.step}
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">{item.title}</h3>
              <p className="text-sm text-slate-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Info cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-16">
        {[
          { title: 'Harga Mahasiswa', desc: 'Dapatkan harga khusus mahasiswa UT untuk pembelian pertama setiap kode mata kuliah', icon: '💰', accent: 'border-t-4 border-amber-400' },
          { title: 'Pengiriman ke Taiwan', desc: 'Kami mengurus pengiriman langsung ke alamat Anda di Taiwan', icon: '✈️', accent: 'border-t-4 border-indigo-400' },
          { title: 'Modul Selalu Update', desc: 'Data modul diperbarui otomatis dari TBO Karunika setiap hari', icon: '🔄', accent: 'border-t-4 border-emerald-400' },
        ].map(item => (
          <div key={item.title} className={`bg-white rounded-xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-shadow ${item.accent}`}>
            <div className="text-3xl mb-3">{item.icon}</div>
            <h3 className="font-semibold text-slate-900 mb-2">{item.title}</h3>
            <p className="text-sm text-slate-600">{item.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
