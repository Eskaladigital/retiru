// ============================================================================
// RETIRU · Contrato del centro (consulta pública) — /es/legal/contrato-centro
// Texto íntegro del contrato del directorio de centros (suscripción 20 €/mes).
// Cláusulas en src/lib/legal/center-contract.tsx.
// ============================================================================

import Link from 'next/link';
import { centerContractES } from '@/lib/seo/page-metadata';
import {
  CENTER_CONTRACT_VERSION,
  CenterContractClauses,
} from '@/lib/legal/center-contract';

export const metadata = centerContractES;

export default function ContratoCentroPage() {
  return (
    <div className="container-narrow py-12">
      <nav className="mb-8 flex items-center gap-1 text-xs text-muted-foreground">
        <Link href="/es" className="hover:text-terracotta-600">Inicio</Link>
        <span>›</span>
        <Link href="/es/condiciones" className="hover:text-terracotta-600">Condiciones</Link>
        <span>›</span>
        <span className="text-foreground">Contrato del centro</span>
      </nav>

      <div className="flex items-baseline justify-between flex-wrap gap-3 mb-2">
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground">
          Contrato del centro (directorio)
        </h1>
        <span className="text-[11px] uppercase tracking-wider text-[#a09383]">
          Versión {CENTER_CONTRACT_VERSION}
        </span>
      </div>
      <p className="text-muted-foreground mb-8 leading-relaxed">
        Acuerdo entre Retiru y los centros de yoga, meditación y ayurveda que mantienen una ficha activa en el directorio. Lo publicamos aquí para que cualquier persona pueda consultarlo abiertamente, antes incluso de reclamar la ficha de su centro.
      </p>

      <div className="bg-sand-50 border border-sand-200 rounded-2xl p-5 md:p-6 mb-8 text-sm text-[#5e5247] leading-relaxed">
        <p className="mb-2">
          <strong>¿A quién aplica?</strong> A los centros físicos (escuelas, estudios, retiros propios, salas) que aparecen en el directorio de Retiru y desean mantener su ficha pública con todas las funcionalidades: gestión desde panel, contacto directo con interesados, recepción de reseñas y visibilidad SEO.
        </p>
        <p className="mb-2">
          <strong>Tarifa.</strong> 20 €/mes. Los centros incluidos en la fase de lanzamiento disfrutan de <strong>6 meses de cortesía</strong> antes de pasar a la cuota.
        </p>
        <p>
          <strong>¿Y si solo organizo retiros puntuales?</strong> Entonces no necesitas este contrato; necesitas el <Link href="/es/legal/contrato-organizador" className="text-terracotta-600 font-medium hover:underline">contrato del organizador</Link>, que se acepta gratuitamente desde el panel y solo cobra comisión cuando publicas eventos.
        </p>
      </div>

      <CenterContractClauses locale="es" />

      <div className="mt-10 bg-white border border-sand-200 rounded-2xl p-6">
        <h2 className="font-serif text-lg text-foreground mb-3">Estado actual</h2>
        <p className="text-sm text-[#5e5247] leading-relaxed">
          Esta versión del contrato es <strong>borrador inicial</strong> ({CENTER_CONTRACT_VERSION}). La aceptación formal por parte de cada centro se activará al término de su periodo de cortesía, mediante una pantalla de aceptación electrónica equivalente a la del contrato del organizador. Cualquier modificación sustancial se comunicará por email con al menos 30 días de antelación.
        </p>
      </div>

      <div className="mt-12 pt-8 border-t border-sand-200 flex flex-wrap gap-4">
        <Link href="/es/condiciones" className="text-sm text-terracotta-600 hover:underline">
          Condiciones de uso y precios
        </Link>
        <Link href="/es/legal/contrato-organizador" className="text-sm text-terracotta-600 hover:underline">
          Contrato del organizador
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
