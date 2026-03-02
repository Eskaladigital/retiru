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
            <a href="mailto:hello@retiru.es" className="text-sm text-terracotta-600 hover:underline">hello@retiru.es</a>
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

        <div className="bg-white border border-sand-200 rounded-2xl p-8">
          <h2 className="font-serif text-xl mb-6">Send us a message</h2>
          <form className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-1.5">Name</label><input type="text" placeholder="Your name" className="w-full px-4 py-3 rounded-xl border border-sand-300 text-[15px] outline-none focus:border-terracotta-500 focus:ring-2 focus:ring-terracotta-500/20" /></div>
              <div><label className="block text-sm font-medium mb-1.5">Email</label><input type="email" placeholder="you@email.com" className="w-full px-4 py-3 rounded-xl border border-sand-300 text-[15px] outline-none focus:border-terracotta-500 focus:ring-2 focus:ring-terracotta-500/20" /></div>
            </div>
            <div><label className="block text-sm font-medium mb-1.5">Subject</label><select className="w-full px-4 py-3 rounded-xl border border-sand-300 text-[15px] outline-none focus:border-terracotta-500 bg-white"><option value="">Choose a topic...</option><option>Booking question</option><option>Organizer inquiry</option><option>Technical issue</option><option>Refund or cancellation</option><option>Other</option></select></div>
            <div><label className="block text-sm font-medium mb-1.5">Message</label><textarea rows={5} placeholder="How can we help?" className="w-full px-4 py-3 rounded-xl border border-sand-300 text-[15px] outline-none focus:border-terracotta-500 focus:ring-2 focus:ring-terracotta-500/20 resize-none" /></div>
            <button type="submit" className="bg-terracotta-600 text-white font-semibold px-8 py-3 rounded-xl hover:bg-terracotta-700 transition-colors">Send message</button>
          </form>
        </div>

        <div className="bg-sand-100 rounded-2xl p-6 mt-8 text-center">
          <p className="text-sm text-[#7a6b5d]">Looking for answers first? Check our <Link href="/en/help" className="text-terracotta-600 font-semibold hover:underline">Help Center</Link></p>
        </div>
      </div>
    </div>
  );
}
