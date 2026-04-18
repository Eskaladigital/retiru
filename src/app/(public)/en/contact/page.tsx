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

        <div className="bg-sand-100 rounded-2xl p-6 text-center mb-8">
          <p className="text-sm text-[#7a6b5d]">Looking for answers first? Check our <Link href="/en/help" className="text-terracotta-600 font-semibold hover:underline">Help Center</Link></p>
        </div>

        <div className="text-center">
          <h2 className="font-serif text-xl mb-2">Follow us</h2>
          <p className="text-sm text-[#7a6b5d] mb-4">Featured centers, retreat inspiration and community updates.</p>
          <div className="flex items-center justify-center gap-3">
            <a
              href="https://www.facebook.com/retiru.es"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Retiru on Facebook"
              className="inline-flex items-center gap-2 bg-white border border-sand-200 text-foreground font-semibold text-sm px-5 py-2.5 rounded-xl hover:shadow-soft hover:border-terracotta-300 transition-all"
            >
              <svg className="w-4 h-4 text-[#1877f2]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M13.5 21v-7.5h2.5l.375-3h-2.875V8.625c0-.866.24-1.458 1.484-1.458h1.588v-2.68A21.5 21.5 0 0 0 14.267 4.5C12 4.5 10.5 5.884 10.5 8.31v2.19H8v3h2.5V21h3Z"/>
              </svg>
              Facebook
            </a>
            <a
              href="https://www.instagram.com/retiru.es"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Retiru on Instagram"
              className="inline-flex items-center gap-2 bg-white border border-sand-200 text-foreground font-semibold text-sm px-5 py-2.5 rounded-xl hover:shadow-soft hover:border-terracotta-300 transition-all"
            >
              <svg className="w-4 h-4 text-terracotta-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
              </svg>
              Instagram
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
