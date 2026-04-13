'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { SHOP_SURVEY_CATEGORIES } from '@/lib/shop/survey-config';

const STORAGE_SID = 'retiru_shop_survey_sid';
const STORAGE_LEVELS = 'retiru_shop_survey_levels';

type ErrCode = string;

interface ProductInterestSurveyProps {
  lang?: 'es' | 'en';
}

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return '';
  try {
    let sid = sessionStorage.getItem(STORAGE_SID);
    if (sid && /^[a-zA-Z0-9_-]{12,128}$/.test(sid)) return sid;
    sid =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? `retiru-${crypto.randomUUID()}`
        : `retiru-${Date.now()}_${Math.random().toString(36).slice(2, 18)}`;
    sessionStorage.setItem(STORAGE_SID, sid);
    return sid;
  } catch {
    return `retiru-${Date.now()}_${Math.random().toString(36).slice(2, 18)}`;
  }
}

function loadStoredLevels(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_LEVELS);
    if (!raw) return {};
    const o = JSON.parse(raw) as unknown;
    if (!o || typeof o !== 'object') return {};
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(o as Record<string, unknown>)) {
      const n = Number(v);
      if (n >= 1 && n <= 5) out[k] = n;
    }
    return out;
  } catch {
    return {};
  }
}

function persistLevels(levels: Record<string, number>) {
  try {
    localStorage.setItem(STORAGE_LEVELS, JSON.stringify(levels));
  } catch {
    /* ignore */
  }
}

export function ProductInterestSurvey({ lang = 'es' }: ProductInterestSurveyProps) {
  const supabase = createClient();
  const [sessionId, setSessionId] = useState('');
  const [levels, setLevels] = useState<Record<string, number>>({});
  const [savingCategory, setSavingCategory] = useState<string | null>(null);
  const [errorByCategory, setErrorByCategory] = useState<Record<string, ErrCode>>({});
  const [comments, setComments] = useState('');
  const [commentSaving, setCommentSaving] = useState(false);
  const [commentError, setCommentError] = useState('');
  const [commentSaved, setCommentSaved] = useState(false);

  const texts = {
    es: {
      title: '¿Qué te gustaría encontrar aquí?',
      subtitle:
        'Toca un número del 1 al 5 en cada categoría: se guarda al instante (puedes valorar solo las que quieras).',
      levels: ['Sin interés', 'Poco', 'Algo', 'Bastante', 'Mucho interés'],
      commentsLabel: 'Comentarios adicionales (opcional)',
      commentsPlaceholder: '¿Algún producto específico que te gustaría ver? ¿Marcas favoritas? Cuéntanos...',
      saveComment: 'Guardar comentario',
      savingComment: 'Guardando…',
      saved: 'Guardado',
      saving: 'Guardando…',
      errors: {
        SAVE_FAILED: 'No se pudo guardar. Inténtalo de nuevo.',
        INVALID_SESSION: 'Sesión no válida. Recarga la página.',
        COMMENT_NEED_RATING: 'Valora al menos una categoría antes de guardar el comentario.',
        EMPTY_COMMENT: 'Escribe un comentario o cancela.',
        INTERNAL: 'Error inesperado.',
      },
    },
    en: {
      title: 'What would you like to find here?',
      subtitle: 'Tap 1–5 for each category — it saves instantly (answer as many or as few as you like).',
      levels: ['Not interested', 'Low', 'Some', 'Good', 'Very interested'],
      commentsLabel: 'Additional comments (optional)',
      commentsPlaceholder: 'Any specific products you\'d like to see? Favorite brands? Tell us...',
      saveComment: 'Save comment',
      savingComment: 'Saving…',
      saved: 'Saved',
      saving: 'Saving…',
      errors: {
        SAVE_FAILED: 'Could not save. Please try again.',
        INVALID_SESSION: 'Invalid session. Reload the page.',
        COMMENT_NEED_RATING: 'Rate at least one category before saving a comment.',
        EMPTY_COMMENT: 'Write a comment first.',
        INTERNAL: 'Unexpected error.',
      },
    },
  };

  const t = texts[lang];

  const errorMessages = useMemo(() => t.errors, [t.errors]);

  const errMsg = (code: string | undefined) => {
    if (!code) return errorMessages.SAVE_FAILED;
    const k = code as keyof typeof errorMessages;
    return errorMessages[k] ?? errorMessages.SAVE_FAILED;
  };

  useEffect(() => {
    setSessionId(getOrCreateSessionId());
    setLevels(loadStoredLevels());
  }, []);

  const postRating = useCallback(
    async (categoryId: string, level: number) => {
      setSavingCategory(categoryId);
      setErrorByCategory((prev) => {
        const next = { ...prev };
        delete next[categoryId];
        return next;
      });

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const body: Record<string, unknown> = {
        action: 'rating',
        productCategory: categoryId,
        interestLevel: level,
      };
      if (!user) body.sessionId = sessionId || getOrCreateSessionId();

      try {
        const res = await fetch('/api/shop/product-interest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = (await res.json().catch(() => ({}))) as { ok?: boolean; code?: string };
        if (!res.ok || !data.ok) {
          setErrorByCategory((prev) => ({
            ...prev,
            [categoryId]: data.code || 'SAVE_FAILED',
          }));
          return;
        }
        setLevels((prev) => {
          const next = { ...prev, [categoryId]: level };
          persistLevels(next);
          return next;
        });
        setCommentSaved(false);
      } catch {
        setErrorByCategory((prev) => ({ ...prev, [categoryId]: 'SAVE_FAILED' }));
      } finally {
        setSavingCategory(null);
      }
    },
    [sessionId, supabase],
  );

  const handleLevelClick = (categoryId: string, level: number) => {
    void postRating(categoryId, level);
  };

  const handleSaveComment = async () => {
    const trimmed = comments.trim();
    if (!trimmed) {
      setCommentError(errorMessages.EMPTY_COMMENT);
      return;
    }
    setCommentError('');
    setCommentSaving(true);
    setCommentSaved(false);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const body: Record<string, unknown> = { action: 'comment', comment: trimmed };
    if (!user) body.sessionId = sessionId || getOrCreateSessionId();

    try {
      const res = await fetch('/api/shop/product-interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; code?: string };
      if (!res.ok || !data.ok) {
        setCommentError(errMsg(data.code));
        return;
      }
      setCommentSaved(true);
    } catch {
      setCommentError(errorMessages.SAVE_FAILED);
    } finally {
      setCommentSaving(false);
    }
  };

  return (
    <div className="bg-white border border-sand-200 rounded-2xl p-6 md:p-10 max-w-3xl mx-auto shadow-sm">
      <div className="text-center mb-10">
        <h3 className="font-serif text-2xl md:text-3xl text-foreground mb-3">{t.title}</h3>
        <p className="text-[#7a6b5d] text-sm md:text-base max-w-xl mx-auto">{t.subtitle}</p>
      </div>

      <div className="space-y-8">
        <div className="bg-sand-50/50 rounded-2xl border border-sand-100 overflow-hidden">
          <div className="hidden md:flex justify-between items-center text-xs font-medium text-[#a09383] uppercase tracking-wider bg-sand-50/80 px-6 py-4 border-b border-sand-100">
            <span>Categoría</span>
            <div className="flex items-center gap-12 mr-2">
              <span>{t.levels[0]}</span>
              <span>{t.levels[4]}</span>
            </div>
          </div>
          
          <div className="md:hidden flex justify-between items-center text-xs font-medium text-[#7a6b5d] bg-sand-50 px-4 py-3 border-b border-sand-100">
            <div className="flex items-center gap-1.5"><span className="w-5 h-5 rounded-full bg-sand-200 flex items-center justify-center text-[10px]">1</span> {t.levels[0]}</div>
            <div className="flex items-center gap-1.5">{t.levels[4]} <span className="w-5 h-5 rounded-full bg-terracotta-600 text-white flex items-center justify-center text-[10px]">5</span></div>
          </div>

          <div className="divide-y divide-sand-100">
            {SHOP_SURVEY_CATEGORIES.map((category) => {
              const label = lang === 'en' ? category.labelEn : category.labelEs;
              const currentLevel = levels[category.id] || 0;
              const errCode = errorByCategory[category.id];
              const isSaving = savingCategory === category.id;

              return (
                <div
                  key={category.id}
                  className="p-4 md:px-6 md:py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl md:text-xl shrink-0" role="img" aria-label={label}>
                      {category.emoji}
                    </span>
                    <div className="flex flex-col">
                      <h4 className="font-medium text-foreground md:text-sm">{label}</h4>
                      <div className="h-4 flex items-center">
                        {isSaving ? (
                          <span className="text-[10px] text-terracotta-500 uppercase tracking-widest">{t.saving}</span>
                        ) : errCode ? (
                          <span className="text-[10px] text-red-500">{errMsg(errCode)}</span>
                        ) : currentLevel > 0 ? (
                          <span className="text-[10px] text-sage-600 uppercase tracking-widest font-semibold flex items-center gap-1">
                            <span className="w-3 h-3 rounded-full bg-sage-100 text-sage-700 flex items-center justify-center text-[8px]">✓</span> {t.saved}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-2 w-full md:w-auto">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <button
                        key={level}
                        type="button"
                        disabled={isSaving}
                        onClick={() => handleLevelClick(category.id, level)}
                        className={`relative w-11 h-11 md:w-10 md:h-10 flex items-center justify-center text-sm font-medium rounded-full transition-all disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-terracotta-400 focus:ring-offset-2 ${
                          currentLevel === level
                            ? 'bg-terracotta-600 text-white shadow-md transform scale-110 z-10'
                            : 'bg-white border border-sand-200 text-[#7a6b5d] hover:border-terracotta-300 hover:text-terracotta-600 hover:bg-terracotta-50'
                        }`}
                        title={t.levels[level - 1]}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-sand-50/30 rounded-2xl p-5 md:p-6 border border-sand-100">
          <label htmlFor="comments" className="block text-sm font-semibold text-foreground mb-2">
            {t.commentsLabel}
          </label>
          <textarea
            id="comments"
            rows={3}
            value={comments}
            onChange={(e) => {
              setComments(e.target.value);
              setCommentSaved(false);
              setCommentError('');
            }}
            placeholder={t.commentsPlaceholder}
            className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta-400 focus:border-transparent resize-none text-sm transition-shadow"
          />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mt-3">
            <div className="min-h-[1.5rem]">
              {commentError ? (
                <p className="text-sm text-red-600">{commentError}</p>
              ) : null}
              {commentSaved ? (
                <p className="text-sm text-sage-700 font-medium flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-sage-100 text-sage-700 flex items-center justify-center text-xs">✓</span> {t.saved}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => void handleSaveComment()}
              disabled={commentSaving || !comments.trim()}
              className="w-full md:w-auto inline-flex items-center justify-center px-6 py-2.5 rounded-full text-sm font-semibold bg-white border border-sand-300 text-[#7a6b5d] hover:border-terracotta-400 hover:text-terracotta-600 hover:bg-terracotta-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {commentSaving ? t.savingComment : t.saveComment}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
