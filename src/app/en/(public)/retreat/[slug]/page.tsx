// /en/retreat/[slug] — Retreat detail page (English)
import Link from 'next/link';

const E = {
  title: 'Yoga & Meditation Retreat by the Sea', summary: '7 days of practice in a villa overlooking the sea. Includes accommodation, organic meals and excursions.',
  description: `Immerse yourself in a transformative week at one of Ibiza's most exclusive villas, surrounded by nature with Mediterranean views.\n\nEach day begins with a sunrise yoga session facing the sea, followed by an organic breakfast prepared by our chef. Afternoons alternate between deep meditation workshops, walks to secret coves and free time to enjoy the infinity pool.\n\nThis retreat is designed for all levels, from beginners to advanced practitioners. Our certified instructors adapt each session to your needs.`,
  price: 890, fee: 178, orgAmount: 712, dates: { start: '15 Jun 2026', end: '21 Jun 2026' }, duration: '7 days · 6 nights', location: 'Santa Eulalia, Ibiza',
  maxAttendees: 16, spotsLeft: 4, rating: 4.9, reviews: 47, confirmation: 'automatic', languages: ['Spanish', 'English'],
  images: ['https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1200&q=80','https://images.unsplash.com/photo-1545389336-cf090694435e?w=800&q=80','https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80','https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80'],
  includes: ['Shared villa accommodation','3 organic meals per day','2 daily yoga sessions','Guided meditation','Secret cove excursion','Yoga materials','WiFi'],
  excludes: ['Flights','Airport transfers','Optional spa treatments'],
  schedule: [
    { day: 1, title: 'Arrival & Welcome', items: ['4:00 PM Check-in','6:00 PM Welcome yoga','8:00 PM Dinner & introductions'] },
    { day: 2, title: 'Connection', items: ['7:00 AM Sunrise yoga','9:00 AM Breakfast','11:00 AM Meditation workshop','1:00 PM Lunch','4:00 PM Free time / Beach','7:00 PM Restorative yoga','8:30 PM Dinner'] },
    { day: 7, title: 'Farewell', items: ['7:00 AM Final yoga session','9:00 AM Farewell breakfast','11:00 AM Closing circle','12:00 PM Check-out'] },
  ],
  cancellation: { tiers: [{ days: 30, percent: 100 },{ days: 14, percent: 50 },{ days: 7, percent: 0 }] },
  organizer: { name: 'Ibiza Yoga Retreats', slug: 'ibiza-yoga-retreats', rating: 4.8, reviews: 124, events: 12, verified: true },
  reviewsList: [
    { name: 'Laura M.', date: 'May 2025', rating: 5, text: 'An incredible experience. The sunrise yoga sessions facing the sea were magical. Will definitely return.' },
    { name: 'Sarah K.', date: 'Mar 2025', rating: 4, text: 'Great retreat! The villa is stunning and the yoga sessions were exactly what I needed. Only wish it was longer.' },
  ],
};

export default function EventDetailPageEN({ params }: { params: { slug: string } }) {
  return (
    <div>
      <section className="bg-sand-100"><div className="container-wide py-4"><div className="grid gap-2 md:grid-cols-4 md:grid-rows-2 rounded-2xl overflow-hidden" style={{ maxHeight: '480px' }}><div className="md:col-span-2 md:row-span-2 relative"><img src={E.images[0]} alt={E.title} className="h-full w-full object-cover" style={{ minHeight: '300px' }} /></div>{E.images.slice(1,5).map((img,i)=><div key={i} className="hidden md:block relative"><img src={img} alt="" className="h-full w-full object-cover" /></div>)}</div></div></section>

      <div className="container-wide py-8"><div className="flex gap-10">
        <div className="flex-1 max-w-3xl">
          <nav className="mb-4 flex items-center gap-1 text-xs text-[#7a6b5d]"><Link href="/en" className="hover:text-terracotta-600">Home</Link><span>›</span><Link href="/en/retreats-retiru" className="hover:text-terracotta-600">Events</Link><span>›</span><span className="text-foreground">{E.title}</span></nav>
          <div className="mb-6">
            <div className="mb-2 flex flex-wrap gap-2"><span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-sand-200">Yoga</span>{E.confirmation==='automatic' && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-sage-100 text-sage-700">⚡ Instant confirmation</span>}</div>
            <h1 className="font-serif text-3xl md:text-4xl text-foreground">{E.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-[#7a6b5d]"><span>📍 {E.location}</span><span>📅 {E.dates.start} — {E.dates.end}</span><span>🕐 {E.duration}</span><span>⭐ <strong className="text-foreground">{E.rating}</strong> ({E.reviews} reviews)</span></div>
          </div>
          <section className="mb-10"><h2 className="mb-4 font-serif text-2xl">About this retreat</h2><div className="text-sm text-[#7a6b5d] leading-relaxed whitespace-pre-line">{E.description}</div></section>
          <section className="mb-10 grid gap-6 md:grid-cols-2">
            <div><h3 className="mb-3 font-serif text-xl">What's included</h3><ul className="space-y-2">{E.includes.map((it,i)=><li key={i} className="flex items-start gap-2 text-sm text-[#7a6b5d]"><span className="text-sage-600">✓</span>{it}</li>)}</ul></div>
            <div><h3 className="mb-3 font-serif text-xl">Not included</h3><ul className="space-y-2">{E.excludes.map((it,i)=><li key={i} className="flex items-start gap-2 text-sm text-[#7a6b5d]"><span className="text-sand-400">✗</span>{it}</li>)}</ul></div>
          </section>
          <section className="mb-10"><h2 className="mb-4 font-serif text-2xl">Schedule</h2><div className="space-y-4">{E.schedule.map(d=><div key={d.day} className="rounded-xl border border-sand-200 p-5"><h4 className="mb-2 font-semibold">Day {d.day}: {d.title}</h4><ul className="space-y-1">{d.items.map((it,i)=><li key={i} className="text-sm text-[#7a6b5d]">{it}</li>)}</ul></div>)}</div></section>
          <section className="mb-10 rounded-2xl border border-sand-200 p-6"><h2 className="mb-4 font-serif text-2xl">Organizer</h2><div className="flex items-center gap-4"><div className="w-16 h-16 bg-sage-100 rounded-full flex items-center justify-center text-xl font-bold text-sage-700">{E.organizer.name[0]}</div><div><div className="flex items-center gap-2"><h3 className="font-semibold">{E.organizer.name}</h3>{E.organizer.verified && <span className="text-sage-600">✓</span>}</div><p className="text-sm text-[#7a6b5d]">⭐ {E.organizer.rating} ({E.organizer.reviews} reviews) · {E.organizer.events} events</p></div></div><Link href={`/en/organizer/${E.organizer.slug}`} className="mt-4 inline-block text-sm font-medium text-terracotta-600 hover:underline">View full profile</Link></section>
          <section className="mb-10"><h2 className="mb-4 font-serif text-2xl">Cancellation policy</h2><div className="rounded-xl bg-cream-100 p-5"><p className="mb-3 text-sm font-medium">Standard cancellation</p><ul className="space-y-2">{E.cancellation.tiers.map((t,i)=><li key={i} className="flex items-center gap-2 text-sm text-[#7a6b5d]"><div className={`h-2 w-2 rounded-full ${t.percent===100?'bg-sage-500':t.percent>0?'bg-yellow-500':'bg-red-400'}`} />More than {t.days} days before: {t.percent}% refund</li>)}</ul><p className="mt-3 text-xs text-[#a09383]">Retiru's management fee (20%) is non-refundable.</p></div></section>
          <section className="mb-10"><div className="flex items-center justify-between mb-4"><h2 className="font-serif text-2xl">Reviews</h2><div className="flex items-center gap-2"><span className="text-xl font-bold">⭐ {E.rating}</span><span className="text-sm text-[#7a6b5d]">· {E.reviews} reviews</span></div></div><div className="space-y-4">{E.reviewsList.map((r,i)=><div key={i} className="rounded-xl border border-sand-200 p-5"><div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><div className="w-8 h-8 bg-sage-100 rounded-full flex items-center justify-center text-xs font-bold text-sage-700">{r.name[0]}</div><span className="text-sm font-semibold">{r.name}</span></div><span className="text-xs text-[#a09383]">{r.date}</span></div><p className="text-sm text-[#7a6b5d] leading-relaxed">{r.text}</p></div>)}</div></section>
        </div>

        <aside className="hidden w-96 shrink-0 lg:block"><div className="sticky top-24"><div className="rounded-2xl border border-sand-200 bg-white p-6 shadow-elevated">
          <div className="mb-4 text-center"><span className="text-sm text-[#7a6b5d]">Total price</span><p className="text-3xl font-bold">{E.price}€ <span className="text-base font-normal text-[#7a6b5d]">/ person</span></p></div>
          <div className="mb-6 rounded-xl bg-cream-100 p-4 space-y-2"><div className="flex justify-between text-sm"><span className="text-[#7a6b5d]">Retiru fee (20%)</span><span className="font-semibold text-terracotta-600">{E.fee}€</span></div><div className="flex justify-between text-sm"><span className="text-[#7a6b5d]">To organizer (80%)</span><span className="font-semibold">{E.orgAmount}€</span></div><hr className="border-sand-300"/><p className="text-xs text-[#7a6b5d] leading-relaxed">You pay <strong>{E.fee}€</strong> to Retiru today · The rest ({E.orgAmount}€) goes to the organizer before the retreat.</p></div>
          <div className="mb-6 space-y-3 text-sm text-[#7a6b5d]"><div>📅 {E.dates.start} — {E.dates.end}</div><div>🕐 {E.duration}</div><div className={E.spotsLeft<=3?'text-terracotta-600 font-semibold':''}>👥 {E.spotsLeft<=3?`Only ${E.spotsLeft} spots left!`:`${E.spotsLeft} spots available`}</div><div>🌐 {E.languages.join(', ')}</div>{E.confirmation==='automatic'&&<div className="text-sage-600 font-medium">⚡ Instant confirmation</div>}</div>
          <button className="w-full bg-terracotta-600 text-white font-semibold py-4 rounded-xl text-base hover:bg-terracotta-700 transition-colors shadow-[0_2px_8px_rgba(200,90,48,0.3)]">Book your spot · {E.fee}€</button>
          <p className="mt-3 text-center text-xs text-[#a09383]">🔒 Secure payment with Stripe</p>
        </div></div></aside>
      </div></div>

      <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-sand-300 px-4 py-3 shadow-[0_-4px_20px_rgba(45,35,25,0.1)] z-50 lg:hidden"><div className="flex items-center justify-between"><div><p className="text-lg font-bold">{E.price}€</p><p className="text-xs text-[#7a6b5d]">Pay today {E.fee}€</p></div><button className="bg-terracotta-600 text-white font-semibold px-8 py-3 rounded-xl">Book · {E.fee}€</button></div></div>
    </div>
  );
}
