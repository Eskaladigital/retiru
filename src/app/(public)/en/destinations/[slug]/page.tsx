// /en/destinations/[slug]
import Link from 'next/link';
import type { Metadata } from 'next';
import { getDestinationSlugs } from '@/lib/data';
import { generatePageMetadata } from '@/lib/seo';

const MOCK=[{slug:'yoga-retreat-ibiza',title:'Yoga & Meditation Retreat by the Sea',price:790,location:'Santa Eulalia',dates:'15–20 Jun 2026 · 6 days',rating:4.9,reviews:23,spots:3,spotsLow:true,instant:true,category:'Yoga',img:'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=600&q=80'},{slug:'ayurveda-retreat-ibiza',title:'Ayurveda & Yoga Immersion',price:980,location:'San Juan',dates:'10–14 Aug 2026 · 5 days',rating:4.9,reviews:12,spots:4,spotsLow:true,instant:true,category:'Ayurveda',img:'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600&q=80'}];
const INFO:Record<string,{name:string;region:string;desc:string;img:string}>={ibiza:{name:'Ibiza',region:'Balearics',desc:'The white island offers much more than parties: secret coves, magical sunsets and a unique energy.',img:'https://images.unsplash.com/photo-1534766555764-ce878a4e947d?w=1200&q=80'},mallorca:{name:'Mallorca',region:'Balearics',desc:'Mountains, sea and culture. Mallorca is ideal for yoga, meditation and ayurveda retreats.',img:'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1200&q=80'}};

export async function generateStaticParams() {
  const slugs = await getDestinationSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const name = INFO[slug]?.name || slug;

  return generatePageMetadata({
    title: `Yoga and meditation retreats in ${name} | Retiru`,
    description: `Discover the best wellbeing retreats and getaways in ${name}. Compare dates, prices and book with instant confirmation.`,
    locale: 'en',
    path: `/en/destinations/${slug}`,
    altPath: `/es/destinos/${slug}`,
    keywords: ['retreats', name, 'yoga', 'meditation', 'spain'],
  });
}
export default async function DestDetailEN({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const info=INFO[slug]||{name:slug,region:'',desc:'',img:'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80'};return(<div><div className="relative h-[300px] md:h-[400px]"><img src={info.img} alt={info.name} className="w-full h-full object-cover"/><div className="absolute inset-0 bg-gradient-to-t from-[rgba(45,35,25,0.7)] via-[rgba(45,35,25,0.3)] to-transparent"/><div className="absolute bottom-0 left-0 right-0 container-wide pb-10"><Link href="/en/destinations" className="inline-flex items-center gap-1 text-sm text-white/80 hover:text-white mb-3">← Destinations</Link><h1 className="font-serif text-4xl md:text-5xl text-white">{info.name}</h1><p className="text-white/80 mt-2 max-w-lg">{info.desc}</p></div></div><div className="container-wide py-12"><p className="text-sm text-[#a09383] mb-8">{MOCK.length} retreats in {info.name}</p><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{MOCK.map(e=><Link key={e.slug} href={`/en/retreat/${e.slug}`} className="group bg-white rounded-2xl overflow-hidden border border-sand-200 transition-all duration-[350ms] hover:shadow-elevated hover:-translate-y-1"><div className="relative aspect-[16/10] overflow-hidden"><img src={e.img} alt={e.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"/><div className="absolute top-3 left-3 flex gap-1.5"><span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm">{e.category}</span>{e.instant&&<span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[rgba(92,127,96,0.9)] text-white">⚡ Instant</span>}</div></div><div className="p-5"><div className="flex items-center justify-between mb-2 text-[13px]"><span className="text-[#7a6b5d]">📍 {e.location}</span><span className="font-semibold">⭐ {e.rating} ({e.reviews})</span></div><h3 className="font-serif text-xl leading-[1.3] mb-2">{e.title}</h3><p className="text-sm text-[#7a6b5d] mb-4">📅 {e.dates}</p><div className="flex items-end justify-between pt-4 border-t border-sand-200"><div><span className="text-xs text-[#a09383] uppercase tracking-wider font-semibold">From</span><br/><span className="text-2xl font-bold">{e.price}€</span> <span className="text-sm text-[#7a6b5d]">/person</span></div><span className={`text-[13px] font-medium ${e.spotsLow?'text-terracotta-600':'text-sage-600'}`}>{e.spotsLow?'🔥 ':''}{e.spots} spots</span></div></div></Link>)}</div></div></div>);}
