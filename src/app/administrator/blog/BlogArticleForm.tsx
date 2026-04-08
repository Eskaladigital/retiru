'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import slugify from 'slugify';
import { RichTextEditor } from '@/components/admin/RichTextEditor';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Save, Upload, X, ImageOff } from 'lucide-react';
import Link from 'next/link';

const schema = z.object({
  title_es: z.string().min(1, 'Título requerido'),
  title_en: z.string().optional(),
  slug: z.string().min(1, 'Slug requerido'),
  slug_en: z.string().optional(),
  excerpt_es: z.string().min(1, 'Extracto requerido'),
  excerpt_en: z.string().optional(),
  content_es: z.string().min(1, 'Contenido requerido'),
  content_en: z.string().optional(),
  category_id: z.string().min(1, 'Categoría requerida'),
  cover_image_url: z.string().optional(),
  read_time_min: z.coerce.number().min(1).max(120).default(5),
  is_published: z.boolean().default(false),
  meta_title_es: z.string().optional(),
  meta_description_es: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface BlogArticleFormProps {
  categories: { id: string; name_es: string; slug: string }[];
  article?: {
    id: string;
    title_es: string;
    title_en: string | null;
    slug: string;
    slug_en: string | null;
    excerpt_es: string;
    excerpt_en: string | null;
    content_es: string;
    content_en: string | null;
    category_id: string;
    cover_image_url: string | null;
    read_time_min: number;
    is_published: boolean;
    meta_title_es: string | null;
    meta_description_es: string | null;
  };
}

export function BlogArticleForm({ categories, article }: BlogArticleFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: article
      ? {
          title_es: article.title_es,
          title_en: article.title_en || '',
          slug: article.slug,
          slug_en: article.slug_en || '',
          excerpt_es: article.excerpt_es,
          excerpt_en: article.excerpt_en || '',
          content_es: article.content_es,
          content_en: article.content_en || '',
          category_id: article.category_id,
          cover_image_url: article.cover_image_url || '',
          read_time_min: article.read_time_min,
          is_published: article.is_published,
          meta_title_es: article.meta_title_es || '',
          meta_description_es: article.meta_description_es || '',
        }
      : {
          title_es: '',
          title_en: '',
          slug: '',
          slug_en: '',
          excerpt_es: '',
          excerpt_en: '',
          content_es: '',
          content_en: '',
          category_id: categories[0]?.id || '',
          cover_image_url: '',
          read_time_min: 8,
          is_published: false,
          meta_title_es: '',
          meta_description_es: '',
        },
  });

  const titleEs = watch('title_es');
  const titleEn = watch('title_en');

  const handleTitleChange = () => {
    if (!article && titleEs) {
      setValue(
        'slug',
        slugify(titleEs, { lower: true, strict: true }).slice(0, 80)
      );
    }
  };

  const handleTitleEnChange = () => {
    if (!article && titleEn) {
      setValue(
        'slug_en',
        slugify(titleEn, { lower: true, strict: true }).slice(0, 80)
      );
    }
  };

  const coverUrl = watch('cover_image_url');

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('El archivo seleccionado no es una imagen');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen supera 5 MB. Elige una más pequeña.');
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `blog/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: upErr } = await supabase.storage.from('retreat-images').upload(path, file, {
        cacheControl: '31536000',
        upsert: false,
      });

      if (upErr) throw new Error(upErr.message);

      const { data: urlData } = supabase.storage.from('retreat-images').getPublicUrl(path);
      if (!urlData?.publicUrl) throw new Error('No se obtuvo URL pública');
      setValue('cover_image_url', urlData.publicUrl);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error desconocido';
      setError(`Error al subir imagen: ${msg}`);
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    setError(null);
    try {
      const url = article ? `/api/admin/blog/${article.id}` : '/api/admin/blog';
      const method = article ? 'PUT' : 'POST';
      const body = {
        ...data,
        title_en: data.title_en || null,
        slug_en: data.slug_en || null,
        excerpt_en: data.excerpt_en || null,
        content_en: data.content_en || null,
        cover_image_url: data.cover_image_url || null,
        meta_title_es: data.meta_title_es || null,
        meta_description_es: data.meta_description_es || null,
      };
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || 'Error al guardar');
        return;
      }
      router.push('/administrator/blog');
      router.refresh();
    } catch (e) {
      setError('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="flex items-center justify-between">
        <Link
          href="/administrator/blog"
          className="inline-flex items-center gap-2 text-sm text-[#7a6b5d] hover:text-terracotta-600"
        >
          <ArrowLeft size={16} /> Volver al blog
        </Link>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 bg-terracotta-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-terracotta-700 disabled:opacity-50"
        >
          <Save size={18} /> {saving ? 'Guardando...' : 'Guardar'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Título (ES) *</label>
            <input
              {...register('title_es')}
              onBlur={handleTitleChange}
              className="w-full px-4 py-3 rounded-xl border border-sand-200 text-foreground focus:border-terracotta-500 focus:ring-2 focus:ring-terracotta-500/20"
              placeholder="Título del artículo"
            />
            {errors.title_es && <p className="text-red-600 text-xs mt-1">{errors.title_es.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Título (EN)</label>
            <input
              {...register('title_en')}
              onBlur={handleTitleEnChange}
              className="w-full px-4 py-3 rounded-xl border border-sand-200 text-foreground focus:border-terracotta-500 focus:ring-2 focus:ring-terracotta-500/20"
              placeholder="Article title (optional)"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Extracto (ES) *</label>
            <textarea
              {...register('excerpt_es')}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-sand-200 text-foreground focus:border-terracotta-500 focus:ring-2 focus:ring-terracotta-500/20"
              placeholder="Resumen breve para listados y SEO"
            />
            {errors.excerpt_es && <p className="text-red-600 text-xs mt-1">{errors.excerpt_es.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Contenido (ES) *</label>
            <RichTextEditor
              value={watch('content_es')}
              onChange={(v) => setValue('content_es', v)}
              placeholder="Escribe el contenido del artículo..."
              height={400}
            />
            {errors.content_es && <p className="text-red-600 text-xs mt-1">{errors.content_es.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Contenido (EN)</label>
            <RichTextEditor
              value={watch('content_en') || ''}
              onChange={(v) => setValue('content_en', v)}
              placeholder="Article content (optional)"
              height={300}
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-sand-200 rounded-2xl p-6 sticky top-24">
            <h3 className="font-serif text-lg mb-4">Publicación</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Slug (ES) *</label>
                <input
                  {...register('slug')}
                  className="w-full px-4 py-2.5 rounded-xl border border-sand-200 text-foreground text-sm focus:border-terracotta-500"
                  placeholder="url-del-articulo"
                />
                {errors.slug && <p className="text-red-600 text-xs mt-1">{errors.slug.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Slug (EN)</label>
                <input
                  {...register('slug_en')}
                  className="w-full px-4 py-2.5 rounded-xl border border-sand-200 text-foreground text-sm focus:border-terracotta-500"
                  placeholder="article-url-in-english"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Categoría *</label>
                <select
                  {...register('category_id')}
                  className="w-full px-4 py-2.5 rounded-xl border border-sand-200 text-foreground text-sm focus:border-terracotta-500"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name_es}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Imagen de portada</label>

                <div className="space-y-3">
                  {coverUrl ? (
                    <div className="relative group rounded-xl overflow-hidden border border-sand-200">
                      <img
                        src={coverUrl}
                        alt="Portada"
                        className="w-full h-40 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setValue('cover_image_url', '')}
                        className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Quitar imagen"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="w-full h-28 rounded-xl border-2 border-dashed border-sand-300 flex flex-col items-center justify-center text-[#a09383] gap-1">
                      <ImageOff size={24} />
                      <span className="text-xs">Sin imagen</span>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                      e.target.value = '';
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-sand-200 text-sm text-[#7a6b5d] hover:bg-sand-50 disabled:opacity-50 transition-colors"
                  >
                    <Upload size={14} />
                    {uploading ? 'Subiendo...' : 'Subir imagen'}
                  </button>

                  <input
                    {...register('cover_image_url')}
                    type="url"
                    className="w-full px-3 py-2 rounded-xl border border-sand-200 text-foreground text-xs focus:border-terracotta-500"
                    placeholder="O pegar URL: https://..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Tiempo de lectura (min)</label>
                <input
                  {...register('read_time_min')}
                  type="number"
                  min={1}
                  max={120}
                  className="w-full px-4 py-2.5 rounded-xl border border-sand-200 text-foreground text-sm focus:border-terracotta-500"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  {...register('is_published')}
                  type="checkbox"
                  id="is_published"
                  className="w-4 h-4 rounded border-sand-300 text-terracotta-600 focus:ring-terracotta-500"
                />
                <label htmlFor="is_published" className="text-sm font-medium text-foreground">
                  Publicar artículo
                </label>
              </div>
            </div>
          </div>

          <div className="bg-white border border-sand-200 rounded-2xl p-6">
            <h3 className="font-serif text-lg mb-4">SEO</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Meta título</label>
                <input
                  {...register('meta_title_es')}
                  className="w-full px-4 py-2.5 rounded-xl border border-sand-200 text-foreground text-sm focus:border-terracotta-500"
                  placeholder="50-60 caracteres"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Meta descripción</label>
                <textarea
                  {...register('meta_description_es')}
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl border border-sand-200 text-foreground text-sm focus:border-terracotta-500"
                  placeholder="150-160 caracteres"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
