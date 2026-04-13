import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server';
import { ConfigClient } from './ConfigClient';

export default async function ConfiguracionPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/es/login?redirect=/es/panel/configuracion');

  const admin = createAdminSupabase();

  const { data: orgProfile } = await admin
    .from('organizer_profiles')
    .select('id, business_name, description_es, location, website, instagram, phone, languages, logo_url, tax_id')
    .eq('user_id', user.id)
    .single();

  if (!orgProfile) redirect('/es/login');

  const profile = {
    businessName: orgProfile.business_name || '',
    bio: orgProfile.description_es || '',
    location: orgProfile.location || '',
    website: orgProfile.website || '',
    instagram: orgProfile.instagram || '',
    phone: orgProfile.phone || '',
    languages: orgProfile.languages || ['es'],
    logoUrl: orgProfile.logo_url,
    taxId: orgProfile.tax_id,
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-foreground">Configuración</h1>
        <p className="text-sm text-[#7a6b5d] mt-1">Gestiona tu perfil de organizador y preferencias</p>
      </div>

      <section className="bg-white border border-sand-200 rounded-2xl p-6 mb-6">
        <h2 className="font-serif text-xl mb-4">Perfil público</h2>
        <p className="text-sm text-[#7a6b5d] mb-5">Esta información será visible para los asistentes.</p>
        <ConfigClient profile={profile} />
      </section>

      <section className="bg-white border border-sand-200 rounded-2xl p-6 mb-6">
        <h2 className="font-serif text-xl mb-4">Notificaciones</h2>
        <p className="text-sm text-[#7a6b5d] mb-5">Elige qué notificaciones quieres recibir por email.</p>

        <div className="space-y-4">
          {[
            { label: 'Nueva reserva', description: 'Cuando un asistente reserva plaza en tu retiro', default: true },
            { label: 'Cancelación', description: 'Cuando un asistente cancela su reserva', default: true },
            { label: 'Nuevo mensaje', description: 'Cuando recibes un mensaje de un asistente', default: true },
            { label: 'Nueva reseña', description: 'Cuando un asistente deja una reseña', default: false },
            { label: 'Recordatorios de pago', description: 'Avisos sobre pagos o liquidaciones pendientes', default: true },
            { label: 'Informes mensuales', description: 'Resumen mensual de rendimiento de tus retiros', default: false },
          ].map((notif) => (
            <label key={notif.label} className="flex items-start gap-3 cursor-pointer opacity-50 pointer-events-none">
              <input type="checkbox" defaultChecked={notif.default} className="mt-0.5 w-4 h-4 rounded border-sand-300 text-terracotta-600 focus:ring-terracotta-500" disabled />
              <div>
                <p className="text-sm font-medium text-foreground">{notif.label}</p>
                <p className="text-xs text-[#a09383]">{notif.description}</p>
              </div>
            </label>
          ))}
        </div>
        <p className="text-xs text-[#a09383] mt-4">Próximamente: configuración de notificaciones</p>
      </section>

      <section className="bg-white border border-sand-200 rounded-2xl p-6">
        <h2 className="font-serif text-xl mb-4">Datos fiscales y bancarios</h2>
        <p className="text-sm text-[#7a6b5d] mb-5">
          Estos datos se gestionan en la sección de verificación para garantizar la seguridad.
        </p>

        <div className="bg-sand-50 border border-sand-200 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-3 mb-2">
            <svg className="w-5 h-5 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-semibold text-foreground">Datos fiscales verificados</p>
          </div>
          {profile.taxId && (
            <p className="text-sm text-[#7a6b5d]">NIF/CIF: {profile.taxId}</p>
          )}
        </div>

        <Link
          href="/es/panel/verificacion"
          className="inline-flex items-center gap-2 text-sm font-semibold text-terracotta-600 hover:underline"
        >
          Ver documentación completa →
        </Link>
      </section>
    </div>
  );
}
