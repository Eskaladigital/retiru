import type { Metadata } from 'next';
import Link from 'next/link';
import { Heart, Users, Globe, Shield, Leaf, Target } from 'lucide-react';
import { aboutES } from '@/lib/seo/page-metadata';
export const metadata: Metadata = aboutES;

const VALUES = [
  { icon: Heart, title: 'Pasión por el bienestar', text: 'Creemos que todo el mundo merece desconectar, reconectar consigo mismo y vivir experiencias que transformen.' },
  { icon: Shield, title: 'Transparencia total', text: 'Desglosamos cada euro. Sin comisiones ocultas, sin letra pequeña. Tú sabes exactamente qué pagas y a quién.' },
  { icon: Users, title: 'Comunidad primero', text: 'Los organizadores son nuestro motor. Les damos herramientas gratuitas para que se centren en lo que mejor saben hacer.' },
  { icon: Globe, title: 'España como destino', text: 'Ibiza, Mallorca, Sierra Nevada, Costa Brava... España tiene todo para ser la capital mundial de los retiros.' },
  { icon: Leaf, title: 'Impacto positivo', text: 'Promovemos retiros responsables, turismo sostenible y prácticas que cuidan tanto a las personas como al entorno.' },
  { icon: Target, title: 'Excelencia accesible', text: 'Experiencias premium al alcance de todos. Desde escapadas de fin de semana hasta retiros inmersivos de dos semanas.' },
];

const STATS = [
  { value: '500+', label: 'Retiros en España' },
  { value: '9', label: 'Destinos destacados' },
  { value: '0 %', label: 'Comisión al organizador' },
  { value: '20 %', label: 'Cuota transparente al asistente' },
];

const TEAM = [
  { name: 'El equipo Retiru', role: 'Fundadores & Desarrollo', text: 'Somos un equipo pequeño pero apasionado, convencido de que la industria del bienestar en España necesitaba una plataforma hecha desde aquí, en nuestro idioma, y con nuestras reglas.' },
];

export default function SobreNosotrosPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-sage-50 to-white">
        <div className="container-wide py-16 md:py-20 text-center">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.12em] text-sage-600 mb-4">Sobre nosotros</span>
          <h1 className="font-serif text-[clamp(28px,4.5vw,48px)] text-foreground leading-[1.15] mb-4 max-w-3xl mx-auto">
            Conectamos personas con experiencias que transforman
          </h1>
          <p className="text-[#7a6b5d] text-lg max-w-2xl mx-auto leading-relaxed">
            Retiru nace para ser el puente entre quienes buscan desconectar y quienes crean espacios para hacerlo posible. Somos el marketplace de retiros y escapadas de bienestar líder en español.
          </p>
        </div>
      </section>

      {/* Nuestra historia */}
      <section className="container-wide py-12">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-serif text-2xl md:text-3xl mb-6">Nuestra historia</h2>
          <div className="space-y-4 text-[15px] text-[#7a6b5d] leading-[1.8]">
            <p>
              España alberga más de 500 retiros activos, pero hasta ahora la mayoría se vendían en inglés, en plataformas extranjeras que cobraban entre un 20 % y un 30 % de comisión al organizador. Los creadores de experiencias españoles no tenían una herramienta en su idioma que los tratara bien.
            </p>
            <p>
              Retiru nació de una pregunta sencilla: <strong>¿por qué no existe un "Airbnb de los retiros" hecho en España, en español, y que no cobre comisión al organizador?</strong>
            </p>
            <p>
              Nuestra respuesta fue crear una plataforma donde publicar es gratis, donde el organizador recibe el 80 % del precio directamente del asistente, y donde el panel de gestión es tan completo que nadie quiera volver a Excel y WhatsApp.
            </p>
            <p>
              El asistente paga a Retiru solo un 20 % como cuota de intermediación y gestión de reserva. Eso es todo. Sin sorpresas, sin costes ocultos, con desglose siempre visible.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-sand-100">
        <div className="container-wide py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-serif text-3xl md:text-4xl text-terracotta-600 font-bold">{s.value}</p>
                <p className="text-sm text-[#7a6b5d] mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Valores */}
      <section className="container-wide py-12">
        <h2 className="font-serif text-2xl md:text-3xl mb-8 text-center">Nuestros valores</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {VALUES.map((v) => (
            <div key={v.title} className="bg-white rounded-2xl border border-sand-200 p-6 hover:shadow-soft transition-shadow">
              <div className="w-11 h-11 rounded-xl bg-terracotta-50 flex items-center justify-center mb-4">
                <v.icon className="w-5 h-5 text-terracotta-600" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{v.title}</h3>
              <p className="text-sm text-[#7a6b5d] leading-relaxed">{v.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Equipo */}
      <section className="bg-sage-50">
        <div className="container-wide py-12">
          <h2 className="font-serif text-2xl md:text-3xl mb-8 text-center">El equipo</h2>
          {TEAM.map((m) => (
            <div key={m.name} className="max-w-2xl mx-auto text-center">
              <div className="w-20 h-20 bg-sage-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-serif text-sage-700">R</span>
              </div>
              <h3 className="font-semibold text-lg text-foreground">{m.name}</h3>
              <p className="text-sm text-sage-600 mb-3">{m.role}</p>
              <p className="text-[15px] text-[#7a6b5d] leading-relaxed">{m.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container-wide py-12">
        <div className="bg-gradient-to-br from-terracotta-600 to-terracotta-700 rounded-3xl p-10 md:p-14 text-center text-white">
          <h2 className="font-serif text-2xl md:text-3xl mb-3">¿Listo para tu próxima experiencia?</h2>
          <p className="text-white/80 mb-6 max-w-xl mx-auto">Descubre cientos de retiros en los destinos más bonitos de España. Yoga, meditación, gastronomía, aventura y mucho más.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/es/buscar" className="inline-flex items-center justify-center gap-2 bg-white text-terracotta-700 font-semibold px-8 py-3.5 rounded-xl hover:bg-white/90 transition-colors">
              Explorar retiros
            </Link>
            <Link href="/es/para-organizadores" className="inline-flex items-center justify-center gap-2 border-2 border-white/30 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/10 transition-colors">
              Soy organizador
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
