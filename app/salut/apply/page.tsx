import { redirect } from 'next/navigation';

export default function SalutApplyPage() {
  redirect('/salut?confirm=1');
}
