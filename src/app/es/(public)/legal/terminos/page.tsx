// ============================================================================
// RETIRU · Términos legales — /es/legal/terminos
// Términos de uso típicos de una web
// ============================================================================

import Link from 'next/link';

export const metadata = {
  title: 'Términos y condiciones',
  description: 'Términos de uso y condiciones legales del servicio Retiru.',
};

export default function TerminosPage() {
  return (
    <div className="container-narrow py-12">
      <nav className="mb-8 flex items-center gap-1 text-xs text-muted-foreground">
        <Link href="/es" className="hover:text-terracotta-600">Inicio</Link>
        <span>›</span>
        <span className="text-foreground">Términos y condiciones</span>
      </nav>

      <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-2">
        Términos y condiciones
      </h1>
      <p className="text-muted-foreground mb-12">Última actualización: marzo 2025</p>

      <div className="prose prose-sand max-w-none space-y-8 text-[15px] leading-relaxed text-muted-foreground">
        <p>
          Para información sobre precios, cobros y remuneración de la plataforma, consulta nuestras{' '}
          <Link href="/es/condiciones" className="text-terracotta-600 hover:underline font-medium">Condiciones de uso y precios</Link>.
        </p>

        <section>
          <h2 className="font-serif text-xl font-bold text-foreground mb-3">Objeto y aceptación</h2>
          <p>Estos términos regulan el uso del sitio web y los servicios de Retiru. Al utilizar la plataforma, el usuario acepta estos términos en su totalidad.</p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-foreground mb-3">Descripción del servicio</h2>
          <p>Retiru es una plataforma que pone en contacto a organizadores de retiros y escapadas con asistentes interesados. Actuamos como intermediario en la reserva. El contrato de prestación del retiro se establece entre el asistente y el organizador.</p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-foreground mb-3">Uso del servicio</h2>
          <p>El usuario se compromete a utilizar la plataforma de forma lícita, a proporcionar información veraz y a no publicar contenido que infrinja derechos de terceros. Los datos de contacto del organizador no se muestran hasta que el asistente haya completado el pago de la reserva.</p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-foreground mb-3">Propiedad intelectual</h2>
          <p>El contenido de la plataforma (diseño, textos, logotipos, software) es propiedad de Retiru o de sus licenciantes. Queda prohibida su reproducción sin autorización.</p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-foreground mb-3">Limitación de responsabilidad</h2>
          <p>Retiru no es responsable de la calidad de los retiros, del cumplimiento por parte del organizador ni de incidencias derivadas de la relación directa entre asistente y organizador una vez realizada la reserva.</p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-foreground mb-3">Modificaciones</h2>
          <p>Retiru se reserva el derecho de modificar estos términos. Los cambios serán efectivos desde su publicación. El uso continuado del servicio implica la aceptación de los términos vigentes.</p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-foreground mb-3">Ley aplicable y jurisdicción</h2>
          <p>Estos términos se rigen por la legislación española. Para cualquier controversia, las partes se someten a los juzgados y tribunales competentes.</p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-foreground mb-3">Contacto</h2>
          <p>Para dudas sobre estos términos: <a href="mailto:legal@retiru.com" className="text-terracotta-600 hover:underline">legal@retiru.com</a></p>
        </section>
      </div>

      <div className="mt-12 pt-8 border-t border-sand-200 flex flex-wrap gap-4">
        <Link href="/es/condiciones" className="text-sm text-terracotta-600 hover:underline">
          Condiciones de uso y precios
        </Link>
        <Link href="/es/legal/privacidad" className="text-sm text-terracotta-600 hover:underline">
          Política de privacidad
        </Link>
        <Link href="/es/legal/cookies" className="text-sm text-terracotta-600 hover:underline">
          Política de cookies
        </Link>
      </div>
    </div>
  );
}
