// ============================================================================
// RETIRU · Center directory agreement (public) — /en/legal/contrato-centro
// Full text of the centers directory agreement (€20/month subscription).
// Clauses in src/lib/legal/center-contract.tsx.
// ============================================================================

import Link from 'next/link';
import { centerContractEN } from '@/lib/seo/page-metadata';
import {
  CENTER_CONTRACT_VERSION,
  CenterContractClauses,
} from '@/lib/legal/center-contract';

export const metadata = centerContractEN;

export default function CenterContractPage() {
  return (
    <div className="container-narrow py-12">
      <nav className="mb-8 flex items-center gap-1 text-xs text-muted-foreground">
        <Link href="/en" className="hover:text-terracotta-600">Home</Link>
        <span>›</span>
        <Link href="/en/condiciones" className="hover:text-terracotta-600">Conditions</Link>
        <span>›</span>
        <span className="text-foreground">Center directory agreement</span>
      </nav>

      <div className="flex items-baseline justify-between flex-wrap gap-3 mb-2">
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground">
          Center directory agreement
        </h1>
        <span className="text-[11px] uppercase tracking-wider text-[#a09383]">
          Version {CENTER_CONTRACT_VERSION}
        </span>
      </div>
      <p className="text-muted-foreground mb-8 leading-relaxed">
        Agreement between Retiru and yoga, meditation and ayurveda centers that keep an active listing in the directory. We publish it here so anyone can review it openly, even before claiming their center listing.
      </p>

      <div className="bg-sand-50 border border-sand-200 rounded-2xl p-5 md:p-6 mb-8 text-sm text-[#5e5247] leading-relaxed">
        <p className="mb-2">
          <strong>Who does this apply to?</strong> To physical centers (schools, studios, in-house retreat venues, halls) that appear in the Retiru directory and want to keep a public listing with all features: dashboard management, direct contact with leads, reviews and SEO visibility.
        </p>
        <p className="mb-2">
          <strong>Fee.</strong> €20/month. Centers included during the launch phase enjoy a <strong>6-month courtesy period</strong> before the fee kicks in.
        </p>
        <p>
          <strong>What if I only run occasional retreats?</strong> Then this agreement is not what you need; you need the <Link href="/en/legal/contrato-organizador" className="text-terracotta-600 font-medium hover:underline">organizer agreement</Link>, accepted for free from your dashboard and only charging commission when you publish events.
        </p>
      </div>

      <CenterContractClauses locale="en" />

      <div className="mt-10 bg-white border border-sand-200 rounded-2xl p-6">
        <h2 className="font-serif text-lg text-foreground mb-3">Current status</h2>
        <p className="text-sm text-[#5e5247] leading-relaxed">
          This version of the agreement is an <strong>initial draft</strong> ({CENTER_CONTRACT_VERSION}). Formal acceptance by each center will be activated at the end of its courtesy period, via an electronic acceptance screen equivalent to the organizer's. Any substantial change will be communicated by email at least 30 days in advance.
        </p>
      </div>

      <div className="mt-12 pt-8 border-t border-sand-200 flex flex-wrap gap-4">
        <Link href="/en/condiciones" className="text-sm text-terracotta-600 hover:underline">
          Conditions and pricing
        </Link>
        <Link href="/en/legal/contrato-organizador" className="text-sm text-terracotta-600 hover:underline">
          Organizer agreement
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
