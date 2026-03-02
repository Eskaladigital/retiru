// ============================================================================
// RETIRU · Política de privacidad — /es/legal/privacidad
// ============================================================================

import Link from 'next/link';

export const metadata = {
  title: 'Política de privacidad',
  description: 'Política de privacidad y protección de datos de Retiru.',
};

export default function PrivacidadPage() {
  return (
    <div className="container-narrow py-12">
      <nav className="mb-8 flex items-center gap-1 text-xs text-muted-foreground">
        <Link href="/es" className="hover:text-terracotta-600">Inicio</Link>
        <span>›</span>
        <span className="text-foreground">Política de privacidad</span>
      </nav>

      <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-2">
        Política de privacidad
      </h1>
      <p className="text-muted-foreground mb-12">Última actualización: marzo 2025</p>

      <div className="prose prose-sand max-w-none space-y-8 text-[15px] leading-relaxed text-muted-foreground">
        <section>
          <h2 className="font-serif text-xl font-bold text-foreground mb-3">Responsable del tratamiento</h2>
          <p>Retiru es el responsable del tratamiento de tus datos personales. Puedes contactarnos en: legal@retiru.com</p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-foreground mb-3">Datos que recogemos</h2>
          <p>Recogemos los datos necesarios para el registro, la reserva de retiros, la comunicación con organizadores y el cumplimiento legal: nombre, email, datos de pago (procesados por Stripe), y la información que nos proporciones en formularios y cuestionarios.</p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-foreground mb-3">Finalidad y base legal</h2>
          <p>Utilizamos tus datos para gestionar tu cuenta, procesar reservas, enviar comunicaciones necesarias y cumplir con obligaciones legales. La base legal es la ejecución del contrato, el consentimiento y el interés legítimo.</p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-foreground mb-3">Tus derechos (RGPD)</h2>
          <p>Tienes derecho a acceder, rectificar, suprimir, limitar el tratamiento, portabilidad y oposición. Puedes ejercerlos contactando a legal@retiru.com. También tienes derecho a reclamar ante la autoridad de protección de datos.</p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-foreground mb-3">Conservación y seguridad</h2>
          <p>Conservamos los datos mientras sea necesario para las finalidades indicadas y para cumplir obligaciones legales. Aplicamos medidas técnicas y organizativas para proteger tu información.</p>
        </section>
      </div>

      <div className="mt-12 pt-8 border-t border-sand-200 flex flex-wrap gap-4">
        <Link href="/es/legal/terminos" className="text-sm text-terracotta-600 hover:underline">
          Términos y condiciones
        </Link>
        <Link href="/es/legal/cookies" className="text-sm text-terracotta-600 hover:underline">
          Política de cookies
        </Link>
      </div>
    </div>
  );
}
