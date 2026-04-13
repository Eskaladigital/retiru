// ============================================================================
// RETIRU · Condiciones — /es/condiciones
// Cómo se cobra, modelo de precios (pago 100%) con comisiones escalonadas
// ============================================================================

import Link from 'next/link';
import { conditionsES } from '@/lib/seo/page-metadata';

export const metadata = conditionsES;

export default function CondicionesPage() {
  return (
    <div className="container-narrow py-12">
      <nav className="mb-8 flex items-center gap-1 text-xs text-muted-foreground">
        <Link href="/es" className="hover:text-terracotta-600">Inicio</Link>
        <span>›</span>
        <span className="text-foreground">Condiciones</span>
      </nav>

      <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-2">
        Condiciones de uso y precios
      </h1>
      <p className="text-muted-foreground mb-12">
        Transparencia total sobre cómo funcionan los cobros y la remuneración de Retiru
      </p>

      <div className="space-y-12">
        {/* ═══ CÓMO SE COBRA ═══ */}
        <section>
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">
            Cómo se cobra
          </h2>
          <p className="text-[15px] leading-relaxed text-foreground mb-4">
            El organizador fija el <strong>PVP</strong> (precio público final por persona, mínimo 50€): es el importe que ves en la ficha. Ese precio <strong>no lleva recargos extra</strong> para el asistente. En la mayoría de retiros, al reservar <strong>pagas el 100% del PVP con tarjeta</strong> en un solo paso (Stripe). Si el retiro tiene un mínimo de plazas y aún no se ha alcanzado, puedes reservar plaza sin pagar hasta que se cumpla el mínimo; entonces recibirás un enlace para pagar dentro del plazo indicado.
          </p>

          <div className="bg-sand-100 rounded-2xl p-6 md:p-8">
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-sage-100 text-sage-700 flex items-center justify-center font-bold shrink-0">✓</div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Pago al reservar (o tras el mínimo de plazas)</h3>
                  <p className="text-[15px] text-muted-foreground leading-relaxed">
                    Cuando aplica cobro inmediato, se paga el PVP completo con tarjeta (Stripe) en un paso. Si el retiro tiene mínimo de plazas y aún no se ha alcanzado, primero reservas plaza sin pagar y pagas el PVP dentro del plazo cuando te lo indiquemos. Sin recargos ocultos sobre el precio publicado.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ CÓMO PERCIBE RETIRU SU REMUNERACIÓN ═══ */}
        <section>
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">
            Cómo se financia Retiru
          </h2>
          <p className="text-[15px] leading-relaxed text-foreground mb-4">
            Retiru cobra una comisión incluida en el PVP que fija el organizador. La comisión es <strong>progresiva</strong> para que los nuevos organizadores prueben la plataforma sin riesgo:
          </p>

          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-5 text-center">
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-700 mb-1">1.er retiro</p>
              <p className="text-3xl font-bold text-emerald-700">0&nbsp;%</p>
              <p className="text-sm text-emerald-800 mt-1">100&nbsp;% para el organizador</p>
            </div>
            <div className="rounded-xl bg-sky-50 border border-sky-200 p-5 text-center">
              <p className="text-xs font-bold uppercase tracking-wide text-sky-700 mb-1">2.º retiro</p>
              <p className="text-3xl font-bold text-sky-700">10&nbsp;%</p>
              <p className="text-sm text-sky-800 mt-1">90&nbsp;% para el organizador</p>
            </div>
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-5 text-center">
              <p className="text-xs font-bold uppercase tracking-wide text-amber-700 mb-1">3.er retiro en adelante</p>
              <p className="text-3xl font-bold text-amber-700">20&nbsp;%</p>
              <p className="text-sm text-amber-800 mt-1">80&nbsp;% para el organizador</p>
            </div>
          </div>

          <div className="bg-terracotta-50 border border-terracotta-100 rounded-2xl p-6 md:p-8">
            <ul className="space-y-3 text-[15px] leading-relaxed">
              <li className="flex gap-3">
                <span className="text-terracotta-600 font-bold">•</span>
                <span><strong>Sin suscripción para publicar:</strong> no hay cuota fija por usar el panel. La comisión es progresiva (0&nbsp;% → 10&nbsp;% → 20&nbsp;% del PVP) y el asistente no paga recargos.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-terracotta-600 font-bold">•</span>
                <span><strong>El asistente paga el PVP publicado</strong> (sin recargos encima). Si el retiro tiene mínimo de plazas, puede reservar sin pagar hasta cumplir el mínimo y luego pagar dentro del plazo.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-terracotta-600 font-bold">•</span>
                <span><strong>Retiru transfiere al organizador</strong> su parte una vez confirmada la reserva.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-terracotta-600 font-bold">•</span>
                <span><strong>Cada retiro mantiene su nivel</strong> de comisión de forma permanente. El 1.er retiro siempre será al 0&nbsp;%, el 2.º al 10&nbsp;%, independientemente de cuántos publiques después.</span>
              </li>
            </ul>
          </div>
        </section>

        {/* ═══ EJEMPLO PRÁCTICO ═══ */}
        <section>
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">
            Ejemplos prácticos
          </h2>

          <div className="space-y-6">
            {/* Ejemplo 1: primer retiro */}
            <div className="bg-white border-2 border-emerald-200 rounded-2xl p-6 md:p-8">
              <p className="text-sm font-semibold text-emerald-700 mb-4">Tu primer retiro — 500€ (comisión 0&nbsp;%)</p>
              <div className="space-y-3 text-[15px]">
                <div className="flex justify-between items-center py-3 border-b border-sand-100">
                  <span>El asistente paga</span>
                  <span className="text-xl font-bold">500€</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-sand-100">
                  <span className="flex items-center gap-2">
                    El organizador recibe
                    <span className="text-[11px] font-semibold uppercase bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">100&nbsp;%</span>
                  </span>
                  <span className="font-bold text-emerald-700">500€</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="flex items-center gap-2">
                    Comisión Retiru
                    <span className="text-[11px] font-semibold uppercase bg-sand-100 text-muted-foreground px-2 py-0.5 rounded-full">0&nbsp;%</span>
                  </span>
                  <span className="font-bold text-muted-foreground">0€</span>
                </div>
              </div>
            </div>

            {/* Ejemplo 2: segundo retiro */}
            <div className="bg-white border-2 border-sky-200 rounded-2xl p-6 md:p-8">
              <p className="text-sm font-semibold text-sky-700 mb-4">Tu segundo retiro — 500€ (comisión 10&nbsp;%)</p>
              <div className="space-y-3 text-[15px]">
                <div className="flex justify-between items-center py-3 border-b border-sand-100">
                  <span>El asistente paga</span>
                  <span className="text-xl font-bold">500€</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-sand-100">
                  <span className="flex items-center gap-2">
                    El organizador recibe
                    <span className="text-[11px] font-semibold uppercase bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full">90&nbsp;%</span>
                  </span>
                  <span className="font-bold text-sky-700">450€</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="flex items-center gap-2">
                    Comisión Retiru
                    <span className="text-[11px] font-semibold uppercase bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full">10&nbsp;%</span>
                  </span>
                  <span className="font-bold text-sky-600">50€</span>
                </div>
              </div>
            </div>

            {/* Ejemplo 3: tercer retiro en adelante */}
            <div className="bg-white border-2 border-sand-200 rounded-2xl p-6 md:p-8">
              <p className="text-sm font-semibold text-muted-foreground mb-4">Tercer retiro en adelante — 500€ (comisión 20&nbsp;%)</p>
              <div className="space-y-3 text-[15px]">
                <div className="flex justify-between items-center py-3 border-b border-sand-100">
                  <span>El asistente paga</span>
                  <span className="text-xl font-bold">500€</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-sand-100">
                  <span className="flex items-center gap-2">
                    El organizador recibe
                    <span className="text-[11px] font-semibold uppercase bg-sage-100 text-sage-700 px-2 py-0.5 rounded-full">80&nbsp;%</span>
                  </span>
                  <span className="font-bold">400€</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="flex items-center gap-2">
                    Comisión Retiru
                    <span className="text-[11px] font-semibold uppercase bg-terracotta-100 text-terracotta-700 px-2 py-0.5 rounded-full">20&nbsp;%</span>
                  </span>
                  <span className="font-bold text-terracotta-600">100€</span>
                </div>
              </div>
            </div>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            En todos los casos, el asistente paga 500€. Retiru transfiere al organizador el neto correspondiente y retiene su comisión según el nivel. Un solo pago, sin costes adicionales.
          </p>
        </section>

        {/* ═══ DIRECTORIO DE CENTROS ═══ */}
        <section>
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">
            Directorio de centros
          </h2>
          <div className="space-y-4 text-[15px] leading-relaxed text-muted-foreground">
            <p>
              <strong className="text-foreground">Cuota mensual:</strong> Estar en el directorio tiene un coste de <strong>20&nbsp;€/mes</strong>. Durante la fase de lanzamiento, los centros seleccionados disfrutan de <strong>6 meses de cortesía</strong> con todos los beneficios activos: visibilidad SEO, reseñas, contacto directo y gestión desde tu panel.
            </p>
            <p>
              <strong className="text-foreground">Tras el periodo de cortesía:</strong> Los centros que deseen mantener su ficha activa pasan a la cuota mensual de 20&nbsp;€/mes. Si no deseas continuar, tu ficha se desactivará sin compromiso.
            </p>
            <p>
              <strong className="text-foreground">Reclama tu centro:</strong> Si tu centro ya aparece en el directorio, puedes reclamarlo creando una cuenta y haciendo clic en &quot;Reclamar este centro&quot; en tu ficha. Nuestro equipo verificará tu identidad como propietario.
            </p>
          </div>
        </section>

        {/* ═══ RESERVAS, CONFIRMACIÓN Y CANCELACIONES ═══ */}
        <section>
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">
            Reservas, confirmación y cancelaciones
          </h2>
          <div className="space-y-4 text-[15px] leading-relaxed text-muted-foreground">
            <p>
              <strong className="text-foreground">Reserva:</strong> Tu plaza queda bloqueada tras el pago completo. Si el retiro tiene confirmación inmediata, la plaza se confirma al instante. Si requiere confirmación manual, el organizador tiene un plazo (por defecto 48h) para confirmar o rechazar.
            </p>
            <p>
              <strong className="text-foreground">Cancelación por el asistente:</strong> El reembolso depende de la política de cancelación que configure cada organizador (porcentajes y plazos sobre el importe total abonado). Consúltala en la ficha antes de reservar. Si según esa política te corresponde un reembolso, recibirás ese importe íntegro en tu método de pago. La retribución de Retiru en estos supuestos se regula en el acuerdo con el organizador y no implica retener parte de tu reembolso como cuota adicional.
            </p>
            <p>
              <strong className="text-foreground">Cancelación por el organizador:</strong> Recibirás el reembolso completo de forma automática.
            </p>
            <p>
              <strong className="text-foreground">Rechazo por el organizador:</strong> Si el organizador no confirma tu reserva en el plazo establecido, recibirás el reembolso completo automáticamente.
            </p>
          </div>
        </section>
      </div>

      <div className="mt-12 pt-8 border-t border-sand-200 flex flex-wrap gap-4">
        <Link href="/es/legal/terminos" className="text-sm text-terracotta-600 hover:underline">
          Términos legales
        </Link>
        <Link href="/es/legal/privacidad" className="text-sm text-terracotta-600 hover:underline">
          Política de privacidad
        </Link>
        <Link href="/es/ayuda" className="text-sm text-terracotta-600 hover:underline">
          Centro de ayuda
        </Link>
      </div>
    </div>
  );
}
