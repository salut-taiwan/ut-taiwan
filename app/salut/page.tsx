"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type MouseEvent,
} from "react";
import { useAuth } from "@/lib/auth";
import { api, type FeesConfig, type SalutStatus } from "@/lib/api";
import type { UserProfileDTO } from "@/types";

const SALUT_WHATSAPP = process.env.NEXT_PUBLIC_SALUT_WHATSAPP || "886936501760";
const TREASURER_WHATSAPP =
  process.env.NEXT_PUBLIC_SALUT_TREASURER_WHATSAPP || "";

export default function SalutPage() {
  const { user, isLoading } = useAuth();
  const root = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  const uploadedProof = useRef<{ file: File; url: string } | null>(null);
  const autoOpened = useRef(false);
  const [fees, setFees] = useState<FeesConfig | null>(null);
  const [feesLoaded, setFeesLoaded] = useState(false);
  const [profile, setProfile] = useState<UserProfileDTO | null>(null);
  const [status, setStatus] = useState<SalutStatus | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [waNumber, setWaNumber] = useState("");
  const [proof, setProof] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [paymentFeedback, setPaymentFeedback] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.config
      .getFees()
      .then((data) => {
        if (!cancelled) {
          setFees(data);
          setFeesLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFeesLoaded(true);
          setNotice(
            "Informasi pembayaran belum dapat dimuat. Silakan coba lagi atau hubungi SALUT Taiwan.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (isLoading) return;
    if (!user) {
      setProfile(null);
      setStatus(null);
      setLoaded(true);
      return;
    }
    setLoaded(false);
    Promise.all([api.auth.getMe(), api.salut.getStatus()])
      .then(([p, s]) => {
        if (!cancelled) {
          setProfile(p);
          setWaNumber(p.phone || "");
          setStatus(s);
          setLoaded(true);
          if (s.effective_status === "approved")
            setNotice(
              "Kontribusi Anda sudah terverifikasi. Anda tidak perlu melakukan pembayaran ulang selama masa perkuliahan.",
            );
          if (s.effective_status === "pending")
            setNotice(
              "Konfirmasi pembayaran Anda sedang menunggu verifikasi bendahara. Tidak perlu membayar atau mengirim ulang.",
            );
          if (s.effective_status === "expired")
            setNotice(
              "Catatan pembayaran lama perlu diperiksa bendahara. Hubungi SALUT Taiwan sebelum melakukan pembayaran baru.",
            );
          if (s.effective_status === "rejected" && s.salut_rejection_reason)
            setNotice(
              "Konfirmasi sebelumnya belum disetujui: " +
                s.salut_rejection_reason,
            );
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoaded(true);
          setNotice(
            "Data akun belum dapat dimuat. Muat ulang halaman sebelum melanjutkan pembayaran.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [user, isLoading]);

  useEffect(() => {
    if (!proof) {
      setProofPreview("");
      return;
    }
    const url = URL.createObjectURL(proof);
    setProofPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [proof]);

  useEffect(() => {
    if (
      autoOpened.current ||
      !user ||
      !profile ||
      !loaded ||
      fees?.salutMembership.billing !== "once_per_study"
    )
      return;
    if (new URLSearchParams(window.location.search).get("confirm") !== "1")
      return;
    autoOpened.current = true;
    if (
      status?.effective_status === "approved" ||
      status?.effective_status === "pending" ||
      status?.effective_status === "expired"
    )
      return;
    root.current
      ?.querySelector<HTMLDialogElement>("#confirmation-dialog")
      ?.showModal();
  }, [user, profile, loaded, fees, status]);

  function showDialog(id: string) {
    root.current
      ?.querySelectorAll<HTMLDialogElement>("dialog[open]")
      .forEach((d) => d.close());
    root.current?.querySelector<HTMLDialogElement>("#" + id)?.showModal();
  }

  function explainPayment(text: string) {
    setNotice("");
    setPaymentFeedback(text);
    showDialog("payment-feedback-dialog");
  }

  function openPayment(kind: string) {
    if (isLoading || !loaded || !feesLoaded) {
      explainPayment("Mohon tunggu sampai data akun selesai dimuat.");
      return;
    }
    if (!user) {
      explainPayment("Silakan masuk ke akun mahasiswa untuk melanjutkan pembayaran atau mengirim bukti transfer.");
      return;
    }
    if (!profile || !status) {
      explainPayment("Data akun belum dapat dimuat. Silakan muat ulang halaman.");
      return;
    }
    if (status.effective_status === "approved" || status.is_member) {
      explainPayment(
        "Kontribusi Anda sudah terverifikasi. Anda tidak perlu melakukan pembayaran ulang selama masa perkuliahan.",
      );
      return;
    }
    if (status.effective_status === "pending" || status.is_pending) {
      explainPayment(
        "Konfirmasi pembayaran Anda sedang menunggu verifikasi bendahara. Tidak perlu membayar atau mengirim ulang.",
      );
      return;
    }
    if (status.effective_status === "expired") {
      explainPayment(
        "Catatan pembayaran lama Anda perlu diperiksa bendahara. Hubungi SALUT Taiwan sebelum melakukan pembayaran baru.",
      );
      return;
    }
    if (fees?.salutMembership.billing !== "once_per_study") {
      explainPayment(
        "Pembayaran belum tersedia. Hubungi SALUT Taiwan untuk bantuan.",
      );
      return;
    }
    if (!profile.nim) {
      explainPayment(
        "Lengkapi NIM pada profil mahasiswa sebelum melakukan pembayaran.",
      );
      return;
    }
    setError("");
    setMessage("");
    setNotice("");
    showDialog(
      kind === "confirmation" ? "confirmation-dialog" : "payment-dialog",
    );
  }

  function handleClick(event: MouseEvent<HTMLDivElement>) {
    if (!(event.target instanceof Element)) return;
    const paymentButton = event.target.closest<HTMLElement>(
      "[data-open-payment]",
    );
    if (paymentButton) {
      event.preventDefault();
      openPayment(paymentButton.dataset.openPayment || "payment");
      return;
    }
    const contactButton = event.target.closest<HTMLElement>(
      "[data-open-contact]",
    );
    if (contactButton) {
      const treasurer = contactButton.dataset.openContact === "treasurer";
      const digits = (treasurer ? TREASURER_WHATSAPP : SALUT_WHATSAPP).replace(
        /\D/g,
        "",
      );
      if (digits) {
        window.open("https://wa.me/" + digits, "_blank", "noopener,noreferrer");
        return;
      }
      showDialog("contact-dialog");
      return;
    }
    const close = event.target.closest(".close-dialog");
    if (close) {
      close.closest("dialog")?.close();
      return;
    }
    if (event.target instanceof HTMLDialogElement) {
      const rect = event.target.getBoundingClientRect();
      if (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      )
        event.target.close();
    }
  }

  function handleProofChange(event: ChangeEvent<HTMLInputElement>) {
    setError("");
    setMessage("");
    uploadedProof.current = null;
    const file = event.target.files?.[0];
    if (!file) {
      setProof(null);
      return;
    }
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 5 * 1024 * 1024
    ) {
      event.target.value = "";
      setProof(null);
      setError("Pilih foto JPG, PNG, atau WebP, maksimal 5 MB.");
      return;
    }
    setProof(file);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current || !proof || !profile || !user || !status) return;
    if (fees?.salutMembership.billing !== "once_per_study") {
      setError("Pembayaran belum tersedia. Hubungi SALUT Taiwan.");
      return;
    }
    if (!waNumber.trim()) {
      setError("Nomor WhatsApp aktif wajib diisi.");
      return;
    }
    const note = String(
      new FormData(event.currentTarget).get("note") || "",
    ).trim();
    busy.current = true;
    setSubmitting(true);
    setError("");
    try {
      const fresh = await api.salut.getStatus();
      if (
        ["approved", "pending", "expired"].includes(
          fresh.effective_status || "none",
        )
      )
        throw new Error(
          "Status pembayaran telah berubah. Tutup formulir dan muat ulang halaman sebelum melanjutkan.",
        );
      const receipt =
        uploadedProof.current?.file === proof
          ? uploadedProof.current
          : { file: proof, ...(await api.salut.uploadProof(proof)) };
      uploadedProof.current = receipt;
      await api.salut.apply(
        receipt.url,
        profile.current_semester,
        waNumber.trim(),
        note,
      );
      setStatus({
        ...fresh,
        effective_status: "pending",
        salut_status: "pending",
        is_pending: true,
        is_member: false,
      });
      setMessage(
        "Konfirmasi pembayaran berhasil dikirim. Bendahara akan memeriksa bukti transfer Anda.",
      );
      setNotice(
        "Konfirmasi pembayaran Anda sudah diterima dan sedang menunggu verifikasi bendahara. Tidak perlu membayar ulang.",
      );
      setProof(null);
      uploadedProof.current = null;
      root.current
        ?.querySelector<HTMLFormElement>("#confirmation-form")
        ?.reset();
      setWaNumber(profile.phone || "");
      root.current
        ?.querySelector<HTMLDialogElement>("#confirmation-dialog")
        ?.close();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Konfirmasi belum terkirim. Silakan coba lagi.",
      );
    } finally {
      busy.current = false;
      setSubmitting(false);
    }
  }

  return (
    <div className="salut-page" ref={root} onClick={handleClick}>
      <style>{SALUT_CSS}</style>
      <section className="hero" id="tentang">
        <div className="wrap hero-grid">
          <div>
            <div className="kicker">Bersama SALUT Taiwan</div>
            <h1>
              Kontribusi Operasional
              <br />
              SALUT Taiwan
            </h1>
            <p className="hero-description">
              SALUT Taiwan mendukung mahasiswa Universitas Terbuka melalui
              informasi, pendampingan, dan kegiatan yang menghubungkan kita
              selama perkuliahan.
            </p>
            <a href="#alokasi" className="button button-blue">
              Lihat Penggunaan Dana <span aria-hidden="true">↓</span>
            </a>
          </div>
          <aside
            className="fee-card"
            aria-label="Nominal dan ketentuan kontribusi mahasiswa UT Taiwan"
          >
            <div className="fee-label">Kontribusi Mahasiswa UT Taiwan</div>
            <div className="price">
              NTD <strong>1.700</strong>
            </div>
            <p>
              <strong>Satu kali selama masa perkuliahan.</strong>
              <br />
              Tidak dibayarkan ulang setiap semester.
            </p>
            <a className="fee-link" href="#pembayaran">
              Lihat panduan pembayaran <span aria-hidden="true">→</span>
            </a>
          </aside>
        </div>
      </section>
      <section id="alokasi" className="allocation">
        <div className="wrap">
          <div className="section-heading">
            <div>
              <div className="kicker">Empat kebutuhan operasional utama</div>
              <h2>
                Untuk layanan yang berjalan,
                <br />
                dan komunitas yang bertumbuh.
              </h2>
              <p className="allocation-intro">
                Di balik setiap layanan, ada pengelolaan dan koordinasi yang
                perlu didukung bersama.
              </p>
            </div>
          </div>
          <div className="allocation-grid">
            <article className="allocation-card">
              <div className="icon-box" aria-hidden="true">
                <svg
                  width="25"
                  height="25"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <rect x="4" y="6" width="16" height="15" rx="2"></rect>
                  <path d="M4 10h16M12 6v15M4 6l8-4 8 4"></path>
                </svg>
              </div>
              <div>
                <h3>Logistik dan perlengkapan mahasiswa</h3>
                <p>
                  Almamater mahasiswa baru dan pengirimannya, serta koordinasi
                  kebutuhan modul dan bahan ajar.
                </p>
                <details className="service-details">
                  <summary aria-label="Lihat cakupan layanan logistik">
                    Lihat cakupan layanan
                  </summary>
                  <ul>
                    <li>
                      <strong>Almamater:</strong> pendataan, pengadaan dari UT
                      Pusat, dan pengiriman ke alamat mahasiswa.
                    </li>
                    <li>
                      <strong>Modul dan bahan ajar:</strong> koordinasi
                      kebutuhan, pemesanan, pengiriman, serta informasi akses
                      digital resmi.
                    </li>
                  </ul>
                </details>
              </div>
            </article>
            <article className="allocation-card">
              <div className="icon-box" aria-hidden="true">
                <svg
                  width="25"
                  height="25"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <rect x="5" y="4" width="14" height="17" rx="2"></rect>
                  <path d="M9 4V2h6v2M8 10h8M8 14h8M8 18h5"></path>
                </svg>
              </div>
              <div>
                <h3>Administrasi dan pelayanan mahasiswa</h3>
                <p>
                  Informasi, konsultasi prosedur akademik, pendataan, dan
                  koordinasi kendala mahasiswa dengan UT.
                </p>
                <details className="service-details">
                  <summary aria-label="Lihat cakupan layanan administrasi">
                    Lihat cakupan layanan
                  </summary>
                  <ul>
                    <li>
                      <strong>Pendaftaran:</strong> informasi persyaratan,
                      pendampingan berkas, dan panduan aktivasi MyUT.
                    </li>
                    <li>
                      <strong>Administrasi:</strong> panduan registrasi mata
                      kuliah/SKS, informasi UKT, dan perubahan data.
                    </li>
                    <li>
                      <strong>Perkuliahan:</strong> informasi kalender akademik,
                      pengingat, dan konsultasi kendala layanan.
                    </li>
                    <li>
                      <strong>Ujian:</strong> panduan teknis SEB, informasi
                      UAOP/THE, serta koordinasi dengan Posko UT-LLN.
                    </li>
                    <li>
                      <strong>Beasiswa:</strong> informasi program dan
                      pendampingan administrasi pengajuan sesuai persyaratan.
                    </li>
                    <li>
                      <strong>Kelulusan:</strong> informasi persyaratan dan
                      koordinasi administrasi akhir studi.
                    </li>
                  </ul>
                </details>
              </div>
            </article>
            <article className="allocation-card">
              <div className="icon-box" aria-hidden="true">
                <svg
                  width="25"
                  height="25"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <rect x="2" y="4" width="20" height="14" rx="2"></rect>
                  <path d="M8 22h8m-4-4v4M6 8h12M6 12h8"></path>
                </svg>
              </div>
              <div>
                <h3>Sistem dan informasi digital</h3>
                <p>
                  Pengelolaan website, data mahasiswa, media sosial, dan
                  publikasi informasi akademik.
                </p>
                <details className="service-details">
                  <summary aria-label="Lihat cakupan layanan digital">
                    Lihat cakupan layanan
                  </summary>
                  <ul>
                    <li>
                      <strong>Kanal informasi:</strong> website dan media sosial
                      untuk pengumuman, panduan, serta informasi akademik.
                    </li>
                    <li>
                      <strong>Sistem layanan:</strong> pendataan mahasiswa,
                      pencatatan permohonan, dan pengembangan layanan digital.
                    </li>
                  </ul>
                </details>
              </div>
            </article>
            <article className="allocation-card">
              <div className="icon-box" aria-hidden="true">
                <svg
                  width="25"
                  height="25"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <circle cx="9" cy="7" r="3"></circle>
                  <path d="M3 21v-3a6 6 0 0 1 12 0v3m1-17a3 3 0 0 1 0 6m2 5a5 5 0 0 1 3 4v2"></path>
                </svg>
              </div>
              <div>
                <h3>Kegiatan dan komunitas mahasiswa</h3>
                <p>
                  OSMB, pertemuan, seminar, serta kegiatan mahasiswa dan ORMAWA
                  sesuai program.
                </p>
                <details className="service-details">
                  <summary aria-label="Lihat cakupan layanan kegiatan">
                    Lihat cakupan layanan
                  </summary>
                  <ul>
                    <li>
                      <strong>Orientasi:</strong> dukungan OSMB daring/luring
                      dan pengenalan sistem perkuliahan.
                    </li>
                    <li>
                      <strong>Komunitas:</strong> pertemuan, kelompok belajar,
                      seminar, sosialisasi, dan kegiatan ORMAWA.
                    </li>
                    <li>
                      <strong>Akhir studi:</strong> koordinasi kegiatan
                      pengukuhan lulusan atau wisuda di Taiwan sesuai ketentuan
                      acara.
                    </li>
                  </ul>
                </details>
              </div>
            </article>
          </div>
          <p className="allocation-note">
            Cakupan dukungan mengikuti ketentuan dan kesiapan layanan SALUT
            Taiwan. Kontribusi operasional membantu menjaga keberlangsungannya.
          </p>
        </div>
      </section>
      <section id="kegiatan" className="gallery-section">
        <div className="wrap">
          <div className="section-heading">
            <div>
              <div className="kicker">Dokumentasi</div>
              <h2>Kebersamaan yang kita dukung.</h2>
            </div>
          </div>
          <div className="gallery-grid">
            <article className="photo-card">
              <div className="photo-frame has-photo" id="frame-0">
                <img
                  className="event-photo"
                  id="photo-0"
                  alt="Foto kegiatan OSMB SALUT Taiwan"
                  src="/images/salut/osmb.jpg"
                />
                <div className="empty-photo" hidden>
                  <div className="photo-symbol">
                    <svg
                      width="25"
                      height="25"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.4"
                    >
                      <rect x="3" y="4" width="18" height="16" rx="2"></rect>
                      <circle cx="8" cy="9" r="1.5"></circle>
                      <path d="m3 17 5-4 4 3 4-6 5 5"></path>
                    </svg>
                  </div>
                  <strong>
                    Orientasi Studi
                    <br />
                    Mahasiswa Baru
                  </strong>
                  <small>Tempat foto dokumentasi OSMB</small>
                </div>
                <div className="photo-caption">
                  <strong>Orientasi Studi Mahasiswa Baru</strong>
                </div>
              </div>
            </article>
            <article className="photo-card">
              <div className="photo-frame has-photo" id="frame-1">
                <img
                  className="event-photo"
                  id="photo-1"
                  alt="Foto kegiatan kebersamaan mahasiswa SALUT Taiwan"
                  src="/images/salut/kebersamaan.jpg"
                />
                <div className="empty-photo" hidden>
                  <div className="photo-symbol">
                    <svg
                      width="25"
                      height="25"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.4"
                    >
                      <circle cx="9" cy="7" r="3"></circle>
                      <path d="M3 21v-3a6 6 0 0 1 12 0v3m1-17a3 3 0 0 1 0 6m2 5a5 5 0 0 1 3 4v2"></path>
                    </svg>
                  </div>
                  <strong>Kebersamaan Mahasiswa</strong>
                  <small>Tempat foto kegiatan mahasiswa</small>
                </div>
                <div className="photo-caption">
                  <strong>Kebersamaan Mahasiswa</strong>
                </div>
              </div>
            </article>
            <article className="photo-card">
              <div className="photo-frame has-photo" id="frame-2">
                <img
                  className="event-photo"
                  id="photo-2"
                  alt="Foto almamater mahasiswa SALUT Taiwan"
                  src="/images/salut/almamater.jpg"
                />
                <div className="empty-photo" hidden>
                  <div className="photo-symbol">
                    <svg
                      width="25"
                      height="25"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.4"
                    >
                      <path d="m8 3-5 3-2 5 4 2 1-3v11h12V10l1 3 4-2-2-5-5-3c-1 4-7 4-8 0Z"></path>
                    </svg>
                  </div>
                  <strong>Almamater Mahasiswa</strong>
                  <small>Tempat foto pembagian almamater</small>
                </div>
                <div className="photo-caption">
                  <strong>Almamater Mahasiswa</strong>
                </div>
              </div>
            </article>
            <article className="photo-card">
              <div className="photo-frame has-photo" id="frame-3">
                <img
                  className="event-photo"
                  id="photo-3"
                  alt="Foto kegiatan ORMAWA Universitas Terbuka di Taiwan"
                  src="/images/salut/ormawa.jpg"
                />
                <div className="empty-photo" hidden>
                  <div className="photo-symbol">
                    <svg
                      width="25"
                      height="25"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.4"
                    >
                      <path d="m2 8 10-5 10 5-10 5L2 8Zm4 2v7c4 3 8 3 12 0v-7m4-2v8"></path>
                    </svg>
                  </div>
                  <strong>Kegiatan Mahasiswa dan ORMAWA</strong>
                  <small>Tempat dokumentasi kegiatan organisasi</small>
                </div>
                <div className="photo-caption">
                  <strong>Kegiatan Mahasiswa dan ORMAWA</strong>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>
      <section id="pembayaran" className="payment-section">
        <div className="wrap payment-grid">
          <div>
            <div className="kicker">Kontribusi Mahasiswa UT Taiwan</div>
            <h2>
              Menjaga layanan bersama,
              <br />
              melalui satu kontribusi.
            </h2>
            <p className="payment-intro">
              Untuk mendukung kebutuhan tersebut, mahasiswa UT Taiwan
              berkontribusi melalui satu pembayaran selama masa perkuliahan.
            </p>
            <div className="contribution-amount">
              <strong>NTD 1.700</strong>
              <span>
                Satu kali selama masa perkuliahan.
                <br />
                Tidak dibayarkan ulang setiap semester.
              </span>
            </div>
            <h3 className="steps-heading">Panduan pembayaran dan konfirmasi</h3>
            <ol className="payment-steps">
              <li>
                <strong>Login ke website SALUT Taiwan</strong>
                <span>
                  Gunakan NIM dan kata sandi akun yang sudah Anda buat.
                </span>
              </li>
              <li>
                <strong>Buka laman SALUT dan lakukan pembayaran</strong>
                <span>
                  Klik{" "}
                  <a href="#" data-open-payment="payment">
                    Lanjutkan Pembayaran
                  </a>{" "}
                  untuk melihat rekening bendahara. Transfer sesuai nominal yang
                  tertera, lalu simpan bukti transaksi.
                </span>
              </li>
              <li>
                <strong>Konfirmasikan pembayaran Anda</strong>
                <span>
                  Klik{" "}
                  <a href="#" data-open-payment="confirmation">
                    Konfirmasi Pembayaran
                  </a>
                  , lalu isi nama, NIM, unggah foto bukti transfer, dan
                  tambahkan keterangan agar bendahara dapat memverifikasinya.
                </span>
              </li>
            </ol>
            {notice && (
              <p className="status-notice" role="status">
                {notice}
              </p>
            )}
            <div className="payment-actions">
              <button
                className="button button-gold"
                type="button"
                data-open-payment="payment"
                aria-busy={isLoading || !loaded || !feesLoaded}
              >
                Lanjutkan Pembayaran
              </button>
              <button
                type="button"
                className="button button-confirm"
                data-open-payment="confirmation"
              >
                Konfirmasi Pembayaran
              </button>
            </div>
          </div>
          <aside className="payment-help">
            <h3>Perlu diketahui</h3>
            <details>
              <summary>Sudah pernah membayar?</summary>
              <p>
                Jika sudah diverifikasi, Anda tidak perlu membayar ulang selama
                masa perkuliahan. Hubungi admin dengan bukti pembayaran bila
                catatannya belum muncul.
              </p>
            </details>
            <details>
              <summary>Apakah semua biaya sudah termasuk?</summary>
              <p>
                Almamater mahasiswa baru dan pengirimannya merupakan bagian dari
                kontribusi. Modul, pengiriman bahan ajar, dan kegiatan tertentu
                mengikuti ketentuan masing-masing; pastikan rinciannya kepada
                admin.
              </p>
            </details>
            <details>
              <summary>Bagaimana dengan beasiswa?</summary>
              <p>
                SALUT membantu informasi dan administrasi pengajuan. Penerimaan
                mengikuti seleksi dan ketentuan penyelenggara.
              </p>
            </details>
            <div className="support-block">
              <h3>Ada kendala pembayaran?</h3>
              <p>
                Hubungi SALUT Taiwan untuk bantuan akun dan layanan, atau
                bendahara untuk transfer dan verifikasi pembayaran.
              </p>
              <div className="support-actions">
                <button
                  type="button"
                  className="button support-button"
                  data-open-contact="salut"
                >
                  Hubungi WhatsApp SALUT{" "}
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    aria-hidden="true"
                  >
                    <path d="M7 17 17 7M7 7h10v10"></path>
                  </svg>
                </button>
                <button
                  type="button"
                  className="button support-button"
                  data-open-contact="treasurer"
                >
                  Hubungi WhatsApp Bendahara{" "}
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    aria-hidden="true"
                  >
                    <path d="M7 17 17 7M7 7h10v10"></path>
                  </svg>
                </button>
              </div>
            </div>
          </aside>
        </div>
      </section>
      <dialog
        className="dialog"
        id="payment-feedback-dialog"
        aria-labelledby="payment-feedback-title"
      >
        <div className="dialog-top">
          <strong>Informasi pembayaran</strong>
          <button type="button" className="close-dialog" aria-label="Tutup">
            Tutup
          </button>
        </div>
        <h2 id="payment-feedback-title">Sebelum melanjutkan</h2>
        <p role="status">{paymentFeedback}</p>
        {!user && !isLoading && (
          <a className="button button-blue" href="/login?redirect=%2Fsalut%3Fconfirm%3D1">
            Masuk untuk melanjutkan
          </a>
        )}
        {user && profile && !profile.nim && (
          <a className="button button-blue" href="/profile">
            Lengkapi NIM di profil
          </a>
        )}
        {user && (
          <button type="button" className="button button-blue" data-open-contact="salut">
            Hubungi admin SALUT
          </button>
        )}
      </dialog>
      <dialog
        className="dialog"
        id="payment-dialog"
        aria-labelledby="payment-dialog-title"
      >
        <div className="dialog-top">
          <strong>Informasi rekening bendahara</strong>
          <button type="button" className="close-dialog" aria-label="Tutup">
            <svg
              width="19"
              height="19"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
            >
              <path d="m6 6 12 12M18 6 6 18"></path>
            </svg>
          </button>
        </div>
        <h2 id="payment-dialog-title">Lanjutkan Pembayaran</h2>
        <p>
          Transfer kontribusi operasional ke rekening bendahara SALUT Taiwan
          yang tercantum di bawah, lalu simpan bukti transfer Anda.
        </p>
        <div className="bank-amount">
          <span>Nominal kontribusi</span>
          <strong>NTD 1.700</strong>
          <small>Satu kali selama masa perkuliahan.</small>
        </div>
        <dl className="bank-details">
          <div>
            <dt>Nama bank</dt>
            <dd>PostBank</dd>
          </div>
          <div>
            <dt>Atas nama</dt>
            <dd>Vira</dd>
          </div>
          <div>
            <dt>Nomor rekening</dt>
            <dd className="account-number">700-00011311204391</dd>
          </div>
        </dl>
        <p className="dialog-note">
          Setelah transfer, klik Konfirmasi Pembayaran dan unggah bukti
          transaksi untuk diverifikasi oleh bendahara.
        </p>
        <button
          type="button"
          className="button button-blue"
          data-open-payment="confirmation"
        >
          Sudah Transfer? Konfirmasi Pembayaran
        </button>
      </dialog>
      <dialog
        className="dialog"
        id="confirmation-dialog"
        aria-labelledby="confirmation-dialog-title"
      >
        <div className="dialog-top">
          <strong>Konfirmasi untuk verifikasi bendahara</strong>
          <button type="button" className="close-dialog" aria-label="Tutup">
            <svg
              width="19"
              height="19"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
            >
              <path d="m6 6 12 12M18 6 6 18"></path>
            </svg>
          </button>
        </div>
        <h2 id="confirmation-dialog-title">Konfirmasi Pembayaran</h2>
        <p>
          Isi data mahasiswa dan lampirkan foto bukti transfer agar pembayaran
          dapat dicocokkan oleh bendahara.
        </p>
        <form id="confirmation-form" onSubmit={handleSubmit}>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <label htmlFor="confirmation-name">Nama lengkap</label>
          <input
            id="confirmation-name"
            value={profile?.name ?? ""}
            readOnly
            name="student_name"
            autoComplete="name"
            placeholder="Nama sesuai data mahasiswa"
            required
            maxLength={120}
          />
          <label htmlFor="confirmation-nim">NIM</label>
          <input
            id="confirmation-nim"
            value={profile?.nim ?? ""}
            readOnly
            name="nim"
            inputMode="numeric"
            autoComplete="off"
            placeholder="Nomor Induk Mahasiswa"
            required
            pattern="[0-9]+"
            maxLength={30}
          />
          <label htmlFor="confirmation-wa">Nomor WhatsApp aktif</label>
          <input
            id="confirmation-wa"
            name="wa_number"
            type="tel"
            value={waNumber}
            onChange={(e) => setWaNumber(e.target.value)}
            required
            placeholder="Contoh: +886912345678"
          />
          <label htmlFor="confirmation-proof">Foto bukti pembayaran</label>
          <input
            id="confirmation-proof"
            onChange={handleProofChange}
            name="proof"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            required
            aria-describedby="proof-help"
          />
          <small id="proof-help">JPG, PNG, atau WebP. Maksimal 5 MB.</small>
          {proofPreview && (
            <img
              className="proof-preview"
              src={proofPreview}
              alt="Bukti pembayaran yang dipilih"
            />
          )}
          <label htmlFor="confirmation-note">Keterangan</label>
          <textarea
            id="confirmation-note"
            name="note"
            rows={3}
            maxLength={1000}
            placeholder="Contoh: nama pengirim berbeda dari nama mahasiswa"
          ></textarea>
          <button
            type="submit"
            disabled={submitting}
            className="button button-blue"
          >
            {submitting
              ? "Mengirim konfirmasi…"
              : "Kirim Konfirmasi Pembayaran"}
          </button>
          <p role="status">{message}</p>
        </form>
      </dialog>
      <dialog
        className="dialog"
        id="contact-dialog"
        aria-labelledby="contact-dialog-title"
      >
        <div className="dialog-top">
          <strong>Bantuan pembayaran SALUT Taiwan</strong>
          <button type="button" className="close-dialog" aria-label="Tutup">
            <svg
              width="19"
              height="19"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
            >
              <path d="m6 6 12 12M18 6 6 18"></path>
            </svg>
          </button>
        </div>
        <h2 id="contact-dialog-title">Bantuan bendahara</h2>
        <p id="contact-dialog-copy">
          SALUT Taiwan membantu kendala akun dan pertanyaan layanan mahasiswa.
        </p>
        <p className="dialog-note" id="contact-placeholder">
          Kontak langsung bendahara sedang diperbarui. Hubungi SALUT Taiwan
          untuk diarahkan kepada bendahara.
        </p>
        <button type="button" className="button button-blue close-dialog">
          Tutup
        </button>
      </dialog>
      <div className="toast" id="toast" role="status" aria-live="polite" hidden>
        Foto ditambahkan. Unduh HTML untuk menyimpan hasilnya.
      </div>
    </div>
  );
}

const SALUT_CSS =
  ".salut-page{--navy:#12355a;--blue:#134c97;--gold:#f4cb55;--ink:#203950;--body:#53657a;--line:#dfe7f0;--muted:#66798f}\n.salut-page *{box-sizing:border-box}\n.salut-page{scroll-behavior:smooth;scroll-padding-top:95px}\n.salut-page{margin:0;font-family:Inter,-apple-system,BlinkMacSystemFont,\"Segoe UI\",Arial,sans-serif;color:var(--ink);line-height:1.65;background:white}\n.salut-page a{color:inherit;text-decoration:none}\n.salut-page button,.salut-page input{font:inherit}\n.salut-page button,.salut-page summary,.salut-page label.upload{cursor:pointer}\n.salut-page button,.salut-page a,.salut-page summary{touch-action:manipulation}\n.salut-page button:focus-visible,.salut-page a:focus-visible,.salut-page summary:focus-visible,.salut-page label.upload:focus-within{outline:3px solid #6195dc;outline-offset:4px}\n.salut-page h1,.salut-page h2,.salut-page h3,.salut-page p{margin:0}\n.salut-page h1,.salut-page h2,.salut-page h3{color:var(--navy);line-height:1.25;letter-spacing:-.03em}\n.salut-page p{color:var(--body)}\n.salut-page svg{display:block;flex-shrink:0}\n.salut-page img{display:block;max-width:100%}\n.salut-page [hidden]{display:none!important}\n.salut-page .wrap{width:min(1080px,calc(100% - 64px));margin:auto}\n.salut-page .previewbar{background:#0b2643;color:#d6e4f4;font-size:11px}\n.salut-page .previewbar .wrap{display:flex;justify-content:space-between;align-items:center;min-height:31px;gap:12px}\n.salut-page .previewbar span,.salut-page .download{display:flex;align-items:center;gap:7px}\n.salut-page .previewbar strong{font-size:9px;letter-spacing:.06em;border:1px solid #657b94;padding:0 5px;border-radius:3px}\n.salut-page .download{background:none;border:0;padding:7px 0;color:white;font-size:11px}\n.salut-page .header{background:#fffffff5;backdrop-filter:blur(12px);border-bottom:1px solid var(--line);position:sticky;top:0;z-index:20}\n.salut-page .header .wrap{display:flex;align-items:center;justify-content:space-between;gap:22px;min-height:77px}\n.salut-page .brand img{width:157px;height:55px;object-fit:contain}\n.salut-page .brand-fallback{font-size:20px;font-weight:800;color:var(--blue)}\n.salut-page .nav{display:flex;gap:25px;font-size:13px;font-weight:600}\n.salut-page .nav a:hover,.salut-page .nav .active{color:var(--blue)}\n.salut-page .button{display:inline-flex;align-items:center;justify-content:center;gap:12px;border:1px solid transparent;border-radius:8px;padding:12px 18px;font-size:13px;font-weight:650;line-height:1.5;min-height:44px}\n.salut-page .button:hover{filter:brightness(.96)}\n.salut-page .button-blue{color:white;background:var(--blue)}\n.salut-page .button-gold{background:var(--gold);color:#143355}\n.salut-page .button-ghost{color:var(--blue);border-color:var(--line);background:white}\n.salut-page .menu-toggle{display:none;background:white;border:1px solid var(--line);border-radius:7px;padding:8px;color:var(--navy)}\n.salut-page .kicker{color:var(--blue);text-transform:uppercase;font-size:10px;letter-spacing:.12em;font-weight:750;margin-bottom:10px}\n.salut-page .hero{background:linear-gradient(115deg,#f7faff,#f0f5fb);padding:45px 0}\n.salut-page .hero-grid{display:grid;grid-template-columns:1.3fr .8fr;align-items:center;gap:65px}\n.salut-page h1{font-size:clamp(30px,3.5vw,42px);font-weight:750}\n.salut-page .hero-description{font-size:15px;max-width:545px;line-height:1.8;margin:16px 0 22px}\n.salut-page .fee-card{padding:27px 29px;border-radius:18px;background:var(--navy);color:white;box-shadow:0 14px 30px #102f5915}\n.salut-page .fee-label{font-size:11px;color:#ccdbee}\n.salut-page .price{font-size:19px;color:var(--gold);line-height:1.2;margin:12px 0 16px}\n.salut-page .price strong{font-size:49px;letter-spacing:-.04em;font-weight:750}\n.salut-page .fee-card p{font-size:12px;color:#c8d7e9;line-height:1.9}\n.salut-page .fee-card p strong{font-weight:650;color:white}\n.salut-page .fee-link{display:flex;justify-content:space-between;font-size:12px;border-top:1px solid #ffffff26;padding-top:14px;margin-top:19px;color:var(--gold)}\n.salut-page h2{font-size:29px}\n.salut-page .allocation{padding:38px 0 35px}\n.salut-page .allocation-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px;margin-top:23px}\n.salut-page .allocation-card{display:grid;grid-template-columns:39px minmax(0,1fr);gap:15px;padding:19px 21px;background:#f7f9fc;border:1px solid #e5ebf3;border-radius:12px}\n.salut-page .icon-box{display:flex;align-items:center;justify-content:center;background:#eaf1fa;color:var(--blue);width:39px;height:39px;border-radius:10px}\n.salut-page .icon-box svg{width:23px;height:23px}\n.salut-page .allocation-card h3{font-size:15px;letter-spacing:-.015em;line-height:1.4}\n.salut-page .allocation-card p{font-size:13px;line-height:1.75;margin-top:6px}\n.salut-page .gallery-section{padding:30px 0 37px;border-top:1px solid var(--line)}\n.salut-page .section-heading{display:flex;align-items:center;justify-content:space-between;gap:20px}\n.salut-page .gallery-heading-right{display:flex;align-items:center;gap:10px}\n.salut-page .gallery-heading-right .button{padding:8px 12px;min-height:38px;font-size:11px}\n.salut-page .gallery-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-top:22px}\n.salut-page .photo-card{min-width:0}\n.salut-page .photo-frame{position:relative;overflow:hidden;border-radius:11px;isolation:isolate;background:#edf2f9;aspect-ratio:1.2}\n.salut-page .empty-photo{position:absolute;inset:0;border:1px dashed #becde0;border-radius:11px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:9px;text-align:center;padding:15px;background:linear-gradient(140deg,#eaf0f9,#f6f8fc)}\n.salut-page .photo-symbol{color:#6884a7}\n.salut-page .empty-photo strong{font-size:11px;line-height:1.4;color:#526c8d}\n.salut-page .empty-photo small{display:none}\n.salut-page .event-photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}\n.salut-page .photo-caption{display:none;position:absolute;bottom:35px;left:12px;right:12px;z-index:2;color:white;line-height:1.4;font-size:11px}\n.salut-page .has-photo .photo-caption{display:block}\n.salut-page .has-photo:after{content:\"\";position:absolute;z-index:1;inset:20% 0 0;background:linear-gradient(transparent,#0b2643c9);pointer-events:none}\n.salut-page .upload{position:absolute;inset:0;z-index:3;display:flex;align-items:flex-end;justify-content:flex-end;padding:9px}\n.salut-page .upload>span{display:flex;align-items:center;gap:5px;padding:4px 7px;background:#fffffff0;border:1px solid #d4deec;border-radius:6px;font-size:10px;color:var(--navy)}\n.salut-page .upload input{position:absolute;opacity:0;width:1px;height:1px}\n.salut-page .gallery-note{display:flex;align-items:flex-start;gap:7px;font-size:10px;color:var(--muted);margin-top:11px}\n.salut-page .gallery-note svg{margin-top:2px}\n.salut-page .payment-section{padding:36px 0;background:var(--navy);color:white}\n.salut-page .payment-section h2,.salut-page .payment-section h3{color:white}\n.salut-page .payment-section .kicker{color:var(--gold)}\n.salut-page .payment-grid{display:grid;grid-template-columns:1.2fr .85fr;gap:65px}\n.salut-page .payment-intro{font-size:13px;color:#cfdbeb;margin-top:9px;max-width:460px}\n.salut-page .payment-steps{list-style:none;padding:0;margin:22px 0;counter-reset:steps;display:grid;gap:14px}\n.salut-page .payment-steps li{counter-increment:steps;position:relative;padding-left:39px;min-height:30px}\n.salut-page .payment-steps li:before{content:counter(steps);position:absolute;left:0;top:0;border:1px solid #ffffff50;border-radius:50%;width:25px;height:25px;display:flex;align-items:center;justify-content:center;font-size:11px;color:var(--gold)}\n.salut-page .payment-steps strong{display:block;font-size:13px;line-height:1.6;font-weight:650}\n.salut-page .payment-steps span{display:block;font-size:12px;color:#c7d5e8}\n.salut-page .payment-actions{display:flex;gap:16px;align-items:center;flex-wrap:wrap}\n.salut-page .payment-secondary{border:0;border-bottom:1px solid #ffffff55;padding:5px 0;color:white;background:none;font-size:12px}\n.salut-page .preview-note{font-size:10px;color:#bed0e5;margin-top:13px}\n.salut-page .payment-help{padding-top:9px}\n.salut-page .payment-help h3{font-size:17px;margin-bottom:15px}\n.salut-page .payment-help details{border-top:1px solid #ffffff26}\n.salut-page .payment-help details:last-of-type{border-bottom:1px solid #ffffff26}\n.salut-page .payment-help summary{list-style:none;padding:14px 25px 14px 0;font-size:12px;font-weight:600;position:relative}\n.salut-page .payment-help summary::-webkit-details-marker{display:none}\n.salut-page .payment-help summary:after{content:'+';position:absolute;right:3px;font-size:17px;top:10px;color:var(--gold)}\n.salut-page .payment-help details[open] summary:after{content:'−'}\n.salut-page .payment-help details p{font-size:12px;line-height:1.8;color:#cfdbeb;padding:0 12px 15px 0}\n.salut-page .payment-help>.payment-secondary{margin-top:18px}\n.salut-page .footer{padding:20px 0}\n.salut-page .footer .wrap{display:flex;justify-content:space-between;gap:20px;color:var(--muted);font-size:10px}\n.salut-page .footer strong{color:var(--navy);font-size:12px}\n.salut-page .mobile-payment{display:none}\n.salut-page .toast{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#0b2643;color:white;padding:10px 17px;border-radius:8px;z-index:100;font-size:12px;max-width:calc(100% - 30px)}\n.salut-page .dialog{border:0;border-radius:17px;width:min(500px,calc(100% - 32px));max-height:85vh;overflow:auto;padding:28px;color:var(--ink)}\n.salut-page .dialog::backdrop{background:#071c35a6;backdrop-filter:blur(3px)}\n.salut-page .dialog-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:17px}\n.salut-page .dialog-top strong{font-size:11px;color:var(--blue)}\n.salut-page .close-dialog{background:#eef3fa;border:0;border-radius:6px;padding:6px}\n.salut-page .dialog h2{font-size:25px;margin-bottom:14px}\n.salut-page .dialog p,.salut-page .dialog li{font-size:13px;line-height:1.8}\n.salut-page .dialog ol{padding-left:20px;color:var(--body)}\n.salut-page .dialog-note{background:#fff8e1;padding:12px;margin:17px 0;border-radius:8px;color:#69582b}\n.salut-page .dialog .button{width:100%;margin-top:10px}\n.salut-page .skip{position:absolute;top:-90px;left:15px;padding:10px;background:var(--blue);color:white;z-index:100}\n.salut-page .skip:focus{top:5px}\n@media(max-width:800px){.salut-page .wrap{width:calc(100% - 40px)}\n.salut-page .header>.wrap>.button{display:none}\n.salut-page .hero-grid{gap:25px}\n.salut-page .hero h1{font-size:33px}\n.salut-page .nav{font-size:12px;gap:17px}\n.salut-page .payment-grid{gap:30px}\n.salut-page .gallery-grid{gap:9px}\n.salut-page .fee-card{padding:23px}\n.salut-page .price strong{font-size:43px}}\n@media(max-width:600px){.salut-page{scroll-padding-top:82px}\n.salut-page .wrap{width:calc(100% - 36px)}\n.salut-page .previewbar .preview-caption{font-size:9px}\n.salut-page .previewbar span{gap:5px}\n.salut-page .header .wrap{min-height:67px}\n.salut-page .brand img{width:139px;height:48px}\n.salut-page .menu-toggle{display:block}\n.salut-page .nav{display:none;position:absolute;top:67px;left:0;right:0;padding:12px 18px;background:white;border-bottom:1px solid var(--line)}\n.salut-page .nav.open{display:grid;gap:0}\n.salut-page .nav a{padding:11px}\n.salut-page .hero{padding:27px 0}\n.salut-page .hero-grid{grid-template-columns:1fr;gap:23px}\n.salut-page .hero h1{font-size:30px}\n.salut-page .hero-description{font-size:14px;margin:12px 0 16px;line-height:1.75}\n.salut-page .hero .button{font-size:12px;padding:10px 14px;min-height:41px}\n.salut-page .fee-card{padding:21px 23px;border-radius:14px}\n.salut-page .fee-label{font-size:10px}\n.salut-page .price{margin:8px 0 10px}\n.salut-page .price strong{font-size:43px}\n.salut-page .fee-card p{font-size:12px;line-height:1.8}\n.salut-page .fee-link{padding-top:11px;margin-top:12px;font-size:11px}\n.salut-page h2{font-size:24px}\n.salut-page .allocation{padding:27px 0}\n.salut-page .allocation-grid{grid-template-columns:1fr;gap:9px;margin-top:17px}\n.salut-page .allocation-card{padding:15px;gap:12px;grid-template-columns:35px minmax(0,1fr)}\n.salut-page .icon-box{width:35px;height:35px}\n.salut-page .allocation-card h3{font-size:14px}\n.salut-page .allocation-card p{font-size:12px;line-height:1.7;margin-top:5px}\n.salut-page .gallery-section{padding:25px 0}\n.salut-page .gallery-section h2{font-size:22px}\n.salut-page .gallery-section .kicker{margin-bottom:7px}\n.salut-page .gallery-heading-right .button{padding:7px 9px;font-size:10px;min-height:34px;gap:5px}\n.salut-page .gallery-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin-top:17px}\n.salut-page .photo-frame{aspect-ratio:1.25}\n.salut-page .empty-photo{padding:10px;gap:7px}\n.salut-page .empty-photo strong{font-size:10px}\n.salut-page .gallery-note{font-size:10px;line-height:1.6}\n.salut-page .payment-section{padding:28px 0}\n.salut-page .payment-grid{grid-template-columns:1fr;gap:25px}\n.salut-page .payment-steps{gap:14px;margin:20px 0}\n.salut-page .payment-help{padding-top:0}\n.salut-page .payment-help h3{font-size:16px}\n.salut-page .payment-actions{gap:12px}\n.salut-page .payment-actions .button{font-size:12px;padding:11px 14px}\n.salut-page .payment-secondary{font-size:11px}\n.salut-page .footer{padding:18px 0 95px}\n.salut-page .footer .wrap{display:block;font-size:9px}\n.salut-page .footer .wrap>div+div{margin-top:8px}\n.salut-page .mobile-payment{display:flex;align-items:center;justify-content:space-between;gap:10px;position:fixed;bottom:0;left:0;right:0;background:#fffffff7;border-top:1px solid var(--line);backdrop-filter:blur(10px);padding:11px 18px calc(11px + env(safe-area-inset-bottom));z-index:21}\n.salut-page .mobile-payment strong{display:block;font-size:16px;line-height:1.3;color:var(--navy)}\n.salut-page .mobile-payment small{font-size:9px;color:var(--muted);display:block;margin-top:3px}\n.salut-page .mobile-payment .button{font-size:11px;padding:9px 12px;min-height:39px}\n.salut-page .toast{bottom:87px}\n.salut-page .dialog{padding:24px}}\n@media(prefers-reduced-motion:reduce){.salut-page{scroll-behavior:auto}}\n@media print{.salut-page .previewbar,.salut-page .header,.salut-page .mobile-payment,.salut-page .upload,.salut-page .gallery-heading-right,.salut-page .hero .button,.salut-page .payment-actions,.salut-page dialog{display:none!important}\n.salut-page .hero,.salut-page .allocation,.salut-page .gallery-section,.salut-page .payment-section{padding:18px 0}\n.salut-page .wrap{width:100%}\n.salut-page .allocation-card,.salut-page .photo-card{break-inside:avoid}\n.salut-page{print-color-adjust:exact;-webkit-print-color-adjust:exact}}\n.salut-page .community-card{padding:29px;border-radius:18px;background:var(--navy);color:white;box-shadow:0 14px 30px #102f5915}\n.salut-page .community-label{font-size:9px;letter-spacing:.1em;color:#ccdbed;margin-bottom:14px;line-height:1.7;font-weight:650}\n.salut-page .community-card h2{color:var(--gold);font-size:27px;line-height:1.3}\n.salut-page .community-card p{font-size:12px;line-height:1.85;margin-top:15px;color:#d4e0ef}\n.salut-page .allocation{background:#f4f7fc;border-top:1px solid var(--line);padding:35px 0}\n.salut-page .allocation-intro{font-size:13px;line-height:1.8;margin-top:12px;max-width:660px}\n.salut-page .allocation-grid{align-items:start}\n.salut-page .allocation-card{background:white;padding:20px;border-color:#e2e9f2}\n.salut-page .allocation-note{font-size:11px;line-height:1.8;color:var(--muted);margin-top:17px;max-width:780px}\n.salut-page .service-details{margin-top:11px}\n.salut-page .service-details summary{font-size:11px;font-weight:650;list-style:none;color:var(--blue);display:flex;justify-content:space-between;gap:10px;line-height:1.6;padding:5px 0}\n.salut-page .service-details summary::-webkit-details-marker{display:none}\n.salut-page .service-details summary:after{content:'+';font-size:16px;line-height:1}\n.salut-page .service-details[open] summary:after{content:'−'}\n.salut-page .service-details ul{padding:12px 0 0 16px;margin:8px 0 0;border-top:1px solid var(--line);font-size:12px;color:var(--body);line-height:1.8}\n.salut-page .service-details li+li{margin-top:9px}\n.salut-page .service-details li strong{color:var(--navy);font-weight:650}\n.salut-page .contribution-amount{display:flex;align-items:center;gap:22px;padding:17px 0;margin:4px 0 12px;border-bottom:1px solid #ffffff26}\n.salut-page .contribution-amount>strong{font-size:31px;letter-spacing:-.03em;color:var(--gold);white-space:nowrap;line-height:1.3}\n.salut-page .contribution-amount>span{font-size:11px;color:#d1deed;line-height:1.8}\n.salut-page .steps-heading{font-size:13px!important;letter-spacing:0;margin-top:16px}\n.salut-page .payment-help{padding-top:6px}\n@media(max-width:600px){.salut-page .hero-grid{gap:20px}\n.salut-page .community-card{padding:23px}\n.salut-page .community-card h2{font-size:24px}\n.salut-page .community-card p{margin-top:12px}\n.salut-page .community-label{margin-bottom:11px;font-size:9px}\n.salut-page .allocation{padding:28px 0}\n.salut-page .allocation-card{padding:16px}\n.salut-page .allocation-card h3{font-size:14px}\n.salut-page .allocation-intro{font-size:12px}\n.salut-page .service-details{margin-top:9px}\n.salut-page .service-details summary{font-size:11px}\n.salut-page .contribution-amount{display:block;padding:15px 0}\n.salut-page .contribution-amount>strong{display:block;font-size:32px}\n.salut-page .contribution-amount>span{display:block;margin-top:7px;font-size:11px}\n.salut-page .mobile-payment strong{font-size:13px}\n.salut-page .mobile-payment small{font-size:8px}\n.salut-page .mobile-payment .button{font-size:10px;padding:9px 10px}\n.salut-page .payment-help{padding-top:0}}\n.salut-page .hero{background-color:#0d2b49;background-image:linear-gradient(90deg,rgba(5,24,45,.89) 0%,rgba(6,27,49,.73) 45%,rgba(6,27,49,.30) 100%),url(\"/images/salut/wisuda-hero.jpg\");background-size:cover;background-position:center 54%;padding:65px 0;min-height:470px;display:grid;align-items:center;border-top:0}\n.salut-page .hero h1{color:#fff;text-shadow:0 2px 18px #00162d30}\n.salut-page .hero .kicker{color:#f6d477}\n.salut-page .hero-description{color:#ecf2fa;text-shadow:0 1px 8px #00162d40}\n.salut-page .hero .button-blue{background:#f4cb55;color:#143355;box-shadow:0 6px 20px #00132620}\n.salut-page .hero .fee-card{background:rgba(9,35,62,.88);backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px);border:1px solid #ffffff2e;box-shadow:0 16px 36px #00152b33}\n.salut-page .hero .fee-label{color:#e0eaf6}\n.salut-page .hero .fee-card p{color:#dce6f2}\n.salut-page .hero .fee-link{color:#f9d778}\n@media(max-width:800px){.salut-page .hero{padding:48px 0;min-height:430px}\n.salut-page .hero-grid{gap:30px}}\n@media(max-width:600px){.salut-page .hero{padding:32px 0;min-height:0;background-position:53% center}\n.salut-page .hero-grid{gap:22px}\n.salut-page .hero-description{color:#f0f4fa}\n.salut-page .hero .fee-card{background:rgba(9,35,62,.90)}}\n@media print{.salut-page .hero{padding:25px 0;min-height:0}}\n.salut-page .payment-steps a{color:#f8d66a;text-decoration:underline;text-underline-offset:3px;font-weight:650}\n.salut-page .payment-actions .button-confirm{background:#ffffff0b;border:1px solid #ffffff75;color:#fff}\n.salut-page .support-block{margin-top:28px;padding-top:22px;border-top:1px solid #ffffff33}\n.salut-page .support-block h3{font-size:19px;letter-spacing:-.015em}\n.salut-page .support-block p{font-size:12px;color:#d5e1ef;line-height:1.8;margin-top:10px}\n.salut-page .support-actions{display:grid;gap:11px;margin-top:16px}\n.salut-page .support-button{display:flex;justify-content:space-between;gap:12px;width:100%;min-height:48px;text-align:left;background:#fff;color:#143355!important;font-size:13px!important;font-weight:700;border:1px solid #fff}\n.salut-page .support-button span{font-size:17px;color:#134c97}\n.salut-page .bank-amount{background:#eef4fc;border-radius:11px;padding:16px 19px;margin:20px 0}\n.salut-page .bank-amount span,.salut-page .bank-amount small{display:block;color:var(--body);font-size:11px}\n.salut-page .bank-amount strong{display:block;color:var(--blue);font-size:29px;line-height:1.5}\n.salut-page .bank-details{border:1px solid var(--line);border-radius:11px;margin:17px 0}\n.salut-page .bank-details>div{padding:12px 16px}\n.salut-page .bank-details>div+div{border-top:1px solid var(--line)}\n.salut-page .bank-details dt{font-size:10px;color:var(--muted)}\n.salut-page .bank-details dd{margin:4px 0 0;font-size:13px;font-weight:600;color:var(--navy);overflow-wrap:anywhere}\n.salut-page #confirmation-form{margin-top:20px}\n.salut-page #confirmation-form label{display:block;font-size:12px;font-weight:650;color:var(--navy);margin:15px 0 7px}\n.salut-page #confirmation-form input,.salut-page #confirmation-form textarea{width:100%;border:1px solid #bdcbdd;border-radius:8px;padding:10px 12px;font:inherit;font-size:13px;color:var(--ink);background:#fff;box-sizing:border-box}\n.salut-page #confirmation-form textarea{resize:vertical;min-height:90px}\n.salut-page #confirmation-form input[type=file]{font-size:11px;padding:10px}\n.salut-page #confirmation-form input:focus-visible,.salut-page #confirmation-form textarea:focus-visible{outline:3px solid #8ab4eb;outline-offset:2px}\n.salut-page #proof-help{display:block;font-size:10px;color:var(--muted);margin-top:5px}\n.salut-page #confirmation-proof-preview{width:100%;max-height:230px;object-fit:contain;background:#f3f6fa;border-radius:8px;margin-top:12px}\n.salut-page #confirmation-feedback{background:#edf4fc;border-left:3px solid #134c97;padding:13px;font-size:12px;color:#173a62;margin-top:14px}\n@media(max-width:600px){.salut-page .payment-actions{display:grid;grid-template-columns:1fr;gap:10px}\n.salut-page .payment-actions .button{width:100%;font-size:13px;min-height:46px}\n.salut-page .support-block h3{font-size:18px}\n.salut-page .support-block{margin-top:25px}\n.salut-page .support-button{font-size:12px!important;min-height:48px}\n.salut-page .payment-steps span{line-height:1.8}}\n.salut-page .bank-details .account-number{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:16px;letter-spacing:.02em}\n.salut-page{width:100%;max-width:none;margin:0}.salut-page .status-notice{padding:14px 16px;background:#ffffff14;border:1px solid #ffffff40;border-radius:9px;color:#fff;font-size:14px;margin:18px 0}.salut-page .form-error{padding:12px;border:1px solid #e4a0a0;background:#fff1f1;color:#8b2020;border-radius:8px}.salut-page .proof-preview{max-height:230px;object-fit:contain;width:100%;margin-top:10px}.salut-page .button:disabled{opacity:.6;cursor:wait}.salut-page .dialog-note:empty{display:none}\n";
