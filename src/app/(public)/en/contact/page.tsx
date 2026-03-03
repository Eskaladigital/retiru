// /en/contact
import type { Metadata } from 'next';
import Link from 'next/link';
import { contactEN } from '@/lib/seo/page-metadata';
export const metadata: Metadata = contactEN;
export default function ContactPageEN() {
  return (
    <div className="container-wide py-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-serif text-[clamp(28px,4vw,40px)] text-foreground mb-2 text-center">Contact us</h1>
        <p className="text-[#7a6b5d] mb-10 text-center">We'd love to hear from you. Get in touch and we'll respond within 24h.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <div className="bg-white border border-sand-200 rounded-2xl p-5 text-center">
            <span className="text-2xl block mb-2">📧</span>
            <h3 className="text-sm font-semibold mb-1">Email</h3>
            <a href="mailto:contacto@retiru.com" className="text-sm text-terracotta-600 hover:underline">contacto@retiru.com</a>
          </div>
          <div className="bg-white border border-sand-200 rounded-2xl p-5 text-center">
            <span className="text-2xl block mb-2">⏰</span>
            <h3 className="text-sm font-semibold mb-1">Hours</h3>
            <p className="text-sm text-[#7a6b5d]">Mon–Fri, 9:00–18:00 CET</p>
          </div>
          <div className="bg-white border border-sand-200 rounded-2xl p-5 text-center">
            <span className="text-2xl block mb-2">📍</span>
            <h3 className="text-sm font-semibold mb-1">Location</h3>
            <p className="text-sm text-[#7a6b5d]">Murcia, Spain</p>
          </div>
        </div>

        <div className="bg-sand-100 rounded-2xl p-6 text-center">
          <p className="text-sm text-[#7a6b5d]">Looking for answers first? Check our <Link href="/en/help" className="text-terracotta-600 font-semibold hover:underline">Help Center</Link></p>
        </div>
      </div>
    </div>
  );
}
