// ============================================================================
// RETIRU · Administrator panel layout — /administrator (sin Header público)
// ============================================================================

import type { Metadata } from 'next';
import AdminShell from './AdminShell';

export const metadata: Metadata = {
  title: 'Panel de administración | Retiru',
  description: 'Panel de administración de Retiru',
  robots: { index: false, follow: false },
};

export default function AdministratorLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
