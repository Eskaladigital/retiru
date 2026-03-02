// RETIRU · Cookie policy — /en/legal/cookies
import Link from 'next/link';

export const metadata = {
  title: 'Cookie policy',
  description: 'Retiru cookie policy.',
};

export default function CookiesPageEn() {
  return (
    <div className="container-narrow py-12">
      <nav className="mb-8 flex items-center gap-1 text-xs text-muted-foreground">
        <Link href="/en" className="hover:text-terracotta-600">Home</Link>
        <span>›</span>
        <span className="text-foreground">Cookie policy</span>
      </nav>

      <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-12">
        Cookie policy
      </h1>

      <div className="space-y-8 text-[15px] leading-relaxed text-muted-foreground">
        <p>We use technical cookies for session and security, analytics cookies, and third-party cookies (e.g. Stripe for payments). You can manage cookies in your browser settings.</p>
      </div>

      <div className="mt-12 pt-8 border-t border-sand-200 flex flex-wrap gap-4">
        <Link href="/en/legal/terminos" className="text-sm text-terracotta-600 hover:underline">Terms</Link>
        <Link href="/en/legal/privacidad" className="text-sm text-terracotta-600 hover:underline">Privacy</Link>
      </div>
    </div>
  );
}
