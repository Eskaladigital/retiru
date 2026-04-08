import type { ReactNode } from 'react';

type Props = {
  email: string | null | undefined;
  /** Clases del enlace; por defecto estilo enlazable estándar */
  className?: string;
  /** Contenido visible; por defecto el propio email */
  children?: ReactNode;
  /** Si no hay email válido */
  emptyLabel?: ReactNode;
};

/**
 * Enlace mailto: para cualquier email mostrado en UI (tablas, fichas, admin).
 */
export function EmailLink({
  email,
  className = 'text-terracotta-600 hover:underline break-all',
  children,
  emptyLabel = '—',
}: Props) {
  const trimmed = (email || '').trim();
  if (!trimmed) {
    return <span className="text-inherit">{emptyLabel}</span>;
  }
  return (
    <a href={`mailto:${trimmed}`} className={className}>
      {children ?? trimmed}
    </a>
  );
}
