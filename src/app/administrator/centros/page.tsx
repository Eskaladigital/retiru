// /administrator/centros — Gestión de centros (admin)
import { createAdminSupabase } from '@/lib/supabase/server';
import { GenerateDescriptionsButton } from './GenerateDescriptionsButton';
import { CentersTableClient, type CenterRow } from './CentersTableClient';
import { AddCenterButton } from './AddCenterButton';

export const dynamic = 'force-dynamic';

const CENTERS_ADMIN_SELECT_BASE =
  'id, name, slug, city, province, plan, status, type, price_monthly, description_es, cover_url, email, instagram, facebook';

function isMissingSubmittedByColumn(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  if (error.code === '42703') return true;
  const m = (error.message || '').toLowerCase();
  return m.includes('submitted_by') && m.includes('does not exist');
}

export default async function AdminCentrosPage() {
  const supabase = createAdminSupabase();
  // Sin `images`: arrays grandes por fila disparan el tamaño de la respuesta y pueden provocar timeout
  // o carga eterna del loading del layout. La tabla solo usa `cover_url` para la miniatura.
  let { data: centers, error } = await supabase
    .from('centers')
    .select(`${CENTERS_ADMIN_SELECT_BASE}, submitted_by`)
    .order('name')
    .limit(5000);

  if (error && isMissingSubmittedByColumn(error)) {
    ({ data: centers, error } = await supabase
      .from('centers')
      .select(CENTERS_ADMIN_SELECT_BASE)
      .order('name')
      .limit(5000));
  }

  if (error) {
    const hintMigration =
      error.message?.includes('submitted_by') || error.code === '42703'
        ? 'Si el error menciona una columna de `centers`, aplica las migraciones de Supabase en este entorno (p. ej. `013_centers_user_proposals_rls.sql`).'
        : null;
    const hintServiceRole =
      error.message?.toLowerCase().includes('jwt') ||
      error.message?.toLowerCase().includes('invalid api key') ||
      error.message?.toLowerCase().includes('permission denied')
        ? 'Si el error es de autenticación o permisos, revisa `SUPABASE_SERVICE_ROLE_KEY` en el entorno del servidor.'
        : null;
    return (
      <div>
        <h1 className="font-serif text-3xl text-foreground mb-2">Centros</h1>
        <div className="rounded-2xl border border-red-200 bg-red-50 text-red-800 px-5 py-4 text-sm max-w-2xl">
          <p className="font-semibold mb-1">No se pudieron cargar los centros</p>
          <p className="font-mono text-xs break-all opacity-90">{error.message}</p>
          <p className="mt-3 text-[#7a6b5d]">
            El listado público puede seguir funcionando aunque falle esta página: aquí se pide la columna{' '}
            <code className="bg-white/80 px-1 rounded">submitted_by</code> (propuestas de usuario); si no existe en la base de datos de despliegue, la consulta falla.
          </p>
          {hintMigration && <p className="mt-2 text-[#7a6b5d]">{hintMigration}</p>}
          {hintServiceRole && <p className="mt-2 text-[#7a6b5d]">{hintServiceRole}</p>}
        </div>
      </div>
    );
  }

  const list = (centers || []) as CenterRow[];
  const totalMRR = list.reduce((s: number, c) => s + (c.plan === 'featured' ? 65 : c.plan === 'basic' ? 50 : 0), 0);
  const sinDescripcion = list.filter((c) => !c.description_es || c.description_es.trim().length < 80);
  const propuestasPendientes = list.filter((c) => c.status === 'pending_review').length;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8 pt-2">
        <div>
          <h1 className="font-serif text-3xl text-foreground">Centros</h1>
          <p className="text-sm text-[#7a6b5d] mt-1">
            {list.length} centros · MRR: {totalMRR}€/mes
            {propuestasPendientes > 0 && (
              <span className="ml-2 font-semibold text-amber-700">· {propuestasPendientes} propuesta{propuestasPendientes === 1 ? '' : 's'} de usuario pendiente{propuestasPendientes === 1 ? '' : 's'}</span>
            )}
            {sinDescripcion.length > 0 && (
              <span className="ml-2 text-amber-600">· {sinDescripcion.length} sin descripción</span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <GenerateDescriptionsButton />
          <AddCenterButton />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-sand-200 rounded-2xl p-5">
          <p className="text-xs text-[#a09383] uppercase tracking-wider font-semibold">MRR Centros</p>
          <p className="text-2xl font-bold mt-1">{totalMRR}€</p>
        </div>
        <div className="bg-white border border-sand-200 rounded-2xl p-5">
          <p className="text-xs text-[#a09383] uppercase tracking-wider font-semibold">Centros activos</p>
          <p className="text-2xl font-bold mt-1">{list.filter((c) => c.status === 'active').length}</p>
        </div>
        <div className="bg-white border border-sand-200 rounded-2xl p-5">
          <p className="text-xs text-[#a09383] uppercase tracking-wider font-semibold">Sin descripción</p>
          <p className="text-2xl font-bold mt-1">{sinDescripcion.length}</p>
        </div>
      </div>

      <CentersTableClient list={list} />
    </div>
  );
}
