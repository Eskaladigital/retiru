// ============================================================================
// RETIRU · Moderación de contenido con IA
// Detecta y limpia datos sensibles de textos de retiros antes de publicar
// ============================================================================

import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';

export interface ContentIssue {
  type: 'contact_info' | 'external_booking' | 'price_mismatch' | 'other';
  field: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  suggestedFix?: string;
}

export interface ModerationResult {
  hasCriticalIssues: boolean;
  issues: ContentIssue[];
  cleanedContent?: {
    description_es?: string;
    description_en?: string;
    schedule?: any;
  };
}

const MODERATION_PROMPT = `Eres un moderador de contenido para Retiru, una plataforma de retiros. Tu trabajo es detectar información sensible que NO debe aparecer en las fichas públicas de retiros.

**REGLAS DE NEGOCIO:**

1. **NUNCA deben aparecer:**
   - Teléfonos (móviles, WhatsApp, Telegram)
   - Emails de contacto personal/directo
   - Enlaces a sistemas de reserva externos (Booking.com, Airbnb, formularios externos)
   - Redes sociales personales para contacto directo
   - Frases como "contáctame en...", "escríbeme a...", "reserva en..."

2. **SÍ pueden aparecer:**
   - Nombres de facilitadores/profesores (ej: "Facilitación: María Pérez")
   - Nombres de empresas coordinadoras (ej: "Coordinación en Marruecos: Marruecos Mágico Viaje")
   - URLs de alojamientos mencionados como referencia (ej: "Riad Jolie — https://www.riad-jolie.com")
   - Instagram/redes del NEGOCIO (no personal) si no invitan a saltarse Retiru
   - Precios que coincidan EXACTAMENTE con el rango oficial del retiro

3. **PRECIOS:**
   - Si el texto menciona un precio, debe coincidir con el precio oficial del sistema
   - Si menciona precios diferentes o "descuentos especiales por contacto directo" → FLAG crítico

4. **PARIDAD description_es / description_en:**
   - Deben ser la misma ficha en dos idiomas: mismos hechos, mismo nivel de detalle comercial y las mismas cifras de precio (o ninguna en cuerpo de descripción si así está el otro idioma).
   - Si una lengua añade bloque de precio, datos de contacto, "desde X € en otro canal" o nombres de terceros que la otra no tiene → marca issue (severity high si implica precio distinto al oficial o saltarse Retiru).
   - Si solo una lengua menciona un importe y contradice \`official_price\` → \`price_mismatch\` en el campo afectado.

**Tu tarea:**
Analiza el contenido y devuelve un JSON con:
- \`issues\`: array de problemas encontrados (type, field, severity, description, suggestedFix)
- \`hasCriticalIssues\`: true si hay algo que impide publicar (severity: high)

Tipos de issue:
- \`contact_info\`: emails, teléfonos, WhatsApp
- \`external_booking\`: links a booking/reserva externa
- \`price_mismatch\`: precios diferentes al oficial
- \`other\`: otros problemas

Severity:
- \`high\`: impide publicar (datos de contacto directo, booking externo, precios incorrectos)
- \`medium\`: revisar manualmente (ambiguo)
- \`low\`: informativo

**Formato de respuesta (solo JSON válido, sin markdown):**
{
  "hasCriticalIssues": boolean,
  "issues": [
    {
      "type": "contact_info" | "external_booking" | "price_mismatch" | "other",
      "field": "description_es" | "description_en" | "schedule.day1" | etc,
      "severity": "high" | "medium" | "low",
      "description": "descripción del problema en español",
      "suggestedFix": "sugerencia de cómo arreglarlo (opcional)"
    }
  ]
}`;

export async function moderateRetreatContent(content: {
  description_es?: string;
  description_en?: string;
  schedule?: any[];
  official_price: number;
  title: string;
}): Promise<ModerationResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('ANTHROPIC_API_KEY no configurada, saltando moderación de contenido');
    return {
      hasCriticalIssues: false,
      issues: [],
    };
  }

  const contentToCheck = JSON.stringify({
    title: content.title,
    official_price: content.official_price,
    description_es: content.description_es || '',
    description_en: content.description_en || '',
    schedule: content.schedule || [],
  }, null, 2);

  try {
    const { text } = await generateText({
      model: anthropic('claude-3-5-sonnet-20241022'),
      system: MODERATION_PROMPT,
      prompt: `Analiza este contenido de retiro y detecta información sensible que no debe publicarse:

\`\`\`json
${contentToCheck}
\`\`\`

Devuelve SOLO el JSON de moderación, sin texto adicional.`,
      temperature: 0.1,
    });

    const result = JSON.parse(text.trim()) as ModerationResult;
    return result;
  } catch (error) {
    console.error('Error en moderación de contenido:', error);
    // En caso de error, no bloqueamos la publicación pero lo registramos
    return {
      hasCriticalIssues: false,
      issues: [{
        type: 'other',
        field: 'system',
        severity: 'medium',
        description: 'Error al ejecutar moderación automática. Revisar manualmente.',
      }],
    };
  }
}
