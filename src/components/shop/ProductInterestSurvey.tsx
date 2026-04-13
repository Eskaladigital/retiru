'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const PRODUCT_CATEGORIES = [
  { id: 'esterillas-yoga', label: 'Esterillas de yoga', emoji: '🧘' },
  { id: 'cojines-meditacion', label: 'Cojines de meditación', emoji: '🪷' },
  { id: 'bloques-yoga', label: 'Bloques y props de yoga', emoji: '🧱' },
  { id: 'ropa-deportiva', label: 'Ropa deportiva y yoga', emoji: '👕' },
  { id: 'termos-botellas', label: 'Termos y botellas', emoji: '🫗' },
  { id: 'incienso-velas', label: 'Incienso y velas', emoji: '🕯️' },
  { id: 'aceites-esenciales', label: 'Aceites esenciales', emoji: '🌿' },
  { id: 'libros-mindfulness', label: 'Libros de mindfulness y bienestar', emoji: '📚' },
  { id: 'mantas-bolsters', label: 'Mantas y bolsters', emoji: '🛏️' },
  { id: 'joyeria-espiritual', label: 'Joyería y accesorios espirituales', emoji: '📿' },
];

interface ProductInterestSurveyProps {
  lang?: 'es' | 'en';
}

export function ProductInterestSurvey({ lang = 'es' }: ProductInterestSurveyProps) {
  const supabase = createClient();
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<Record<string, number>>({});
  const [comments, setComments] = useState('');

  const texts = {
    es: {
      title: '¿Qué te gustaría encontrar aquí?',
      subtitle: 'Ayúdanos a crear la tienda perfecta para ti. Dinos qué productos te interesan más.',
      interestLabel: 'Nivel de interés',
      levels: ['Sin interés', 'Poco', 'Algo', 'Bastante', 'Mucho interés'],
      commentsLabel: 'Comentarios adicionales (opcional)',
      commentsPlaceholder: '¿Algún producto específico que te gustaría ver? ¿Marcas favoritas? Cuéntanos...',
      submitButton: 'Enviar respuestas',
      submittingButton: 'Enviando...',
      thankYouTitle: '¡Gracias por tu opinión!',
      thankYouMessage: 'Tus respuestas nos ayudarán a crear una tienda que realmente necesitas.',
      errorMessage: 'Hubo un error al enviar. Por favor, intenta de nuevo.',
      minVotesWarning: 'Por favor, valora al menos 3 categorías de productos.',
    },
    en: {
      title: 'What would you like to find here?',
      subtitle: 'Help us create the perfect shop for you. Tell us which products interest you most.',
      interestLabel: 'Interest level',
      levels: ['Not interested', 'Low', 'Some', 'Good', 'Very interested'],
      commentsLabel: 'Additional comments (optional)',
      commentsPlaceholder: 'Any specific products you\'d like to see? Favorite brands? Tell us...',
      submitButton: 'Submit answers',
      submittingButton: 'Submitting...',
      thankYouTitle: 'Thank you for your feedback!',
      thankYouMessage: 'Your answers will help us create a shop you truly need.',
      errorMessage: 'There was an error submitting. Please try again.',
      minVotesWarning: 'Please rate at least 3 product categories.',
    },
  };

  const t = texts[lang];

  const handleInterestChange = (categoryId: string, level: number) => {
    setSelectedInterests((prev) => ({
      ...prev,
      [categoryId]: level,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const votedCategories = Object.keys(selectedInterests).filter((k) => selectedInterests[k] > 0);
    
    if (votedCategories.length < 3) {
      setError(t.minVotesWarning);
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Generar un session_id único si no hay usuario
      const sessionId = user?.id || `anon_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      const entries = votedCategories.map((categoryId) => ({
        user_id: user?.id || null,
        session_id: user?.id ? null : sessionId,
        product_category: categoryId,
        interest_level: selectedInterests[categoryId],
        comments: comments.trim() || null,
      }));

      const { error: insertError } = await supabase
        .from('shop_product_interests')
        .insert(entries);

      if (insertError) throw insertError;

      setSubmitted(true);
    } catch (err: any) {
      console.error('Error submitting survey:', err);
      setError(t.errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-sage-50 border-2 border-sage-200 rounded-2xl p-8 md:p-12 max-w-2xl mx-auto text-center">
        <div className="text-5xl mb-4">✨</div>
        <h3 className="font-serif text-2xl text-foreground mb-3">{t.thankYouTitle}</h3>
        <p className="text-[#7a6b5d] leading-relaxed">{t.thankYouMessage}</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-sand-200 rounded-2xl p-6 md:p-10 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h3 className="font-serif text-2xl md:text-3xl text-foreground mb-2">{t.title}</h3>
        <p className="text-[#7a6b5d] text-sm md:text-base">{t.subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4">
          {PRODUCT_CATEGORIES.map((category) => {
            const currentLevel = selectedInterests[category.id] || 0;
            return (
              <div
                key={category.id}
                className="bg-sand-50 rounded-xl p-4 hover:bg-sand-100/50 transition-colors"
              >
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-2xl" role="img" aria-label={category.label}>
                    {category.emoji}
                  </span>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground">{category.label}</h4>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => handleInterestChange(category.id, level)}
                      className={`flex-1 py-2 px-1 text-xs md:text-sm font-medium rounded-lg transition-all ${
                        currentLevel === level
                          ? 'bg-terracotta-600 text-white shadow-sm scale-105'
                          : 'bg-white border border-sand-200 text-[#7a6b5d] hover:border-terracotta-300'
                      }`}
                      title={t.levels[level - 1]}
                    >
                      {level}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-[10px] text-[#a09383] mt-1.5 px-1">
                  <span>{t.levels[0]}</span>
                  <span>{t.levels[4]}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div>
          <label htmlFor="comments" className="block text-sm font-semibold text-foreground mb-2">
            {t.commentsLabel}
          </label>
          <textarea
            id="comments"
            rows={4}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder={t.commentsPlaceholder}
            className="w-full px-4 py-3 border border-sand-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta-400 focus:border-transparent resize-none text-sm"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-terracotta-600 text-white font-semibold py-4 rounded-xl hover:bg-terracotta-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? t.submittingButton : t.submitButton}
        </button>
      </form>
    </div>
  );
}
