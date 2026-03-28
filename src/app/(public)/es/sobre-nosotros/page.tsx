import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Users, Globe, Shield, Leaf, Target } from 'lucide-react';
import { aboutES } from '@/lib/seo/page-metadata';
export const metadata: Metadata = aboutES;

const VALUES = [
  { icon: Heart, title: 'Pasión por el bienestar', text: 'Creemos que mereces desconectar, reconectar contigo y vivir experiencias que transformen —en yoga, meditación, ayurveda y todo lo que os haga bien de verdad.' },
  { icon: Shield, title: 'Transparencia total', text: 'Desglosamos cada euro. Sin comisiones ocultas ni letra pequeña: sabes qué pagas, cuándo y a quién.' },
  { icon: Users, title: 'Centros y organizadores', text: 'Son quienes hacen posible cada experiencia. Les damos herramientas gratuitas para publicar, gestionar reservas y hablar con quien reserva.' },
  { icon: Globe, title: 'España como hogar', text: 'Ibiza, Mallorca, la costa, la montaña… La península tiene un potencial enorme para el bienestar consciente y queremos que se vea.' },
  { icon: Leaf, title: 'Impacto positivo', text: 'Apostamos por retiros responsables, turismo más consciente y prácticas que cuidan a las personas y al entorno.' },
  { icon: Target, title: 'Calidad al alcance', text: 'Buscamos experiencias que aporten valor: desde una escapada de fin de semana hasta inmersivos más largos.' },
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
      <section className="bg-gradient-to-b from-sage-50 via-white to-white">
        <div className="container-wide py-16 md:py-24">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="text-center lg:text-left">
              <span className="inline-block text-xs font-bold uppercase tracking-[0.12em] text-sage-600 mb-4">
                Sobre nosotros
              </span>
              <h1 className="font-serif text-[clamp(32px,5vw,56px)] text-foreground leading-[1.08] mb-5 max-w-3xl mx-auto lg:mx-0">
                Andrea y Roi
              </h1>
              <p className="text-[#7a6b5d] text-lg md:text-[19px] max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Somos una pareja de trotamundos unida por algo más que el destino: una profunda pasión por
                el bienestar, la comunidad y las experiencias que transforman.
              </p>
              <div className="flex flex-wrap justify-center lg:justify-start gap-3 mt-7">
                <span className="rounded-full bg-white border border-sand-200 px-4 py-2 text-sm text-[#7a6b5d] shadow-sm">
                  Nueva Zelanda
                </span>
                <span className="rounded-full bg-white border border-sand-200 px-4 py-2 text-sm text-[#7a6b5d] shadow-sm">
                  Kerala
                </span>
                <span className="rounded-full bg-white border border-sand-200 px-4 py-2 text-sm text-[#7a6b5d] shadow-sm">
                  Costa del Levante
                </span>
              </div>
            </div>

            <div className="relative w-full max-w-md lg:max-w-none mx-auto">
              <div className="absolute inset-0 bg-terracotta-100 rounded-[2rem] blur-3xl opacity-60 scale-95" aria-hidden />
              <div className="relative aspect-square overflow-hidden rounded-[2rem] shadow-[0_24px_70px_rgba(92,67,45,0.18)] ring-1 ring-sand-200/80">
                <Image
                  src="/images/andrea_y_roi.jpg"
                  alt="Andrea y Roi, fundadores de Retiru"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 90vw, 42vw"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Nuestra historia */}
      <section className="container-wide py-12 md:py-16">
        <div className="max-w-4xl mx-auto bg-white rounded-[2rem] border border-sand-200/80 shadow-sm p-7 md:p-10 lg:p-12">
          <div className="mb-8">
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-terracotta-600">Nuestra historia</span>
            <h2 className="font-serif text-2xl md:text-4xl text-foreground mt-3">
              Un proyecto nacido del camino
            </h2>
          </div>
          <div className="space-y-5 text-[15px] md:text-[16px] text-[#7a6b5d] leading-[1.9]">
            <p>
              Nos conocimos hace unos años y, desde entonces, hemos recorrido juntos un camino de
              aprendizaje, descubrimiento y crecimiento personal. Yoga, ayurveda, cocina consciente...
              cada formación, cada viaje y cada encuentro ha ido dando forma a nuestra manera de entender
              la vida: más presente, más conectada y más auténtica.
            </p>
            <p>
              El último año marcó un antes y un después en nuestra historia. Vivimos en una furgoneta
              recorriendo Nueva Zelanda, colaborando en cursos de yoga, retiros y eventos comunitarios.
              Allí no solo aprendimos nuevas disciplinas, sino también nuevas formas de vivir, compartir y
              cuidarnos. Fue una etapa profundamente inspiradora, rodeados de personas que, como
              nosotros, creen en un estilo de vida más consciente.
            </p>
            <p>
              A nuestra vuelta, el viaje continuó en Kerala, India, cuna del ayurveda, donde nos formamos
              en masajes ayurvédicos tradicionales. Esta experiencia nos permitió profundizar aún más en el
              conocimiento del cuerpo, la energía y el equilibrio, integrando saberes ancestrales que hoy
              forman parte de nuestra filosofía de vida.
            </p>
            <div className="py-3">
              <p className="font-serif text-2xl md:text-3xl text-foreground text-center">
                Con todo ese bagaje nació Retiru.
              </p>
            </div>
            <p>
              Creamos Retiru con el deseo de dar visibilidad al mundo del bienestar en la península y de
              conectar a más personas con retiros, centros y experiencias que realmente aportan valor.
              Queremos facilitar el encuentro entre quienes buscan cuidarse y los proyectos que promueven
              una forma de vivir más consciente, saludable y conectada.
            </p>
            <p>
              Creemos que el bienestar no debería ocupar un lugar secundario en nuestras vidas. Al
              contrario: debería ser una prioridad. Por eso, Retiru no es solo un buscador de retiros y
              centros, sino también una invitación a parar, reconectar y encontrar espacios que nos hagan
              bien.
            </p>
            <p>
              Este proyecto es, además, el primer paso hacia un sueño mayor: crear algún día nuestro propio
              rincón wellness en la costa del Levante. Un lugar donde las personas puedan descansar,
              reconectar y sentirse en casa.
            </p>
            <p>
              Esto es solo el comienzo, y nos encanta que estés aquí para formar parte del camino.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-sand-100">
        <div className="container-wide py-12 md:py-16">
          <div className="max-w-2xl mx-auto text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-terracotta-600">Retiru en cifras</span>
            <h2 className="font-serif text-2xl md:text-3xl text-foreground mt-3 mb-3">Directorio + reservas, con reglas claras</h2>
            <p className="text-[15px] text-[#7a6b5d] leading-relaxed">
              Unimos el mapa de centros con un marketplace de retiros. Estos números resumen, en pocas palabras, cómo está pensada la plataforma hoy.
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            {STATS.map((s) => (
              <div
                key={s.label}
                className="text-center rounded-2xl bg-white border border-sand-200/90 px-4 py-6 shadow-sm"
              >
                <p className="font-serif text-3xl md:text-4xl text-terracotta-600 font-bold tabular-nums">{s.value}</p>
                <p className="text-sm text-[#7a6b5d] mt-2 leading-snug">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Valores */}
      <section className="container-wide py-12 md:py-16">
        <div className="max-w-2xl mx-auto text-center mb-10">
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-sage-600">Lo que nos mueve</span>
          <h2 className="font-serif text-2xl md:text-3xl text-foreground mt-3 mb-3">Nuestros valores</h2>
          <p className="text-[15px] text-[#7a6b5d] leading-relaxed">
            No se trata solo de tecnología: es un compromiso con las personas que buscan bienestar de verdad y con quienes lo ofrecen con rigor y corazón.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {VALUES.map((v, i) => {
            const sage = i % 2 === 1;
            return (
              <div
                key={v.title}
                className="bg-white rounded-2xl border border-sand-200 p-6 hover:shadow-soft transition-shadow"
              >
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${sage ? 'bg-sage-50' : 'bg-terracotta-50'}`}
                >
                  <v.icon className={`w-5 h-5 ${sage ? 'text-sage-700' : 'text-terracotta-600'}`} />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{v.title}</h3>
                <p className="text-sm text-[#7a6b5d] leading-relaxed">{v.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Quiénes somos */}
      <section className="bg-gradient-to-b from-white to-sage-50/40">
        <div className="container-wide py-12 md:py-16">
          <div className="max-w-2xl mx-auto rounded-[2rem] border border-sand-200 bg-white/90 backdrop-blur-sm px-8 py-10 md:px-12 md:py-12 text-center shadow-sm">
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-sage-600">Quiénes somos</span>
            <h2 className="font-serif text-2xl md:text-3xl text-foreground mt-3 mb-5">Dos personas, un proyecto compartido</h2>
            <p className="text-[15px] text-[#7a6b5d] leading-[1.85]">
              Detrás de Retiru hay una historia de aprendizaje, viajes y práctica, y muchas ganas de construir algo honesto,
              útil y bonito para el mundo del bienestar. Si te apetece saludar o contarnos tu idea, también puedes{' '}
              <Link href="/es/contacto" className="text-sage-700 font-medium underline underline-offset-2 hover:text-sage-800">
                escribirnos
              </Link>
              .
            </p>
            <p className="mt-8 text-foreground font-medium">
              Andrea y Roi
              <span className="text-[#7a6b5d] font-normal"> · Fundadores de Retiru</span>
            </p>
          </div>
        </div>
      </section>

      {/* Modelo */}
      <section className="container-wide py-12 md:py-16">
        <div className="max-w-3xl mx-auto bg-sand-100 rounded-[2rem] border border-sand-200/80 p-8 md:p-10">
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-terracotta-600">Cómo funciona el precio</span>
          <h2 className="font-serif text-2xl md:text-3xl text-foreground mt-3 mb-2">Nuestro modelo</h2>
          <p className="text-[15px] text-[#7a6b5d] leading-relaxed mb-8">
            Así repartimos el importe cuando reservas un retiro: sin letra pequeña y con el desglose siempre visible.
          </p>
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <div className="rounded-2xl bg-white border border-sand-200 p-5 md:p-6">
              <p className="font-serif text-3xl text-terracotta-600 font-bold tabular-nums">20 %</p>
              <p className="font-semibold text-foreground mt-2">Cuota a Retiru</p>
              <p className="text-sm text-[#7a6b5d] mt-2 leading-relaxed">
                Gestión de reserva, pasarela de pago y soporte. Lo abonas al confirmar la plaza.
              </p>
            </div>
            <div className="rounded-2xl bg-white border border-sand-200 p-5 md:p-6">
              <p className="font-serif text-3xl text-sage-700 font-bold tabular-nums">80 %</p>
              <p className="font-semibold text-foreground mt-2">Pago al organizador</p>
              <p className="text-sm text-[#7a6b5d] mt-2 leading-relaxed">
                El resto lo pagas directamente al organizador antes del inicio del retiro.
              </p>
            </div>
          </div>
          <p className="text-[15px] text-[#7a6b5d] leading-[1.8] mb-4">
            Publicar retiros y usar el panel del organizador no tiene coste: sin comisiones ni suscripción para quien crea experiencias.
          </p>
          <p className="text-sm text-[#7a6b5d]">
            <Link href="/es/condiciones" className="text-terracotta-700 font-medium underline underline-offset-2 hover:text-terracotta-800">
              Condiciones y precios
            </Link>
            {' '}— detalle legal y ejemplos.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="container-wide pb-12 md:pb-16">
        <div className="bg-gradient-to-br from-terracotta-600 to-terracotta-700 rounded-3xl p-10 md:p-14 text-center text-white">
          <h2 className="font-serif text-2xl md:text-3xl mb-3">¿Te apetece dar el siguiente paso?</h2>
          <p className="text-white/85 mb-8 max-w-xl mx-auto leading-relaxed">
            Explora retiros o recorre el directorio de centros de yoga, meditación y ayurveda. Si organizas experiencias, el panel te espera sin coste.
          </p>
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 justify-center">
            <Link href="/es/buscar" className="inline-flex items-center justify-center gap-2 bg-white text-terracotta-700 font-semibold px-8 py-3.5 rounded-xl hover:bg-white/90 transition-colors">
              Explorar retiros
            </Link>
            <Link href="/es/centros-retiru" className="inline-flex items-center justify-center gap-2 border-2 border-white/35 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/10 transition-colors">
              Ver centros
            </Link>
            <Link href="/es/para-organizadores" className="inline-flex items-center justify-center gap-2 border-2 border-white/35 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/10 transition-colors">
              Soy organizador
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
