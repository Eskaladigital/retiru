// /en/help — Help center (EN)
import type { Metadata } from 'next';
import { helpEN } from '@/lib/seo/page-metadata';

export const metadata: Metadata = helpEN;

const SECTIONS = [
  {
    title: 'For attendees',
    items: [
      {
        q: 'How does booking work?',
        a: 'For most retreats you pay the PVP (listed price per person) in one secure card payment (Stripe). If the retreat has a minimum group size that is not yet met, you can hold a spot without paying until it is reached; you then get a link to pay by the deadline. Retiru handles the booking and the split with the organizer, with no extra surcharge to you.',
      },
      {
        q: 'Can I cancel my booking?',
        a: 'Yes. Each retreat has its cancellation policy (deadlines and percentages based on what you paid). If a refund applies, you receive that amount in full—we do not keep an extra non-refundable "platform fee" from your refund.',
      },
      {
        q: 'How do I contact the organizer?',
        a: "Once your booking is confirmed, you'll have access to direct chat with the organizer from your dashboard.",
      },
      {
        q: 'Does the price include accommodation?',
        a: 'It depends on each retreat. Check the "What\'s included" section on the retreat page.',
      },
    ],
  },
  {
    title: 'For organizers',
    items: [
      {
        q: 'How much does it cost to list retreats?',
        a: "There is no subscription or listing fee. Plus, your first retreat is completely free (0% commission); the second has a 10% fee; and from the third onward the standard commission is 20% of the PVP. The attendee always pays the PVP with no surcharges.",
      },
      {
        q: 'How do I start publishing retreats?',
        a: 'Create your account with email and verify it. In "My events" accept the organizer agreement and upload the documents we require (ID, business registration, civil liability insurance, tax and bank details). You can create drafts and send them for review in parallel. For a retreat to go live, our team must validate your profile and approve the retreat (often within 24-48h once documents are complete). More detail on For centers & organizers.',
      },
      {
        q: 'How do I get paid?',
        a: 'The attendee pays the PVP through the platform when payment is due (or holds a spot without payment until the minimum group size is met, if you set one). Retiru retains the commission for your tier (0%, 10% or 20%) and transfers the net according to the settlement terms in place.',
      },
      {
        q: 'Are my retreats reviewed?',
        a: 'We review retreat content for quality. Your organizer profile must also be documentally validated before we can approve and publish any retreat. Once you have at least one published retreat, new ones may go live directly without the review queue (progressive trust).',
      },
      {
        q: 'Can I generate the cover image with AI?',
        a: 'Yes. When creating or editing an event you can upload up to eight photos: one is the cover (listings and hero on the retreat page) and the rest show in the public gallery. You can use "Generate cover with AI" for a photorealistic image with GPT Image 1.5 from your title and copy. If you upload no images, saving generates a cover automatically when OpenAI is configured on the server.',
      },
    ],
  },
  {
    title: 'For centers',
    items: [
      {
        q: 'How do I claim or propose my center?',
        a: 'If it is already listed, search and use "Claim this center". If it is not listed, sign in, go to "My centers" (Spanish dashboard) and "Propose new center": pick the place in Google Maps and our team reviews it before publication.',
      },
      {
        q: 'How much does a directory listing cost?',
        a: "The directory has a monthly fee of €20/month. During the launch phase, selected centers enjoy 6 months of courtesy. After that, centers that wish to keep their listing active move to the monthly fee.",
      },
      {
        q: 'What can I do once I claim my center?',
        a: 'You can edit your listing (photos, description, hours, services), respond to reviews and publish retreats and events from your profile.',
      },
    ],
  },
  {
    title: 'Payments & security',
    items: [
      {
        q: 'Is paying on Retiru safe?',
        a: 'Yes. We process all payments with Stripe, the same system used by Airbnb, Spotify and Shopify.',
      },
      {
        q: 'What payment methods do you accept?',
        a: 'Credit and debit cards (Visa, Mastercard, American Express).',
      },
      {
        q: 'How do refunds work?',
        a: "According to the retreat's cancellation policy (applied to the total you paid). If a refund applies, it is processed in full to your original card within about 5-10 days, with no extra deduction from Retiru on top of that refund.",
      },
    ],
  },
];

export default function HelpPageEN() {
  return (
    <div className="container-wide py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-serif text-[clamp(28px,4vw,40px)] text-center mb-2">Help Center</h1>
        <p className="text-[#7a6b5d] mb-12 text-center">Got a question? Find the most common answers here.</p>
        {SECTIONS.map((s) => (
          <div key={s.title} className="mb-10">
            <h2 className="font-serif text-2xl mb-4">{s.title}</h2>
            <div className="space-y-3">
              {s.items.map(({ q, a }, i) => (
                <details key={i} className="group bg-white border border-sand-200 rounded-xl">
                  <summary className="flex items-center justify-between p-5 font-semibold cursor-pointer [&::-webkit-details-marker]:hidden text-[15px]">
                    {q}
                    <svg
                      className="w-4 h-4 transition-transform group-open:rotate-90 text-[#a09383] shrink-0 ml-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </summary>
                  <p className="px-5 pb-5 text-sm text-[#7a6b5d] leading-relaxed">{a}</p>
                </details>
              ))}
            </div>
          </div>
        ))}
        <div className="bg-sand-100 rounded-2xl p-8 text-center mt-12">
          <h3 className="font-serif text-xl mb-2">Can&apos;t find what you&apos;re looking for?</h3>
          <p className="text-sm text-[#7a6b5d] mb-4">Write to us and we&apos;ll respond within 24h</p>
          <a
            href="mailto:contacto@retiru.com"
            className="inline-flex items-center gap-2 bg-terracotta-600 text-white font-semibold text-sm px-6 py-3 rounded-xl hover:bg-terracotta-700 transition-colors"
          >
            Contact by email
          </a>
        </div>
      </div>
    </div>
  );
}
