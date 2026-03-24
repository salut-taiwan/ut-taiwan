import Link from 'next/link';
import { cn } from '@/lib/utils';

const faculties = [
  { 
    code: 'FEB', 
    name: 'Ekonomi dan Bisnis', 
    programs: '7 Program Studi', 
    gradient: 'from-indigo-500 to-indigo-600',
    bgColor: 'bg-indigo-50',
    hoverBg: 'hover:bg-indigo-100',
    borderColor: 'border-indigo-100',
    iconBg: 'bg-indigo-600',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    )
  },
  { 
    code: 'FHISIP', 
    name: 'Hukum, Ilmu Sosial & Politik', 
    programs: '11 Program Studi', 
    gradient: 'from-emerald-500 to-emerald-600',
    bgColor: 'bg-emerald-50',
    hoverBg: 'hover:bg-emerald-100',
    borderColor: 'border-emerald-100',
    iconBg: 'bg-emerald-600',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" />
      </svg>
    )
  },
  { 
    code: 'FKIP', 
    name: 'Keguruan & Ilmu Pendidikan', 
    programs: '12 Program Studi', 
    gradient: 'from-amber-500 to-amber-600',
    bgColor: 'bg-amber-50',
    hoverBg: 'hover:bg-amber-100',
    borderColor: 'border-amber-100',
    iconBg: 'bg-amber-600',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
      </svg>
    )
  },
  { 
    code: 'FST', 
    name: 'Sains dan Teknologi', 
    programs: '8 Program Studi', 
    gradient: 'from-violet-500 to-violet-600',
    bgColor: 'bg-violet-50',
    hoverBg: 'hover:bg-violet-100',
    borderColor: 'border-violet-100',
    iconBg: 'bg-violet-600',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
      </svg>
    )
  },
];

const steps = [
  { 
    step: '1', 
    title: 'Pilih Program', 
    desc: 'Pilih fakultas dan program studi Anda',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
    )
  },
  { 
    step: '2', 
    title: 'Pilih Modul', 
    desc: 'Pilih modul per semester atau satu per satu',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    )
  },
  { 
    step: '3', 
    title: 'Checkout', 
    desc: 'Isi alamat pengiriman ke Taiwan',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
      </svg>
    )
  },
  { 
    step: '4', 
    title: 'Bayar & Terima', 
    desc: 'Bayar via transfer bank, modul dikirim ke Taiwan',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
      </svg>
    )
  },
];

const features = [
  { 
    title: 'Harga Mahasiswa', 
    desc: 'Dapatkan harga khusus mahasiswa UT untuk pembelian pertama setiap kode mata kuliah', 
    gradient: 'from-amber-500 to-orange-500',
    bgGlow: 'bg-amber-500/10',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
      </svg>
    )
  },
  { 
    title: 'Pengiriman ke Taiwan', 
    desc: 'Kami mengurus pengiriman langsung ke alamat Anda di Taiwan', 
    gradient: 'from-indigo-500 to-blue-500',
    bgGlow: 'bg-indigo-500/10',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
      </svg>
    )
  },
  { 
    title: 'Modul Selalu Update', 
    desc: 'Data modul diperbarui otomatis dari TBO Karunika setiap hari', 
    gradient: 'from-emerald-500 to-teal-500',
    bgGlow: 'bg-emerald-500/10',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
      </svg>
    )
  },
];

export default function Home() {
  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-8 mb-20 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-800" />
        
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-3xl" />
          <div className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-tr from-amber-500/20 to-transparent rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.1)_0%,transparent_70%)]" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 px-4 py-2 rounded-full mb-8 animate-fade-in-up">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
            </span>
            <span className="text-sm font-medium">Toko Modul Resmi Universitas Terbuka</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-[1.1] tracking-tight animate-fade-in-up animation-delay-100">
            Temukan Modul Kuliah
            <br />
            <span className="bg-gradient-to-r from-amber-300 to-amber-400 bg-clip-text text-transparent">
              Sesuai Program Studi
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-indigo-100/90 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in-up animation-delay-200">
            Beli bahan ajar Universitas Terbuka dengan mudah. Pilih program studi, lihat modul per semester, dan pesan langsung dari Taiwan.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up animation-delay-300">
            <Link 
              href="/program"
              className={cn(
                'group inline-flex items-center justify-center gap-3',
                'bg-white text-indigo-700 text-base font-semibold',
                'px-8 py-4 rounded-2xl',
                'shadow-[0_4px_12px_rgba(0,0,0,0.15),0_20px_40px_rgba(0,0,0,0.2)]',
                'hover:shadow-[0_8px_24px_rgba(0,0,0,0.2),0_24px_48px_rgba(0,0,0,0.25)]',
                'hover:-translate-y-0.5',
                'active:translate-y-0 active:scale-[0.98]',
                'transition-all duration-300'
              )}
            >
              <span>Pilih Program Studi</span>
              <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link 
              href="/modules"
              className={cn(
                'inline-flex items-center justify-center gap-2',
                'border-2 border-white/30 text-white text-base font-semibold',
                'px-8 py-4 rounded-2xl',
                'backdrop-blur-sm',
                'hover:bg-white/10 hover:border-white/40',
                'active:scale-[0.98]',
                'transition-all duration-300'
              )}
            >
              Cari Modul
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm text-indigo-200/80 animate-fade-in-up animation-delay-400">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Harga Mahasiswa</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Pengiriman ke Taiwan</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Data Update Harian</span>
            </div>
          </div>
        </div>
      </section>

      {/* Faculty Selection */}
      <section className="mb-24">
        <div className="text-center mb-12">
          <span className="inline-block text-xs font-semibold uppercase tracking-[0.15em] text-indigo-600 bg-indigo-50 px-4 py-2 rounded-full mb-4">
            Mulai dari sini
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Pilih Fakultas</h2>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">
            Mulai dari fakultas Anda untuk menemukan modul yang tepat
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {faculties.map((f, index) => (
            <Link 
              key={f.code} 
              href={`/program?faculty=${f.code}`}
              className={cn(
                'group relative overflow-hidden',
                'rounded-2xl p-6 text-center',
                'border transition-all duration-300',
                f.bgColor, f.borderColor, f.hoverBg,
                'hover:shadow-[var(--shadow-elevated)] hover:-translate-y-1',
                'active:translate-y-0 active:scale-[0.99]'
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Icon */}
              <div className={cn(
                'w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4',
                'text-white shadow-lg',
                f.iconBg,
                'transition-transform duration-300 group-hover:scale-110'
              )}>
                {f.icon}
              </div>
              
              <div className="font-bold text-slate-900 text-sm mb-1">{f.code}</div>
              <div className="font-semibold text-slate-700 mb-3 text-sm leading-snug">{f.name}</div>
              <div className="inline-flex items-center gap-1.5 text-xs text-slate-500 bg-white/60 px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50"></span>
                {f.programs}
              </div>
              
              {/* Hover arrow */}
              <div className="absolute top-4 right-4 opacity-0 transform translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mb-24">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-[var(--shadow-card)] p-8 sm:p-12 relative overflow-hidden">
          {/* Decorative gradient */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-50 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          
          <div className="relative">
            <div className="text-center mb-12">
              <span className="inline-block text-xs font-semibold uppercase tracking-[0.15em] text-indigo-600 bg-indigo-50 px-4 py-2 rounded-full mb-4">
                Proses mudah & cepat
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">Cara Pemesanan</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
              {steps.map((item, index) => (
                <div key={item.step} className="relative flex flex-col items-center text-center group">
                  {/* Connector line (hidden on mobile, only between items) */}
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-7 left-1/2 w-full h-[2px] bg-gradient-to-r from-indigo-200 via-indigo-200 to-transparent" />
                  )}
                  
                  {/* Step circle */}
                  <div className={cn(
                    'relative z-10 w-14 h-14 rounded-2xl flex items-center justify-center mb-5',
                    'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white',
                    'shadow-[0_4px_12px_rgba(10,69,149,0.25)]',
                    'transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_8px_24px_rgba(10,69,149,0.35)]'
                  )}>
                    {item.icon}
                  </div>
                  
                  <h3 className="font-semibold text-slate-900 mb-2 text-lg">{item.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed max-w-[200px]">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features / Info cards */}
      <section className="mb-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {features.map((item, index) => (
            <div 
              key={item.title} 
              className={cn(
                'group relative overflow-hidden',
                'bg-white rounded-2xl border border-slate-100',
                'shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elevated)]',
                'p-8 transition-all duration-300',
                'hover:-translate-y-1'
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Gradient glow background */}
              <div className={cn(
                'absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500',
                item.bgGlow
              )} />
              
              <div className="relative">
                {/* Icon */}
                <div className={cn(
                  'w-14 h-14 rounded-2xl flex items-center justify-center mb-5',
                  'bg-gradient-to-br text-white',
                  item.gradient,
                  'shadow-lg transition-transform duration-300 group-hover:scale-110'
                )}>
                  {item.icon}
                </div>
                
                <h3 className="font-semibold text-slate-900 mb-3 text-lg">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
