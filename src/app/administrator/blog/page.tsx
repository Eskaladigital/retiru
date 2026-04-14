// /administrator/blog — Gestión de artículos del blog (admin)
import Link from 'next/link';
import { createAdminSupabase } from '@/lib/supabase/server';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Pencil, Plus, Eye, ImageOff } from 'lucide-react';
import { DeleteArticleButton } from './DeleteArticleButton';

export const dynamic = 'force-dynamic';

export default async function AdminBlogPage() {
  const supabase = createAdminSupabase();

  const { data: articles } = await supabase
    .from('blog_articles')
    .select('id, title_es, slug, excerpt_es, cover_image_url, is_published, published_at, read_time_min, view_count, created_at, blog_categories(name_es)')
    .order('created_at', { ascending: false });

  const { data: categories } = await supabase
    .from('blog_categories')
    .select('id, name_es, slug')
    .order('sort_order');

  const list = (articles || []) as Array<{
    id: string;
    title_es: string;
    slug: string;
    excerpt_es: string;
    cover_image_url: string | null;
    is_published?: boolean;
    published_at: string | null;
    read_time_min: number;
    view_count: number;
    created_at: string;
    blog_categories?: { name_es?: string };
  }>;
  const published = list.filter((a) => a.is_published).length;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8 pt-2">
        <div>
          <h1 className="font-serif text-3xl text-foreground">Blog</h1>
          <p className="text-sm text-[#7a6b5d] mt-1">
            {list.length} artículos · {published} publicados
          </p>
        </div>
        <Link
          href="/administrator/blog/nuevo"
          className="inline-flex items-center gap-2 bg-terracotta-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-terracotta-700 transition-colors"
        >
          <Plus size={18} /> Nuevo artículo
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-sand-200 rounded-2xl p-5">
          <p className="text-xs text-[#a09383] uppercase tracking-wider font-semibold">Total artículos</p>
          <p className="text-2xl font-bold mt-1">{list.length}</p>
        </div>
        <div className="bg-white border border-sand-200 rounded-2xl p-5">
          <p className="text-xs text-[#a09383] uppercase tracking-wider font-semibold">Publicados</p>
          <p className="text-2xl font-bold mt-1 text-sage-600">{published}</p>
        </div>
        <div className="bg-white border border-sand-200 rounded-2xl p-5">
          <p className="text-xs text-[#a09383] uppercase tracking-wider font-semibold">Borradores</p>
          <p className="text-2xl font-bold mt-1">{list.length - published}</p>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {list.length === 0 ? (
          <div className="bg-white border border-sand-200 rounded-2xl px-4 py-12 text-center text-[#7a6b5d] text-sm">
            No hay artículos. <Link href="/administrator/blog/nuevo" className="text-terracotta-600 hover:underline">Crear el primero</Link>
          </div>
        ) : (
          list.map((a) => (
            <div key={a.id} className="bg-white border border-sand-200 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-start gap-3">
                <div className="w-14 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-sand-100 border border-sand-200">
                  {a.cover_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.cover_image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#a09383]"><ImageOff size={16} /></div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm line-clamp-2">{a.title_es}</p>
                  <p className="text-xs text-[#a09383] truncate">{(a.blog_categories as { name_es?: string })?.name_es ?? ''}</p>
                </div>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${a.is_published ? 'bg-sage-100 text-sage-700' : 'bg-sand-200 text-[#7a6b5d]'}`}>
                  {a.is_published ? 'Publicado' : 'Borrador'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-[#7a6b5d]">
                <span>{a.view_count ?? 0} vistas</span>
                <span>{a.published_at ? format(new Date(a.published_at), 'd MMM yyyy', { locale: es }) : '—'}</span>
              </div>
              <div className="flex items-center gap-2 pt-1 border-t border-sand-100">
                {a.is_published && (
                  <a href={`/es/blog/${a.slug}`} target="_blank" rel="noopener" className="p-1.5 rounded-lg hover:bg-sand-100 text-[#7a6b5d]" title="Ver en web"><Eye size={16} /></a>
                )}
                <Link href={`/administrator/blog/${a.id}`} className="p-1.5 rounded-lg hover:bg-sand-100 text-terracotta-600" title="Editar"><Pencil size={16} /></Link>
                <DeleteArticleButton articleId={a.id} articleTitle={a.title_es} />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white border border-sand-200 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-sand-200 bg-sand-50">
              <th className="text-left py-3 px-4 font-semibold text-[#7a6b5d]">Artículo</th>
              <th className="text-left py-3 px-4 font-semibold text-[#7a6b5d]">Categoría</th>
              <th className="text-center py-3 px-4 font-semibold text-[#7a6b5d]">Estado</th>
              <th className="text-center py-3 px-4 font-semibold text-[#7a6b5d]">Vistas</th>
              <th className="text-left py-3 px-4 font-semibold text-[#7a6b5d]">Fecha</th>
              <th className="text-right py-3 px-4 font-semibold text-[#7a6b5d]">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr><td colSpan={6} className="py-12 text-center text-[#7a6b5d]">No hay artículos. <Link href="/administrator/blog/nuevo" className="text-terracotta-600 hover:underline">Crear el primero</Link></td></tr>
            ) : (
              list.map((a) => (
                <tr key={a.id} className="border-b border-sand-100 hover:bg-sand-50/50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-sand-100 border border-sand-200">
                        {a.cover_image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={a.cover_image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#a09383]"><ImageOff size={16} /></div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{a.title_es}</div>
                        <div className="text-xs text-[#a09383] truncate max-w-xs">{a.excerpt_es}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-[#7a6b5d]">{(a.blog_categories as { name_es?: string })?.name_es ?? '—'}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${a.is_published ? 'bg-sage-100 text-sage-700' : 'bg-sand-200 text-[#7a6b5d]'}`}>{a.is_published ? 'Publicado' : 'Borrador'}</span>
                  </td>
                  <td className="py-3 px-4 text-center">{a.view_count ?? 0}</td>
                  <td className="py-3 px-4 text-[#7a6b5d]">{a.published_at ? format(new Date(a.published_at), 'd MMM yyyy', { locale: es }) : '—'}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-2">
                      {a.is_published && <a href={`/es/blog/${a.slug}`} target="_blank" rel="noopener" className="p-1.5 rounded-lg hover:bg-sand-100 text-[#7a6b5d]" title="Ver en web"><Eye size={16} /></a>}
                      <Link href={`/administrator/blog/${a.id}`} className="p-1.5 rounded-lg hover:bg-sand-100 text-terracotta-600" title="Editar"><Pencil size={16} /></Link>
                      <DeleteArticleButton articleId={a.id} articleTitle={a.title_es} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
