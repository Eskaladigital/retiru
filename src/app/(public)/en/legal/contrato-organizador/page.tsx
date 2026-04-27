// ============================================================================
// RETIRU · Organizer agreement (public) — /en/legal/contrato-organizador
// Full text of the agreement every organizer accepts before publishing their
// first retreat. Clauses live in src/lib/legal/organizer-contract.tsx.
// ============================================================================

import Link from 'next/link';
import { organizerContractEN } from '@/lib/seo/page-metadata';
import {
  CONTRACT_VERSION,
  OrganizerContractClauses,
} from '@/lib/legal/organizer-contract';

export const metadata = organizerContractEN;

export default function OrganizerAgreementPage() {
  return (
    <div className="container-narrow py-12">
      <nav className="mb-8 flex items-center gap-1 text-xs text-muted-foreground">
        <Link href="/en" className="hover:text-terracotta-600">Home</Link>
        <span>›</span>
        <Link href="/en/condiciones" className="hover:text-terracotta-600">Conditions</Link>
        <span>›</span>
        <span className="text-foreground">Organizer agreement</span>
      </nav>

      <div className="flex items-baseline justify-between flex-wrap gap-3 mb-2">
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground">
          Organizer agreement
        </h1>
        <span className="text-[11px] uppercase tracking-wider text-[#a09383]">
          Version {CONTRACT_VERSION}
        </span>
      </div>
      <p className="text-muted-foreground mb-8 leading-relaxed">
        Full text of the agreement that every organizer accepts electronically from their dashboard before publishing their first retreat or event on Retiru. We publish it here so any visitor — attendees, centers and organizers — can review it openly without needing an account.
      </p>

      <div className="bg-sand-50 border border-sand-200 rounded-2xl p-5 md:p-6 mb-8 text-sm text-[#5e5247] leading-relaxed">
        <p className="mb-2">
          <strong>Who does this apply to?</strong> To the individuals or companies that create retreats, getaways or events and publish them on Retiru as <em>organizers</em>.
        </p>
        <p>
          <strong>What about centers in the directory?</strong> Centers that keep a public listing in the directory sign a different agreement: the <Link href="/en/legal/contrato-centro" className="text-terracotta-600 font-medium hover:underline">center directory agreement</Link>. The general website terms are in the <Link href="/en/legal/terminos" className="text-terracotta-600 font-medium hover:underline">legal terms</Link>.
        </p>
      </div>

      <OrganizerContractClauses locale="en" />

      <div className="mt-10 bg-white border border-sand-200 rounded-2xl p-6">
        <h2 className="font-serif text-lg text-foreground mb-3">Electronic acceptance</h2>
        <p className="text-sm text-[#5e5247] leading-relaxed">
          Organizers accept this agreement electronically from their dashboard. The acceptance is recorded with account identifier, date and time (UTC), agreement version and IP address, in line with Spanish Law 34/2002 and the eIDAS Regulation, and has evidential value in case of dispute.
        </p>
        <p className="text-sm text-[#5e5247] leading-relaxed mt-3">
          Any substantial change to the agreement will be communicated in advance and, where applicable, will require new acceptance.
        </p>
      </div>

      <div className="mt-12 pt-8 border-t border-sand-200 flex flex-wrap gap-4">
        <Link href="/en/condiciones" className="text-sm text-terracotta-600 hover:underline">
          Conditions and pricing
        </Link>
        <Link href="/en/legal/contrato-centro" className="text-sm text-terracotta-600 hover:underline">
          Center directory agreement
        </Link>
        <Link href="/en/legal/terminos" className="text-sm text-terracotta-600 hover:underline">
          Legal terms
        </Link>
        <Link href="/en/legal/privacidad" className="text-sm text-terracotta-600 hover:underline">
          Privacy policy
        </Link>
      </div>
    </div>
  );
}
