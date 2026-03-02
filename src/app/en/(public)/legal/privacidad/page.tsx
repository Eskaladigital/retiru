// RETIRU · Privacy policy — /en/legal/privacidad
import Link from 'next/link';

export const metadata = {
  title: 'Privacy policy',
  description: 'Retiru privacy and data protection policy.',
};

export default function PrivacidadPageEn() {
  return (
    <div className="container-narrow py-12">
      <nav className="mb-8 flex items-center gap-1 text-xs text-muted-foreground">
        <Link href="/en" className="hover:text-terracotta-600">Home</Link>
        <span>›</span>
        <span className="text-foreground">Privacy policy</span>
      </nav>

      <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-12">
        Privacy policy
      </h1>

      <div className="space-y-8 text-[15px] leading-relaxed text-muted-foreground">
        <p>Retiru is the data controller. Contact: legal@retiru.com. We collect data necessary for registration, bookings, and communications. You have rights under GDPR: access, rectification, erasure, portability, and objection.</p>
      </div>

      <div className="mt-12 pt-8 border-t border-sand-200 flex flex-wrap gap-4">
        <Link href="/en/legal/terminos" className="text-sm text-terracotta-600 hover:underline">Terms</Link>
        <Link href="/en/legal/cookies" className="text-sm text-terracotta-600 hover:underline">Cookies</Link>
      </div>
    </div>
  );
}
