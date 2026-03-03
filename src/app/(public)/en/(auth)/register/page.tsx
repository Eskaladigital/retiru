// /en/register
'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

function RegisterFormEN() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/en';
  const isClaim = searchParams.get('claim') === 'true';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) { setError('Name is required.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (!acceptTerms) { setError('You must accept the terms and privacy policy.'); return; }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName.trim() },
          emailRedirectTo: `${window.location.origin}/api/auth/callback?locale=en&redirect=${encodeURIComponent(redirect)}`,
        },
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setError('An account with this email already exists. Want to sign in?');
        } else {
          setError(signUpError.message);
        }
        return;
      }

      if (data.user && !data.user.identities?.length) {
        setError('An account with this email already exists. Want to sign in?');
        return;
      }

      setSuccess(true);
    } catch {
      setError('Unexpected error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-100 px-4 py-12">
        <div className="w-full max-w-md text-center">
          <Link href="/en" className="inline-flex items-center gap-[3px]">
            <span className="font-serif text-[32px] text-terracotta-700 tracking-[-0.02em]">retiru</span>
            <span className="w-2 h-2 bg-terracotta-600 rounded-full animate-[float_3s_ease-in-out_infinite] -mb-0.5" />
          </Link>
          <div className="bg-white border border-sand-200 rounded-2xl p-8 shadow-soft mt-8">
            <div className="w-16 h-16 bg-sage-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-sage-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="font-serif text-2xl mb-2">Check your email</h2>
            <p className="text-sm text-[#7a6b5d] mb-4">
              We&apos;ve sent a verification link to <strong className="text-foreground">{email}</strong>. Click it to activate your account.
            </p>
            <p className="text-xs text-[#a09383]">
              If you don&apos;t see it, check your spam folder.
            </p>
          </div>
          <p className="text-center text-sm text-[#7a6b5d] mt-6">
            <Link href="/en/login" className="text-terracotta-600 font-semibold hover:underline">Go to sign in</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-100 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/en" className="inline-flex items-center gap-[3px]">
            <span className="font-serif text-[32px] text-terracotta-700 tracking-[-0.02em]">retiru</span>
            <span className="w-2 h-2 bg-terracotta-600 rounded-full animate-[float_3s_ease-in-out_infinite] -mb-0.5" />
          </Link>
          <h1 className="font-serif text-2xl mt-4">{isClaim ? 'Create your account to claim your center' : 'Create account'}</h1>
          <p className="text-sm text-[#7a6b5d] mt-1">{isClaim ? 'Sign up and manage your center profile' : 'Join and discover your next retreat'}</p>
        </div>

        <div className="bg-white border border-sand-200 rounded-2xl p-8 shadow-soft">
          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {error}
              {error.includes('sign in') && (
                <Link href="/en/login" className="block mt-1 text-terracotta-600 font-semibold hover:underline">Sign in →</Link>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Full name</label>
              <input
                type="text"
                placeholder="Your name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl border border-sand-300 text-[15px] outline-none focus:border-terracotta-500 focus:ring-2 focus:ring-terracotta-500/20 transition-all disabled:opacity-60"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
              <input
                type="email"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl border border-sand-300 text-[15px] outline-none focus:border-terracotta-500 focus:ring-2 focus:ring-terracotta-500/20 transition-all disabled:opacity-60"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-sand-300 text-[15px] outline-none focus:border-terracotta-500 focus:ring-2 focus:ring-terracotta-500/20 transition-all disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-[#7a6b5d] hover:text-terracotta-600 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Confirm password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Repeat your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl border border-sand-300 text-[15px] outline-none focus:border-terracotta-500 focus:ring-2 focus:ring-terracotta-500/20 transition-all disabled:opacity-60"
              />
            </div>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-sand-300 text-terracotta-600"
              />
              <span className="text-xs text-[#7a6b5d] leading-relaxed">
                I accept the <Link href="/en/legal/terms" className="text-terracotta-600 underline">Terms of Use</Link> and <Link href="/en/legal/privacy" className="text-terracotta-600 underline">Privacy Policy</Link>
              </span>
            </label>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-terracotta-600 text-white font-semibold py-3.5 rounded-xl hover:bg-terracotta-700 transition-colors shadow-[0_2px_8px_rgba(200,90,48,0.3)] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[#7a6b5d] mt-6">
          Already have an account? <Link href={`/en/login?redirect=${encodeURIComponent(redirect)}`} className="text-terracotta-600 font-semibold hover:underline">Sign in</Link>
        </p>

        <div className="mt-8 bg-sage-50 border border-sage-200 rounded-2xl p-6 text-center">
          <p className="text-sm font-semibold text-sage-800 mb-1">Organize retreats?</p>
          <p className="text-xs text-[#7a6b5d] mb-3">Create your account and then request organizer access</p>
          <Link href="/en/for-organizers" className="text-sm font-semibold text-sage-700 hover:underline">Learn more →</Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPageEN() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-cream-100"><div className="animate-pulse text-[#7a6b5d]">Loading…</div></div>}>
      <RegisterFormEN />
    </Suspense>
  );
}
