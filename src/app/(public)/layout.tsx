// ============================================================================
// RETIRU · Layout público único — Header + Footer para /es y /en
// ============================================================================

import PublicShell from './PublicShell';
import { getCurrentUserForHeader } from '@/lib/supabase/server';

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUserForHeader();
  return <PublicShell user={user}>{children}</PublicShell>;
}
