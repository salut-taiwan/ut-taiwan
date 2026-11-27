import { expect, test, vi } from 'vitest';
import SalutApplyPage from './page';
const redirect=vi.hoisted(()=>vi.fn(()=>{throw new Error('redirected');}));
vi.mock('next/navigation',()=>({redirect}));
test('old SALUT application links lead to the new confirmation flow',()=>{expect(()=>SalutApplyPage()).toThrow('redirected');expect(redirect).toHaveBeenCalledWith('/salut?confirm=1');});
