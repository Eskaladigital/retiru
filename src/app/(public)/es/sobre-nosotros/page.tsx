import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Users, Globe, Shield, Leaf, Target } from 'lucide-react';
import { aboutES } from '@/lib/seo/page-metadata';
export const metadata: Metadata = aboutES;

const VALUES = [
  { icon: Heart, title: 'Pasión por el bienestar', text: 'Creemos que todo el mundo merece desconectar, reconectar consigo mismo y vivir experiencias que transformen.' },
  { icon: Shield, title: 'Transparencia total', text: 'Desglosamos cada euro. Sin comisiones ocultas, sin letra pequeña. Tú sabes exactamente qué pagas y a quién.' },
  { icon: Users, title: 'Comunidad primero', text: 'Los organizadores son nuestro motor. Les damos herramientas gratuitas para que se centren en lo que mejor saben hacer.' },
  { icon: Globe, title: 'España como destino', text: 'Ibiza, Mallorca, Sierra Nevada, Costa Brava… España tiene todo para ser un referente de retiros y bienestar.' },
  { icon: Leaf, title: 'Impacto positivo', text: 'Promovemos retiros responsables, turismo sostenible y prácticas que cuidan tanto a las personas como al entorno.' },
  { icon: Target, title: 'Excelencia accesible', text: 'Experiencias que aportan valor al alcance de más personas. Desde escapadas de fin de semana hasta inmersivos más largos.' },
];

const STATS = [
  { value: '500+', label: 'Retiros en España' },
  { value: '9', label: 'Destinos destacados' },
  { value: '0 %', label: 'Comisión al organizador' },
  { value: '20 %', label: 'Cuota transparente al asistente' },
];

export default function SobreNosotrosPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-sage-50 to-white">
        <div className="container-wide py-16 md:py-20 text-center">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.12em] text-sage-600 mb-4">Sobre nosotros</span>
          <h1 className="font-serif text-[clamp(28px,4.5vw,48px)] text-foreground leading-[1.15] mb-6 max-w-3xl mx-auto">
            Andrea y Roi
          </h1>
          <div className="relative w-[min(280px,85vw)] aspect-square mx-auto mb-8 rounded-2xl overflow-hidden shadow-lg ring-1 ring-sand-200/80">
            <Image
              src="/images/andrea_y_roi.jpg"
              alt="Andrea y Roi, fundadores de Retiru"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 85vw, 280px"
              priority
            />
          </div>
          <p className="text-[#7a6b5d] text-lg max-w-2xl mx-auto leading-relaxed">
            Somos una pareja de trotamundos unida por algo más que el destino: una profunda pasión por el bienestar, la comunidad y las experiencias que transforman.
          </p>
        </div>
      </section>

      {/* Nuestra historia */}
      <section className="container-wide py-12">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-serif text-2xl md:text-3xl mb-6">Nuestra historia</h2>
          <div className="space-y-4 text-[15px] text-[#7a6b5d] leading-[1.8]">
            <p>
              Nos conocimos hace unos años, y desde entonces emprendimos juntos un camino de aprendizaje y descubrimiento. Yoga, ayurveda, cocina consciente… cada formación, cada encuentro y cada viaje ha ido dando forma a nuestra manera de entender la vida: más presente, más conectada, más auténtica.
            </p>
            <p>
              El último año marcó un antes y un después. Vivimos en una furgoneta recorriendo Nueva Zelanda, colaborando en cursos de yoga, retiros y eventos comunitarios. Allí no solo aprendimos nuevas disciplinas, sino también nuevas formas de vivir, de compartir y de cuidarnos. Nos empapamos de ideas, de inspiración y de personas que, como nosotros, creen en un estilo de vida más consciente.
            </p>
            <p>
              A nuestra vuelta, el viaje continuó en Kerala, India, cuna del ayurveda, donde nos formamos en masajes ayurvédicos tradicionales. Esta experiencia nos permitió profundizar aún más en el conocimiento del cuerpo, la energía y el equilibrio, integrando prácticas ancestrales que hoy forman parte de nuestra filosofía de vida.
            </p>
            <p className="font-medium text-foreground">
              Con todo ese bagaje nace Retiru.
            </p>
            <p>
              Creamos este espacio con la intención de explorar y dar visibilidad al mundo del bienestar en la península, conectando a personas con retiros, centros y experiencias que realmente aportan valor. Queremos acercar el wellness a más gente, porque creemos firmemente que cuidarse no debería ser un lujo ni algo secundario, sino una prioridad.
            </p>
            <p>
              Retiru es también nuestro primer paso hacia un sueño mayor: algún día, no muy lejano, crear nuestro propio rincón wellness en la costa del Levante. Un lugar donde las personas puedan parar, reconectar y sentirse en casa.
            </p>
            <p>
              Esto es solo el comienzo. Y nos encanta que estés aquí para formar parte del camino.
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
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="font-semibold text-lg text-foreground">Andrea y Roi</h3>
            <p className="text-sm text-sage-600 mb-3">Fundadores de Retiru</p>
            <p className="text-[15px] text-[#7a6b5d] leading-relaxed">
              Construimos Retiru desde la experiencia en el camino, con ganas de que el bienestar sea más visible y accesible en la península.
            </p>
          </div>
        </div>
      </section>

      {/* Modelo */}
      <section className="container-wide py-12">
        <div className="bg-sand-100 rounded-2xl p-8 md:p-10 max-w-3xl mx-auto">
          <h2 className="font-serif text-2xl text-foreground mb-4">Nuestro modelo</h2>
          <p className="text-[15px] text-[#7a6b5d] leading-[1.8]">
            El asistente paga a Retiru un 20 % como cuota de gestión de reserva al reservar. El 80 % restante lo paga directamente al organizador. A los organizadores no les cobramos comisión: su panel, CRM, mensajería y analíticas son 100 % gratuitos.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="container-wide pb-12">
        <div className="bg-gradient-to-br from-terracotta-600 to-terracotta-700 rounded-3xl p-10 md:p-14 text-center text-white">
          <h2 className="font-serif text-2xl md:text-3xl mb-3">¿Listo para tu próxima experiencia?</h2>
          <p className="text-white/80 mb-6 max-w-xl mx-auto">Descubre retiros y centros en los destinos más bonitos de España. Especializados en yoga, meditación y ayurveda.</p>
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
