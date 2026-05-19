/**
 * Downloads all 15 UT guide PDFs from GitHub and uploads them to Supabase storage.
 *
 * Usage:
 *   SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/upload-panduan.mjs
 *
 * Prerequisites:
 *   - Node 18+ (uses native fetch)
 *   - A public Supabase storage bucket named "panduan" already created
 *
 * After running, copy the printed PANDUAN_BASE_URL into lib/panduan.ts
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = 'panduan';

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
  console.error('Run as: SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/upload-panduan.mjs');
  process.exit(1);
}

const BASE_GH = 'https://raw.githubusercontent.com/EPX-PANCA/Panduan-UT/main/Panduan';

const FILES = [
  // Login Sistem
  {
    src: `${BASE_GH}/Login%20Sistem/1.%20pedoman%20login%20dengan%20ecampus.pdf`,
    dest: 'login-sistem/pedoman-login-ecampus.pdf',
  },
  // Mahasiswa Baru
  {
    src: `${BASE_GH}/Mahasiswa%20Baru/1.%20Pedoman%20Pendaftaran%20Mahasiswa%20Baru%20(Admisi).pdf`,
    dest: 'mahasiswa-baru/pendaftaran-mahasiswa-baru.pdf',
  },
  {
    src: `${BASE_GH}/Mahasiswa%20Baru/2.%20Pedoman%20Registrasi%20Data%20Pribadi.pdf`,
    dest: 'mahasiswa-baru/registrasi-data-pribadi.pdf',
  },
  {
    src: `${BASE_GH}/Mahasiswa%20Baru/3.%20Pedoman%20Aktivasi%20Akun%20Ulang.pdf`,
    dest: 'mahasiswa-baru/aktivasi-akun-ulang.pdf',
  },
  {
    src: `${BASE_GH}/Mahasiswa%20Baru/4.%20Pedoman%20Forgot%20Password.pdf`,
    dest: 'mahasiswa-baru/forgot-password.pdf',
  },
  {
    src: `${BASE_GH}/Mahasiswa%20Baru/5.%20Cara%20Setting%20Spam%20Email%20SIA.pdf`,
    dest: 'mahasiswa-baru/setting-spam-email.pdf',
  },
  {
    src: `${BASE_GH}/Mahasiswa%20Baru/Proses%20Pendaftaran%20Mahasiswa%20Baru%20Diploma%20dan%20Sarjana%20(Revisi%2029%20Desember%202021).pdf`,
    dest: 'mahasiswa-baru/proses-pendaftaran-diploma-sarjana.pdf',
  },
  // Pembayaran
  {
    src: `${BASE_GH}/Pembayaran/1.%20Tata%20cara%20pembayaran%20via%20tokopedia.pdf`,
    dest: 'pembayaran/pembayaran-tokopedia.pdf',
  },
  {
    src: `${BASE_GH}/Pembayaran/2.%20Tata%20cara%20pembayaranf%20via%20bank%20bri.pdf`,
    dest: 'pembayaran/pembayaran-bank-bri.pdf',
  },
  {
    src: `${BASE_GH}/Pembayaran/3.%20Tata%20cara%20pembayaran%20via%20bank%20btn.pdf`,
    dest: 'pembayaran/pembayaran-bank-btn.pdf',
  },
  {
    src: `${BASE_GH}/Pembayaran/4.%20Tata%20cara%20pembayaran%20via%20bank%20mandiri.pdf`,
    dest: 'pembayaran/pembayaran-bank-mandiri.pdf',
  },
  {
    src: `${BASE_GH}/Pembayaran/5.%20Tata%20cara%20pembayaran%20via%20bank%20VA%20BSI.pdf`,
    dest: 'pembayaran/pembayaran-bank-bsi.pdf',
  },
  // Registrasi Matakuliah
  {
    src: `${BASE_GH}/Registrasi%20Matakuliah/1.%20Panduan%20Registrasi%20SIPAS.pdf`,
    dest: 'registrasi-matakuliah/registrasi-sipas.pdf',
  },
  {
    src: `${BASE_GH}/Registrasi%20Matakuliah/2.%20Panduan%20Registrasi%20NON%20SIPAS.pdf`,
    dest: 'registrasi-matakuliah/registrasi-non-sipas.pdf',
  },
  // Ujian dan Tugas
  {
    src: `${BASE_GH}/Ujian%20dan%20Tugas%20Matakuliah/1.%20Panduan%20Registrasi%20UO.pdf`,
    dest: 'ujian-tugas/registrasi-uo.pdf',
  },
];

async function uploadFile({ src, dest }) {
  // Download from GitHub
  const ghRes = await fetch(src);
  if (!ghRes.ok) throw new Error(`GitHub fetch failed for ${dest}: ${ghRes.status} ${ghRes.statusText}`);
  const buffer = await ghRes.arrayBuffer();

  // Upload to Supabase storage
  const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${dest}`;
  const upRes = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/pdf',
      'x-upsert': 'true',
    },
    body: buffer,
  });

  if (!upRes.ok) {
    const body = await upRes.text();
    throw new Error(`Supabase upload failed for ${dest}: ${upRes.status} ${body}`);
  }
}

async function main() {
  console.log(`Uploading ${FILES.length} PDFs to Supabase bucket "${BUCKET}"...\n`);
  let ok = 0;
  let fail = 0;

  for (const file of FILES) {
    try {
      process.stdout.write(`  ${file.dest} ... `);
      await uploadFile(file);
      console.log('OK');
      ok++;
    } catch (err) {
      console.log(`FAILED: ${err.message}`);
      fail++;
    }
  }

  console.log(`\n${ok} uploaded, ${fail} failed.`);

  if (ok > 0) {
    const base = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}`;
    console.log('\n----------------------------------------');
    console.log('Set PANDUAN_BASE_URL in lib/panduan.ts to:');
    console.log(base);
    console.log('----------------------------------------');
  }
}

main().catch(err => { console.error(err); process.exit(1); });
