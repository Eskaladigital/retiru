// ============================================================================
// RETIRU · Condiciones — /es/condiciones
// Cómo se cobra, cómo percibe la app su remuneración, modelo de precios
// ============================================================================

import Link from 'next/link';

export const metadata = {
  title: 'Condiciones de uso y precios',
  description: 'Cómo funcionan los precios en Retiru. Cuánto pagas, a quién y cómo se financia la plataforma. Transparencia total.',
};

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
            El organizador fija el precio total del retiro (mínimo 50€). Ese es el precio que ves en la ficha del retiro. Al reservar, el asistente realiza dos pagos diferenciados:
          </p>

          <div className="bg-sand-100 rounded-2xl p-6 md:p-8">
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-terracotta-100 text-terracotta-600 flex items-center justify-center font-bold shrink-0">1</div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Pago inmediato a Retiru (20%)</h3>
                  <p className="text-[15px] text-muted-foreground leading-relaxed">
                    Se cobra con tarjeta a través de Stripe al hacer la reserva. Retiru emite factura al asistente. Este pago bloquea la plaza y cubre la intermediación y gestión de la reserva.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-sage-100 text-sage-700 flex items-center justify-center font-bold shrink-0">2</div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Pago al organizador (80%)</h3>
                  <p className="text-[15px] text-muted-foreground leading-relaxed">
                    Se paga directamente al organizador antes del inicio del retiro, por transferencia o el método que él indique. Fuera de la plataforma. Retiru no interviene en este pago.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ CÓMO PERCIBE RETIRU SU REMUNERACIÓN ═══ */}
        <section>
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">
            Cómo percibe Retiru su remuneración
          </h2>
          <p className="text-[15px] leading-relaxed text-foreground mb-4">
            Retiru se financia exclusivamente con el 20% que paga el asistente al reservar. Es nuestra única fuente de ingresos.
          </p>

          <div className="bg-terracotta-50 border border-terracotta-100 rounded-2xl p-6 md:p-8">
            <ul className="space-y-3 text-[15px] leading-relaxed">
              <li className="flex gap-3">
                <span className="text-terracotta-600 font-bold">•</span>
                <span><strong>El organizador no paga nada:</strong> ni comisión, ni suscripción, ni cuota. Publicar y gestionar retiros es 100% gratis.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-terracotta-600 font-bold">•</span>
                <span><strong>El asistente paga el 20% a Retiru</strong> como cuota de intermediación y gestión de reserva. Con eso cubrimos la plataforma, el procesamiento de pagos, el soporte y el desarrollo.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-terracotta-600 font-bold">•</span>
                <span><strong>El 80% va íntegro al organizador.</strong> Retiru no retiene ni un euro de esa parte.</span>
              </li>
            </ul>
          </div>
        </section>

        {/* ═══ EJEMPLO PRÁCTICO ═══ */}
        <section>
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">
            Ejemplo práctico
          </h2>
          <div className="bg-white border-2 border-sand-200 rounded-2xl p-6 md:p-8">
            <p className="text-sm font-semibold text-muted-foreground mb-4">Retiro de 500€</p>
            <div className="space-y-3 text-[15px]">
              <div className="flex justify-between items-center py-3 border-b border-sand-100">
                <span className="flex items-center gap-2">
                  Cuota de gestión de reserva
                  <span className="text-[11px] font-semibold uppercase bg-terracotta-100 text-terracotta-700 px-2 py-0.5 rounded-full">Retiru</span>
                </span>
                <span className="font-bold text-terracotta-600">100€</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-sand-100">
                <span className="flex items-center gap-2">
                  Pago al organizador
                  <span className="text-[11px] font-semibold uppercase bg-sage-100 text-sage-700 px-2 py-0.5 rounded-full">Organizador</span>
                </span>
                <span className="font-bold">400€</span>
              </div>
              <div className="flex justify-between items-center pt-4 mt-2 border-t-2 border-foreground">
                <span className="font-semibold">Precio total del retiro</span>
                <span className="text-xl font-bold">500€</span>
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Al reservar pagas 100€ a Retiru. Los 400€ restantes se los pagas directamente al organizador antes del inicio del retiro. Sin costes ocultos.
            </p>
          </div>
        </section>

        {/* ═══ RESERVAS, CONFIRMACIÓN Y CANCELACIONES ═══ */}
        <section>
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">
            Directorio de centros
          </h2>
          <div className="space-y-4 text-[15px] leading-relaxed text-muted-foreground">
            <p>
              <strong className="text-foreground">Membresía gratuita inicial:</strong> Los centros seleccionados para nuestro directorio reciben 6 meses de membresía gratuita. Durante ese periodo, tu ficha está activa con todos los beneficios: visibilidad SEO, reseñas, contacto directo y gestión desde tu panel.
            </p>
            <p>
              <strong className="text-foreground">Tras el periodo gratuito:</strong> Evaluaremos juntos el impacto del directorio en tu negocio. Si deseas continuar, pasarás a una cuota mensual asequible. Si no, tu ficha se desactivará sin compromiso.
            </p>
            <p>
              <strong className="text-foreground">Reclama tu centro:</strong> Si tu centro ya aparece en el directorio, puedes reclamarlo creando una cuenta y haciendo clic en "Reclamar este centro" en tu ficha. Nuestro equipo verificará tu identidad como propietario.
            </p>
          </div>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">
            Reservas, confirmación y cancelaciones
          </h2>
          <div className="space-y-4 text-[15px] leading-relaxed text-muted-foreground">
            <p>
              <strong className="text-foreground">Reserva:</strong> Tu plaza queda bloqueada tras el pago del 20%. Si el retiro tiene confirmación inmediata, la plaza se confirma al instante. Si requiere confirmación manual, el organizador tiene un plazo (por defecto 48h) para confirmar o rechazar.
            </p>
            <p>
              <strong className="text-foreground">Cancelación por el asistente:</strong> La cuota del 20% pagada a Retiru no es reembolsable. El reembolso del 80% (si aplica) depende de la política de cancelación de cada retiro.
            </p>
            <p>
              <strong className="text-foreground">Cancelación por el organizador:</strong> Recibirás el reembolso completo del 20% de forma automática.
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
