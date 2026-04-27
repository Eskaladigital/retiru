// ============================================================================
// RETIRU · Contrato del organizador (consulta pública) — /es/legal/contrato-organizador
// Texto íntegro del contrato que cada organizador acepta antes de publicar su
// primer retiro. Las cláusulas viven en src/lib/legal/organizer-contract.tsx.
// ============================================================================

import Link from 'next/link';
import { organizerContractES } from '@/lib/seo/page-metadata';
import {
  CONTRACT_VERSION,
  OrganizerContractClauses,
} from '@/lib/legal/organizer-contract';

export const metadata = organizerContractES;

export default function ContratoOrganizadorPage() {
  return (
    <div className="container-narrow py-12">
      <nav className="mb-8 flex items-center gap-1 text-xs text-muted-foreground">
        <Link href="/es" className="hover:text-terracotta-600">Inicio</Link>
        <span>›</span>
        <Link href="/es/condiciones" className="hover:text-terracotta-600">Condiciones</Link>
        <span>›</span>
        <span className="text-foreground">Contrato del organizador</span>
      </nav>

      <div className="flex items-baseline justify-between flex-wrap gap-3 mb-2">
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground">
          Contrato del organizador
        </h1>
        <span className="text-[11px] uppercase tracking-wider text-[#a09383]">
          Versión {CONTRACT_VERSION}
        </span>
      </div>
      <p className="text-muted-foreground mb-8 leading-relaxed">
        Texto íntegro del contrato que cada organizador acepta electrónicamente desde su panel antes de publicar su primer retiro o evento en Retiru. Lo publicamos aquí para que cualquier persona —asistentes, centros y organizadores— pueda consultarlo abiertamente y sin necesidad de cuenta.
      </p>

      <div className="bg-sand-50 border border-sand-200 rounded-2xl p-5 md:p-6 mb-8 text-sm text-[#5e5247] leading-relaxed">
        <p className="mb-2">
          <strong>¿A quién aplica?</strong> A las personas físicas o jurídicas que crean retiros, escapadas o eventos y los publican en Retiru con su rol de <em>organizador</em>.
        </p>
        <p>
          <strong>¿Qué pasa con los centros del directorio?</strong> Los centros que mantienen su ficha en el directorio firman un acuerdo distinto: el <Link href="/es/legal/contrato-centro" className="text-terracotta-600 font-medium hover:underline">contrato del centro</Link>. Y los términos generales de uso de la web están en los <Link href="/es/legal/terminos" className="text-terracotta-600 font-medium hover:underline">términos legales</Link>.
        </p>
      </div>

      <OrganizerContractClauses locale="es" />

      <div className="mt-10 bg-white border border-sand-200 rounded-2xl p-6">
        <h2 className="font-serif text-lg text-foreground mb-3">Aceptación electrónica</h2>
        <p className="text-sm text-[#5e5247] leading-relaxed">
          Los organizadores aceptan este contrato de forma electrónica desde su panel. La aceptación queda registrada con identificador de cuenta, fecha y hora (UTC), versión del contrato y dirección IP, conforme a la Ley 34/2002 y al Reglamento eIDAS, y tiene valor probatorio en caso de controversia.
        </p>
        <p className="text-sm text-[#5e5247] leading-relaxed mt-3">
          Cualquier modificación sustancial del contrato se comunicará con antelación y, si procede, requerirá nueva aceptación.
        </p>
      </div>

      <div className="mt-12 pt-8 border-t border-sand-200 flex flex-wrap gap-4">
        <Link href="/es/condiciones" className="text-sm text-terracotta-600 hover:underline">
          Condiciones de uso y precios
        </Link>
        <Link href="/es/legal/contrato-centro" className="text-sm text-terracotta-600 hover:underline">
          Contrato del centro
        </Link>
        <Link href="/es/legal/terminos" className="text-sm text-terracotta-600 hover:underline">
          Términos legales
        </Link>
        <Link href="/es/legal/privacidad" className="text-sm text-terracotta-600 hover:underline">
          Política de privacidad
        </Link>
      </div>
    </div>
  );
}
