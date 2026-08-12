import { test, expect } from '../fixtures';
import { signIn, studentProfile, memberProfile } from '../support/apiStubs';

// Applying for SALUT membership. The admins asked for two things here: a
// WhatsApp number they can actually reach the applicant on, and payment
// details that only appear once someone is logged in and filing an
// application.

test.describe('applying for SALUT', () => {
  test('the form asks for a WhatsApp number and a transfer receipt', async ({ page, api }) => {
    await signIn(page);
    await api({ me: studentProfile });

    await page.goto('/salut/apply');

    await expect(page.getByLabel(/nomor whatsapp aktif/i)).toBeVisible();
    await expect(page.getByText(/grup SALUT/i)).toBeVisible();
  });

  test('the number is prefilled from the profile so nobody retypes it', async ({ page, api }) => {
    await signIn(page);
    await api({ me: { ...studentProfile, phone: '081234567890' } });

    await page.goto('/salut/apply');

    await expect(page.getByLabel(/nomor whatsapp aktif/i)).toHaveValue('081234567890');
  });

  test('nothing can be submitted without both a number and a receipt', async ({ page, api }) => {
    await signIn(page);
    await api({ me: studentProfile });

    await page.goto('/salut/apply');

    await expect(page.getByRole('button', { name: /kirim permohonan/i })).toBeDisabled();
  });

  test('the amount to transfer leads with rupiah, because QRIS is paid in rupiah', async ({ page, api }) => {
    await signIn(page);
    await api({ me: { ...studentProfile, current_semester: 1 } });

    await page.goto('/salut/apply');

    await expect(page.getByText('Rp 952.000')).toBeVisible();
    await expect(page.getByText(/NT\$ 1,700/)).toBeVisible();
  });

  test('a returning student is quoted the returning-member amount', async ({ page, api }) => {
    await signIn(page);
    await api({ me: { ...studentProfile, current_semester: 3 } });

    await page.goto('/salut/apply');

    await expect(page.getByText('Rp 672.000')).toBeVisible();
  });

  test('the QRIS is here, behind the login, where it can be tied to an application', async ({ page, api }) => {
    await signIn(page);
    await api({ me: studentProfile });

    await page.goto('/salut/apply');

    await expect(page.getByRole('img', { name: /qris/i }).first()).toBeVisible();
  });

  test('an application already under review offers no second form', async ({ page, api }) => {
    await signIn(page);
    await api({
      me: studentProfile,
      salutStatus: {
        effective_status: 'pending', salut_status: 'pending',
        is_member: false, is_pending: true,
        salut_applied_at_display: '20 Mei 2026',
      },
    });

    await page.goto('/salut/apply');

    await expect(page.getByText(/sedang diproses/i)).toBeVisible();
    await expect(page.getByLabel(/nomor whatsapp aktif/i)).toHaveCount(0);
  });

  test('a rejected application shows the reason and lets the student try again', async ({ page, api }) => {
    await signIn(page);
    await api({
      me: studentProfile,
      salutStatus: {
        effective_status: 'rejected', salut_status: 'rejected',
        is_member: false, is_pending: false,
        salut_rejection_reason: 'Bukti transfer tidak terbaca',
      },
    });

    await page.goto('/salut/apply');

    await expect(page.getByText('Bukti transfer tidak terbaca')).toBeVisible();
    await expect(page.getByLabel(/nomor whatsapp aktif/i)).toBeVisible();
  });

  test('an approved member is told there is nothing left to do', async ({ page, api }) => {
    await signIn(page);
    await api({
      me: memberProfile,
      salutStatus: {
        effective_status: 'approved', salut_status: 'approved',
        is_member: true, is_pending: false,
      },
    });

    await page.goto('/salut/apply');

    await expect(page.getByText(/sudah anggota salut/i)).toBeVisible();
  });
});
