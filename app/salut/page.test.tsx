import { beforeEach, afterEach, describe, expect, test, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import SalutPage from './page';
const mocks=vi.hoisted(()=>({user:null as null|{id:string},push:vi.fn(),getFees:vi.fn(),getMe:vi.fn(),getStatus:vi.fn(),upload:vi.fn(),apply:vi.fn()}));
vi.mock('next/navigation',()=>({useRouter:()=>({push:mocks.push})}));
vi.mock('@/lib/auth',()=>({useAuth:()=>({user:mocks.user,isLoading:false})}));
vi.mock('@/lib/api',()=>({api:{config:{getFees:mocks.getFees},auth:{getMe:mocks.getMe},salut:{getStatus:mocks.getStatus,uploadProof:mocks.upload,apply:mocks.apply}}}));
const profile={id:'u-test',name:'Mahasiswa Uji',nim:'000000001',phone:'+886900000001',current_semester:3};
const status={effective_status:'none',is_member:false,is_pending:false};
beforeEach(()=>{vi.clearAllMocks();mocks.user={id:'u-test'};mocks.getFees.mockResolvedValue({salutMembership:{billing:'once_per_study'}});mocks.getMe.mockResolvedValue(profile);mocks.getStatus.mockResolvedValue(status);mocks.upload.mockResolvedValue({url:'u-test/proof.jpg'});mocks.apply.mockResolvedValue({message:'ok'});HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};URL.createObjectURL=vi.fn(()=> 'blob:test');URL.revokeObjectURL=vi.fn();});
afterEach(cleanup);
async function ready(){render(<SalutPage/>);await waitFor(()=>expect(screen.getByRole('button',{name:'Lanjutkan Pembayaran'})).toHaveAttribute('aria-busy','false'));}
async function confirm(){await ready();fireEvent.click(screen.getByRole('button',{name:'Konfirmasi Pembayaran'}));await waitFor(()=>expect(document.querySelector('#confirmation-dialog')).toHaveAttribute('open'));}
describe('SALUT once-per-study payment flow',()=>{
 test('the selected headline, contribution and photographs render',async()=>{await ready();expect(screen.getByRole('heading',{level:1})).toHaveTextContent('Kontribusi OperasionalSALUT Taiwan');expect(screen.getByAltText('Foto kegiatan OSMB SALUT Taiwan')).toBeVisible();});
 test('an unauthenticated student sees a visible login prompt with a return destination',async()=>{mocks.user=null;await ready();fireEvent.click(screen.getByRole('button',{name:'Lanjutkan Pembayaran'}));expect(document.querySelector('#payment-feedback-dialog')).toHaveAttribute('open');expect(screen.getByRole('link',{name:'Masuk untuk melanjutkan'})).toHaveAttribute('href','/login?redirect=%2Fsalut%3Fconfirm%3D1');});
 test('payment opens the exact PostBank details, separately from confirmation',async()=>{await ready();fireEvent.click(screen.getByRole('button',{name:'Lanjutkan Pembayaran'}));expect(document.querySelector('#payment-dialog')).toHaveAttribute('open');expect(document.querySelector('#payment-dialog')).toHaveTextContent('700-00011311204391');expect(document.querySelector('#confirmation-dialog')).not.toHaveAttribute('open');});
 test('confirmation uses the authenticated student identity',async()=>{await confirm();expect(screen.getByLabelText('Nama lengkap')).toHaveValue(profile.name);expect(screen.getByLabelText('NIM')).toHaveValue(profile.nim);expect(screen.getByLabelText('NIM')).toHaveAttribute('readonly');});
 test.each(['approved','pending','expired'])('a %s record cannot open another payment form',async s=>{mocks.getStatus.mockResolvedValue({...status,effective_status:s});await ready();fireEvent.click(screen.getByRole('button',{name:'Konfirmasi Pembayaran'}));expect(document.querySelector('#confirmation-dialog')).not.toHaveAttribute('open');expect(document.querySelector('#payment-feedback-dialog')).toHaveAttribute('open');});
 test('a backend still using semester billing cannot accept a contribution',async()=>{mocks.getFees.mockResolvedValue({salutMembership:{}});await ready();fireEvent.click(screen.getByRole('button',{name:'Lanjutkan Pembayaran'}));expect(document.querySelector('#payment-dialog')).not.toHaveAttribute('open');expect(screen.getByText('Pembayaran belum tersedia. Hubungi SALUT Taiwan untuk bantuan.')).toBeVisible();});
 test('the upload and confirmation preserve the note and current semester',async()=>{await confirm();const file=new File(['receipt'],'receipt.png',{type:'image/png'});fireEvent.change(screen.getByLabelText('Foto bukti pembayaran'),{target:{files:[file]}});fireEvent.change(screen.getByLabelText('Keterangan'),{target:{value:'Nama pengirim berbeda'}});fireEvent.submit(document.querySelector('#confirmation-form')!);await waitFor(()=>expect(mocks.apply).toHaveBeenCalledWith('u-test/proof.jpg',3,profile.phone,'Nama pengirim berbeda'));expect(await screen.findByText(/Konfirmasi pembayaran Anda sudah diterima/)).toBeVisible();});
 test('a failed confirmation can retry without uploading the same proof twice',async()=>{mocks.apply.mockRejectedValueOnce(new Error('Koneksi terganggu')).mockResolvedValueOnce({message:'ok'});await confirm();const file=new File(['receipt'],'receipt.png',{type:'image/png'});fireEvent.change(screen.getByLabelText('Foto bukti pembayaran'),{target:{files:[file]}});fireEvent.submit(document.querySelector('#confirmation-form')!);await screen.findByText('Koneksi terganggu');fireEvent.submit(document.querySelector('#confirmation-form')!);await waitFor(()=>expect(mocks.apply).toHaveBeenCalledTimes(2));expect(mocks.upload).toHaveBeenCalledTimes(1);});
});

test('a missing NIM gives visible feedback and a profile link',async()=>{mocks.getMe.mockResolvedValue({...profile,nim:null});await ready();fireEvent.click(screen.getByRole('button',{name:'Konfirmasi Pembayaran'}));expect(document.querySelector('#payment-feedback-dialog')).toHaveAttribute('open');expect(screen.getByRole('link',{name:'Lengkapi NIM di profil'})).toHaveAttribute('href','/profile');expect(document.querySelector('#confirmation-dialog')).not.toHaveAttribute('open');});
test('confirmation responds while account data is still loading',async()=>{mocks.getMe.mockReturnValue(new Promise(()=>{}));render(<SalutPage/>);fireEvent.click(screen.getByRole('button',{name:'Konfirmasi Pembayaran'}));expect(document.querySelector('#payment-feedback-dialog')).toHaveAttribute('open');expect(screen.getByText('Mohon tunggu sampai data akun selesai dimuat.')).toBeVisible();});


describe('payment data readiness and failures', () => {
  test('a slow fee response stays busy and a click gives feedback until data arrives', async () => {
    let finish!: (data: { salutMembership: { billing: string } }) => void;
    mocks.getFees.mockReturnValue(new Promise(resolve => { finish = resolve; }));
    render(<SalutPage />);
    const button = screen.getByRole('button', { name: 'Lanjutkan Pembayaran' });
    expect(button).toHaveAttribute('aria-busy', 'true');
    fireEvent.click(button);
    expect(document.querySelector('#payment-feedback-dialog')).toHaveAttribute('open');
    expect(document.querySelector('#payment-dialog')).not.toHaveAttribute('open');
    await act(async () => finish({ salutMembership: { billing: 'once_per_study' } }));
    await waitFor(() => expect(button).toHaveAttribute('aria-busy', 'false'));
    fireEvent.click(button);
    expect(document.querySelector('#payment-dialog')).toHaveAttribute('open');
    expect(document.querySelector('#payment-feedback-dialog')).not.toHaveAttribute('open');
  });

  test('fee service failure is explained without exposing a transfer form', async () => {
    mocks.getFees.mockRejectedValue(new Error('offline'));
    await ready();
    expect(screen.getByText(/Informasi pembayaran belum dapat dimuat/)).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Lanjutkan Pembayaran' }));
    expect(document.querySelector('#payment-feedback-dialog')).toHaveAttribute('open');
    expect(document.querySelector('#payment-dialog')).not.toHaveAttribute('open');
  });

  test('profile failure gives a visible recovery message', async () => {
    mocks.getMe.mockRejectedValue(new Error('offline'));
    await ready();
    fireEvent.click(screen.getByRole('button', { name: 'Konfirmasi Pembayaran' }));
    expect(screen.getByText('Data akun belum dapat dimuat. Silakan muat ulang halaman.')).toBeVisible();
    expect(document.querySelector('#confirmation-dialog')).not.toHaveAttribute('open');
  });

  test('closing a dialog leaves no invisible active payment modal', async () => {
    await ready();
    fireEvent.click(screen.getByRole('button', { name: 'Lanjutkan Pembayaran' }));
    const dialog = document.querySelector('#payment-dialog')!;
    fireEvent.click(dialog.querySelector('.close-dialog')!);
    expect(dialog).not.toHaveAttribute('open');
  });

  test.each([
    new File(['not an image'], 'receipt.txt', { type: 'text/plain' }),
    new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'receipt.png', { type: 'image/png' }),
  ])('invalid proof is refused before uploading: $name', async file => {
    await confirm();
    fireEvent.change(screen.getByLabelText('Foto bukti pembayaran'), { target: { files: [file] } });
    expect(screen.getByRole('alert')).toHaveTextContent(/maksimal 5 MB/);
    expect(mocks.upload).not.toHaveBeenCalled();
  });

  test('blank WhatsApp contact cannot submit a receipt', async () => {
    await confirm();
    fireEvent.change(document.querySelector('#confirmation-wa')!, { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('Foto bukti pembayaran'), {
      target: { files: [new File(['receipt'], 'receipt.png', { type: 'image/png' })] },
    });
    fireEvent.submit(document.querySelector('#confirmation-form')!);
    expect(screen.getByRole('alert')).toHaveTextContent('Nomor WhatsApp aktif wajib diisi.');
    expect(mocks.upload).not.toHaveBeenCalled();
  });

  test('upload failure keeps the receipt form available for retry', async () => {
    mocks.upload.mockRejectedValue(new Error('Unggah gagal'));
    await confirm();
    fireEvent.change(screen.getByLabelText('Foto bukti pembayaran'), {
      target: { files: [new File(['receipt'], 'receipt.png', { type: 'image/png' })] },
    });
    fireEvent.submit(document.querySelector('#confirmation-form')!);
    expect(await screen.findByRole('alert')).toHaveTextContent('Unggah gagal');
    expect(document.querySelector('#confirmation-dialog')).toHaveAttribute('open');
    expect(mocks.apply).not.toHaveBeenCalled();
  });
});
