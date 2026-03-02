import Link from 'next/link';
import { Clock, Calendar, ArrowLeft, Share2, ChevronRight } from 'lucide-react';

const ARTICLES: Record<string, {
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  author: { name: string; initials: string; bio: string };
  img: string;
  content: string[];
}> = {
  'guia-completa-primer-retiro-yoga': {
    title: 'Guía completa: cómo elegir tu primer retiro de yoga en España',
    excerpt: 'Todo lo que necesitas saber antes de reservar tu primera experiencia de yoga inmersivo.',
    category: 'Yoga',
    date: '24 Feb 2026',
    readTime: '12 min',
    author: { name: 'Equipo Retiru', initials: 'ER', bio: 'El equipo de contenido de Retiru, apasionados del bienestar y los viajes transformadores.' },
    img: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1200&q=80',
    content: [
      'Si estás leyendo esto, probablemente llevas un tiempo pensando en hacer un retiro de yoga pero no sabes por dónde empezar. Es completamente normal. La oferta es amplia, los precios varían mucho y cada retiro promete algo diferente. En esta guía te ayudamos a tomar la mejor decisión.',
      '## ¿Qué es exactamente un retiro de yoga?',
      'Un retiro de yoga es una experiencia inmersiva que combina la práctica del yoga con un cambio de entorno. A diferencia de una clase semanal en tu gimnasio, un retiro te permite desconectar de tu rutina y dedicar varios días seguidos a tu práctica, tu cuerpo y tu mente.',
      'La mayoría de retiros incluyen alojamiento, comidas (generalmente vegetarianas o veganas), dos o tres sesiones de yoga al día, meditación y tiempo libre para disfrutar del entorno. Algunos añaden senderismo, spa, talleres de cocina o excursiones culturales.',
      '## ¿Cuánto dura un retiro?',
      'Los retiros más populares duran entre 3 y 7 días. Para tu primera experiencia, te recomendamos un retiro de fin de semana (3 días) o uno de 5 días. Así puedes probar sin un compromiso demasiado largo. Los retiros de 7 a 14 días son ideales si ya tienes algo de experiencia o quieres una inmersión más profunda.',
      '## ¿Cuánto cuesta un retiro de yoga en España?',
      'Los precios varían enormemente según la ubicación, la duración, el tipo de alojamiento y lo que incluye. Como referencia:\n\n- **Fin de semana (2-3 días):** 200€ – 450€\n- **Semana (5-7 días):** 450€ – 1.200€\n- **Retiros premium (villa privada, spa):** 800€ – 2.500€\n\nEn Retiru puedes filtrar por precio y ver exactamente cuánto pagas: el 20% es la cuota de gestión que va a Retiru, y el 80% lo pagas directamente al organizador.',
      '## Los 5 mejores destinos para un primer retiro',
      '**1. Ibiza** — No todo es fiesta en Ibiza. La isla tiene una escena de yoga y bienestar increíble, con retiros frente al mar, atardeceres mágicos y una energía especial.\n\n**2. Mallorca** — Montañas, calas vírgenes y una tradición de retiros consolidada. Perfecto para combinar yoga con naturaleza.\n\n**3. Costa Brava** — Cerca de Barcelona, con calas espectaculares y retiros que combinan mar y montaña.\n\n**4. Las Alpujarras (Granada)** — Para quienes buscan silencio y montaña. Retiros más íntimos y auténticos.\n\n**5. Lanzarote** — Paisajes volcánicos únicos, clima perfecto todo el año y retiros con un toque diferente.',
      '## Qué preguntar antes de reservar',
      'Antes de confirmar tu reserva, asegúrate de preguntar:\n\n- **¿Qué nivel de yoga se requiere?** La mayoría aceptan todos los niveles, pero es mejor confirmarlo.\n- **¿Qué incluye el precio?** Alojamiento, comidas, materiales, transporte...\n- **¿Cuál es la política de cancelación?** En Retiru, cada retiro muestra su política antes de reservar.\n- **¿Hay algún formulario pre-retiro?** Muchos organizadores envían un cuestionario sobre dieta, alergias o nivel de práctica.\n- **¿Necesito llevar mi propia esterilla?** Algunos retiros las proporcionan, otros no.',
      '## Prepárate para tu primer retiro',
      'Una vez reservado, prepárate para la experiencia:\n\n- **Lleva ropa cómoda** para practicar y ropa de abrigo para las noches.\n- **Desconecta** del móvil tanto como puedas.\n- **Sé abierto/a** a la experiencia. No todo será cómodo, pero eso es parte del crecimiento.\n- **Hidrátate bien** los días previos.\n- **No compares** tu práctica con la de los demás.',
      '## Encuentra tu retiro ideal',
      'En Retiru puedes explorar cientos de retiros en España, filtrar por fecha, destino, precio y tipo de yoga, y reservar de forma segura con total transparencia de precios. ¿Listo para dar el paso?',
    ],
  },
};

const FALLBACK = {
  title: 'Artículo del blog',
  excerpt: 'Contenido próximamente.',
  category: 'General',
  date: '2026',
  readTime: '5 min',
  author: { name: 'Equipo Retiru', initials: 'ER', bio: 'El equipo de contenido de Retiru.' },
  img: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&q=80',
  content: [
    'Este artículo estará disponible próximamente. Mientras tanto, explora nuestros retiros disponibles o descubre otros artículos en el blog.',
  ],
};

const RELATED = [
  { slug: '10-destinos-retiros-espana-2026', title: 'Los 10 mejores destinos para retiros en España en 2026', category: 'Destinos', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80' },
  { slug: 'beneficios-retiro-detox-ayuno', title: 'Beneficios de un retiro detox: qué dice la ciencia', category: 'Bienestar', img: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80' },
  { slug: 'meditacion-guiada-principiantes', title: 'Meditación guiada para principiantes: 5 técnicas', category: 'Meditación', img: 'https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=400&q=80' },
];

function renderContent(blocks: string[]) {
  return blocks.map((block, i) => {
    if (block.startsWith('## ')) {
      return <h2 key={i} className="font-serif text-2xl text-foreground mt-10 mb-4">{block.replace('## ', '')}</h2>;
    }
    if (block.startsWith('**')) {
      return (
        <div key={i} className="text-[15px] text-[#7a6b5d] leading-[1.85] mb-4 whitespace-pre-line">
          {block.split('\n').map((line, j) => {
            const bold = line.match(/\*\*(.*?)\*\*/);
            if (bold) {
              return (
                <p key={j} className="mb-2">
                  <strong className="text-foreground">{bold[1]}</strong>
                  {line.replace(/\*\*.*?\*\*/, '')}
                </p>
              );
            }
            return <p key={j} className="mb-2">{line}</p>;
          })}
        </div>
      );
    }
    if (block.includes('\n\n-')) {
      const parts = block.split('\n\n');
      return (
        <div key={i} className="mb-4">
          {parts[0] && <p className="text-[15px] text-[#7a6b5d] leading-[1.85] mb-3">{parts[0]}</p>}
          <ul className="space-y-2 ml-1">
            {parts.slice(1).map((item, j) => {
              const text = item.replace(/^- /, '');
              const bold = text.match(/\*\*(.*?)\*\*/);
              return (
                <li key={j} className="flex gap-2 text-[15px] text-[#7a6b5d] leading-[1.85]">
                  <span className="text-terracotta-500 mt-1 shrink-0">•</span>
                  <span>
                    {bold ? <><strong className="text-foreground">{bold[1]}</strong>{text.replace(/\*\*.*?\*\*/, '')}</> : text}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      );
    }
    return <p key={i} className="text-[15px] text-[#7a6b5d] leading-[1.85] mb-4">{block}</p>;
  });
}

export default function BlogArticlePage({ params }: { params: { slug: string } }) {
  const article = ARTICLES[params.slug] || FALLBACK;

  return (
    <div>
      {/* Hero image */}
      <div className="relative h-[340px] md:h-[420px] overflow-hidden">
        <img src={article.img} alt={article.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(45,35,25,0.6)] to-transparent" />
      </div>

      <div className="container-wide">
        <article className="max-w-3xl mx-auto -mt-20 relative z-10">
          {/* Card header */}
          <div className="bg-white rounded-3xl border border-sand-200 shadow-elevated p-8 md:p-10 mb-8">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-xs text-[#a09383] mb-5">
              <Link href="/es" className="hover:text-terracotta-600">Inicio</Link>
              <ChevronRight size={12} />
              <Link href="/es/blog" className="hover:text-terracotta-600">Blog</Link>
              <ChevronRight size={12} />
              <span className="text-foreground">{article.category}</span>
            </nav>

            {/* Category + meta */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-terracotta-100 text-terracotta-700">{article.category}</span>
              <span className="text-xs text-[#a09383] flex items-center gap-1"><Calendar size={12} /> {article.date}</span>
              <span className="text-xs text-[#a09383] flex items-center gap-1"><Clock size={12} /> {article.readTime} de lectura</span>
            </div>

            {/* Title */}
            <h1 className="font-serif text-[clamp(24px,4vw,36px)] text-foreground leading-[1.2] mb-5">
              {article.title}
            </h1>

            {/* Author */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-sage-100 rounded-full flex items-center justify-center text-sm font-bold text-sage-700">{article.author.initials}</div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{article.author.name}</p>
                  <p className="text-xs text-[#a09383]">{article.author.bio}</p>
                </div>
              </div>
              <button className="flex items-center gap-1.5 text-sm text-[#7a6b5d] hover:text-terracotta-600 transition-colors">
                <Share2 size={16} /> Compartir
              </button>
            </div>
          </div>

          {/* Article content */}
          <div className="px-2 md:px-4 mb-16">
            {renderContent(article.content)}

            {/* CTA */}
            <div className="mt-12 bg-gradient-to-br from-terracotta-600 to-terracotta-700 rounded-2xl p-8 text-center text-white">
              <h3 className="font-serif text-xl mb-2">¿Listo para tu próximo retiro?</h3>
              <p className="text-white/80 text-sm mb-5">Explora cientos de retiros en España con precios transparentes.</p>
              <Link href="/es/buscar" className="inline-flex items-center gap-2 bg-white text-terracotta-700 font-semibold px-6 py-3 rounded-xl hover:bg-white/90 transition-colors text-sm">
                Explorar retiros
              </Link>
            </div>
          </div>
        </article>

        {/* Related articles */}
        <section className="max-w-5xl mx-auto mb-16">
          <h2 className="font-serif text-2xl mb-6">Artículos relacionados</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {RELATED.map((r) => (
              <Link
                key={r.slug}
                href={`/es/blog/${r.slug}`}
                className="group bg-white rounded-2xl border border-sand-200 overflow-hidden hover:shadow-soft hover:-translate-y-1 transition-all duration-300"
              >
                <div className="aspect-[16/10] overflow-hidden">
                  <img src={r.img} alt={r.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
                <div className="p-4">
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-sand-200 text-[#7a6b5d]">{r.category}</span>
                  <h3 className="font-serif text-base leading-[1.3] mt-2 group-hover:text-terracotta-600 transition-colors line-clamp-2">{r.title}</h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>

      {/* Back */}
      <div className="container-wide pb-12">
        <Link href="/es/blog" className="inline-flex items-center gap-1.5 text-sm text-terracotta-600 font-semibold hover:gap-2.5 transition-all">
          <ArrowLeft size={16} /> Volver al blog
        </Link>
      </div>
    </div>
  );
}
