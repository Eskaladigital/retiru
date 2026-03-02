// /en/blog
import type { Metadata } from 'next';
import Link from 'next/link';
import { blogEN } from '@/lib/seo/page-metadata';
export const metadata: Metadata = blogEN;
const POSTS=[
  {slug:'best-yoga-retreats-spain-2026',title:'The 10 Best Yoga Retreats in Spain for 2026',excerpt:'From Ibiza to the Basque Country, discover the most inspiring yoga experiences.',date:'15 Feb 2026',category:'Guides',img:'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&q=80'},
  {slug:'how-to-choose-first-retreat',title:'How to Choose Your First Retreat',excerpt:'A complete guide to picking the perfect retreat for your goals and budget.',date:'8 Feb 2026',category:'Tips',img:'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&q=80'},
  {slug:'digital-detox-benefits',title:'Why a Digital Detox Retreat Could Change Your Life',excerpt:'Science-backed benefits of disconnecting and how a structured retreat helps.',date:'1 Feb 2026',category:'Wellness',img:'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&q=80'},
];
export default function BlogPageEN(){return(<div className="container-wide py-12"><h1 className="font-serif text-[clamp(28px,4vw,40px)] text-foreground mb-2">Blog</h1><p className="text-[#7a6b5d] mb-10 max-w-lg">Guides, tips and inspiration for your next retreat</p><div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">{POSTS.map(p=><Link key={p.slug} href={`/en/blog/${p.slug}`} className="group bg-white rounded-2xl overflow-hidden border border-sand-200 hover:shadow-soft transition-all"><div className="aspect-[16/10] overflow-hidden"><img src={p.img} alt={p.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"/></div><div className="p-5"><span className="text-xs font-semibold text-terracotta-600">{p.category}</span><h2 className="font-serif text-lg leading-tight mt-1 mb-2">{p.title}</h2><p className="text-sm text-[#7a6b5d] line-clamp-2 mb-3">{p.excerpt}</p><span className="text-xs text-[#a09383]">{p.date}</span></div></Link>)}</div></div>);}
