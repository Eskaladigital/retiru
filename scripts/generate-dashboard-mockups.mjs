#!/usr/bin/env node
/**
 * Genera 12 imágenes (6 panel organizador + 6 beneficios centro) para /es/para-organizadores
 * Usa .env.local: OPENAI_API_KEY
 * 
 * Uso:
 *   node scripts/generate-dashboard-mockups.mjs
 */
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const envPath = join(root, '.env.local');

if (!existsSync(envPath)) {
  console.error('❌ Falta .env.local');
  process.exit(1);
}

// Cargar .env.local
readFileSync(envPath, 'utf8').split('\n').forEach((line) => {
  const t = line.trim();
  if (t && !t.startsWith('#')) {
    const eq = t.indexOf('=');
    if (eq > 0) {
      let val = t.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
        val = val.slice(1, -1);
      process.env[t.slice(0, eq).trim()] = val;
    }
  }
});

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.error('❌ Falta OPENAI_API_KEY en .env.local');
  process.exit(1);
}

const OPENAI_IMAGE_MODEL = 'gpt-image-1.5';
const OPENAI_IMAGE_SIZE = '1536x1024';
const OPENAI_IMAGE_QUALITY = 'high';

// Prompts alineados con `agente generador de imágenes.txt`:
// PASO 2 = PROMPT BUILDER GENERICO EXPORTABLE + formato largo tipo Retiru
// PASO 3 = PROMPT REALISM REFINER ORIGINAL (adaptado a "elemento")
// PASO 4 = COLA FINAL USADA EN RETIRU (texto del doc, sin cambios)
const PROMPT_BUILDER_SYSTEM = `Eres un agente senior: director de arte + location scout + especialista en prompts para generacion de imagenes fotorrealistas. Recibes un DOSSIER COMPLETO sobre un elemento de negocio (producto, articulo, categoria, servicio o experiencia). Tu UNICA salida es UN parrafo en espanol que el modelo de imagen usara tal cual: debe ser la mejor posible.

ANTES de escribir (mentalmente, no lo imprimas): (1) Elige el escenario visual mas especifico y honesto con el dossier, no una escena generica. (2) Conecta contexto, uso, materiales, publico y posicionamiento. (3) Elige UNA luz creible de dia o una iluminacion realista coherente con el tipo de escena. (4) Anade 2-4 sustantivos concretos de textura o material alineados con el objeto o entorno, no adjetivos vacios. (5) Si hay conflicto entre campos, prima descripcion larga + titulo + contexto real sobre el resto. (6) Piensa como si un fotografo profesional estuviera capturando una foto editorial real para una portada, una ficha comercial premium o una cabecera de contenido.

REGLAS DURAS:
- No inventes elementos que contradigan el dossier.
- Evita metaforas visuales obvias si hacen que la imagen parezca artificial.
- Si hay personas, pocas, naturales y no posadas; rostros no protagonistas salvo que el caso de uso lo exija.
- Prohibido en la escena: texto legible, logotipos, marcas, interfaces falsas con tipografia incrustada, carteles hero.
- Evita look IA: cielos irreales, piel de plastico, simetria excesiva, oversaturacion, glow, render 3D, pintura digital, ilustracion, perfeccion plastica, HDR agresivo, composicion imposible.

FORMATO DE SALIDA (obligatorio):
- Exactamente UN parrafo en espanol, sin saltos de linea, sin vinetas, sin comillas, sin markdown.
- Entre 400 y 1100 caracteres: denso y cinematografico, pero fotografico (no guion de pelicula).
- Debe empezar con: Fotografia hiperrealista y cinematografica de
- Debe terminar integrando (en la misma frase final o penultima) la idea de: composicion editorial premium, profundidad de campo natural, texturas realistas, encuadre horizontal amplio, sin texto ni logos ni ilustracion, realismo fotografico absoluto, mockup de producto para web de alta conversion.
- La redaccion debe sonar a encargo fotografico real: camara profesional, luz existente, color natural, detalles imperfectos creibles y atmosfera autentica.

No escribas nada antes ni despues del parrafo.`;

const PROMPT_REALISM_REFINER_SYSTEM = `Eres un editor fotografico obsesionado con el hiperrealismo. Recibiras:
1) un DOSSIER del elemento
2) un primer prompt ya redactado

Tu tarea es REESCRIBIR ese prompt para que parezca todavia mas una fotografia real tomada por un fotografo profesional en localizacion real.

Prioridades:
- La imagen debe parecer una FOTO REAL, no arte generativo.
- Si el borrador suena demasiado bonito, demasiado escenificado, demasiado "wellness instagram", demasiado simetrico o demasiado turistico, rebajalo.
- Da prioridad a entorno real, luz existente, materiales concretos, imperfecciones creibles, composicion editorial contenida.
- Si las personas no son imprescindibles para comunicar el retiro, reduce su protagonismo o dejalas lejanas/secundarias. Si aparecen, nada de poses artificiales ni expresiones de anuncio.
- Corrige cualquier tendencia a oscuridad excesiva: nada de noche, nada de sol escondido, nada de cielos dramaticos oscuros; debe sentirse una franja luminosa y comercialmente util de dia.
- Evita cualquier sensacion de fantasia, exceso de color, teatralidad, glow, piel plastica, postal irreal o escena de catalogo falso.

Reglas:
- Manten coherencia absoluta con el dossier.
- Salida: EXACTAMENTE un parrafo en espanol, sin comillas, sin markdown, sin vinetas, sin saltos de linea.
- Debe empezar por "Fotografia hiperrealista y cinematografica de".
- Debe sonar a encargo fotografico premium real, no a instruccion artistica abstracta.
- No anadas explicaciones sobre lo que has cambiado. Devuelve solo el prompt final.`;

const IMAGE_REALISM_TAIL =
  'Tomada como fotografia real con camara full frame profesional y optica de reportaje de alta calidad, luz existente fisicamente creible, color natural y balance de blancos realista, contraste moderado, grano minimo natural, detalle autentico en piel, telas, arena, piedra, vegetacion o arquitectura segun la escena; siempre de dia, luminosa y clara, nunca nocturna ni sombria, con sensacion de franja util entre 09:00 y 20:30 de verano del sur de Espana; si aparecen personas, secundarias, naturales y no posadas; sin HDR agresivo, sin acabado plastico, sin render 3D, sin pintura digital, sin ilustracion, sin tipografia ni logotipos.';

// Mockups a generar
const MOCKUPS = [
  {
    filename: 'dashboard-crm-asistentes.png',
    title: 'CRM de asistentes',
    description: `Interfaz web moderna de CRM para gestion de asistentes a retiros (solo formas, sin texto legible en pantalla).
    Vista principal: tabla de datos limpia con circulos de avatar difuminados o siluetas, filas y columnas, barras de estado en verde y amarillo pastel,
    badges como rectangulos redondeados de color sin letras, checkmarks como iconos geometricos,
    zona de notas como bloques grises vacios, filtros como rectangulos y chevrones abstractos,
    paleta crema, sage suave y terracota para acentos,
    iconografia minimalista tipo lineas y puntos,
    diseno UI estilo Notion o Linear (espaciado generoso, cards sutiles),
    laptop MacBook Pro con pantalla mostrando la interfaz,
    teclado aluminio visible en primer plano,
    luz natural de dia entrando lateral por ventana,
    fondo desenfocado con plantas de interior tipo monstera,
    angulo ligeramente superior,
    reflejos naturales minimos en pantalla.`
  },
  {
    filename: 'dashboard-mensajeria.png',
    title: 'Mensajería integrada',
    description: `Interfaz de mensajeria tipo chat 1a1 (sin texto legible: solo burbujas vacias o lineas grises simulando contenido).
    Burbujas alineadas izquierda y derecha en gris claro y sage suave,
    avatar circular difuminado arriba,
    panel lateral con cards blancas como rectangulos con lineas horizontales grises que sugieren plantillas, sin palabras,
    paleta sage, crema y terracota,
    mucho espacio blanco,
    tablet iPad Pro en soporte sobre mesa de madera clara con vetas,
    luz de media manana,
    taza de ceramica mate, cuaderno abierto con lapiz, suculentas en maceta de barro,
    fondo con estanteria desenfocada,
    angulo diagonal suave,
    reflejos naturales en pantalla tactil.`
  },
  {
    filename: 'dashboard-checkin-qr.png',
    title: 'Check-in con QR',
    description: `Lista de check-in digital para retiro (sin texto legible en UI).
    Tabla con columnas: circulos de avatar difuminados, filas, toggles o switches en verde y gris,
    patrones abstractos tipo codigo QR como cuadricula geometrica en miniatura sin datos escaneables reales,
    icono de check verde como forma geometrica,
    filtros superiores como pastillas de color sin etiquetas,
    paleta terracota y crema,
    laptop MacBook sobre mesa rustica de madera con vetas,
    luz natural de manana,
    tablet al lado con layout responsive en miniatura,
    taza de cafe en cristal, romero en maceta de terracota,
    ventanal y jardin mediterraneo desenfocado.`
  },
  {
    filename: 'dashboard-analiticas.png',
    title: 'Analíticas y KPIs',
    description: `Dashboard de analiticas estilo Stripe o Vercel (sin numeros ni palabras legibles: barras y lineas abstractas).
    Cards superiores con bloques de color y graficos de linea suave en sage con area degradada,
    grafica de barras horizontales como rectangulos de longitud variable,
    lista de filas grises con puntos de color,
    UI minimalista con mucho blanco,
    iconos como trazos simples,
    paleta crema, sage y terracota suaves,
    monitor externo grande sobre escritorio de madera clara,
    MacBook cerrado al lado, lampara de escritorio metal negro mate,
    monstera en maceta ceramica blanca,
    luz natural lateral, estanteria con libros desenfocada,
    pantalla mate del monitor.`
  },
  {
    filename: 'dashboard-wizard-creacion.png',
    title: 'Wizard de creación de retiro',
    description: `Wizard paso a paso para crear retiro (sin texto legible en pantalla).
    Dos columnas: izquierda formulario con campos como rectangulos, barra de progreso segmentada, chips de color, calendario como cuadricula gris,
    derecha preview con bloque hero imagen, lineas grises que simulan titulo y parrafo, badges circulares de color,
    boton terracota como rectangulo sin palabras,
    paleta sage crema terracota,
    laptop sobre microcemento gris claro,
    luz de tarde suave,
    taza de cristal con te, cuaderno abierto con bocetos a lapiz,
    tablet con vista mobile del mismo layout abstracto,
    lavanda en maceta, cuadro botanico desenfocado en pared.`
  },
  {
    filename: 'dashboard-resenas.png',
    title: 'Gestión de reseñas',
    description: `Gestion de resenas (sin texto legible en UI).
    Cards con estrellas amarillas como formas, avatar circular difuminado, bloques grises para parrafos simulados,
    area de respuesta como rectangulo con borde terracota a la izquierda en algunas cards,
    filtros superiores como pastillas,
    resumen arriba con icono de estrella y barras grises cortas,
    paleta terracota sage y crema,
    laptop MacBook sobre madera clara,
    tablero de corcho con fotos pegadas y post-its de colores sin leer,
    luz de manana, cafe con latte art abstracto,
    aloe en maceta de barro, boligrafo y bloc al lado,
    ventana con cortina de lino desenfocada.`
  },
  {
    filename: 'centro-directorio-mapa.png',
    title: 'Centro · ficha y mapa en directorio',
    description: `Fotografia de producto: pantalla de portatil o tablet mostrando interfaz abstracta de directorio de centros de bienestar,
    mapa con pin circular difuminado, tarjeta de ficha como rectangulos blancos con franjas grises que sugieren fotos y datos sin texto legible,
    barra de busqueda como rectangulo gris vacio,
    paleta sage crema y terracota,
    dispositivo sobre mesa de madera clara, planta pequena, luz de media manana mediterranea,
    fondo ventana desenfocada.`
  },
  {
    filename: 'centro-visibilidad-seo.png',
    title: 'Centro · visibilidad SEO',
    description: `Portatil en escritorio mostrando resultados de busqueda abstractos: lista de bloques horizontales grises de altura variable como filas SERP,
    iconos de linea simples, grafica de barras diminuta en una esquina sin numeros legibles,
    paleta blanca y sage,
    taza de cafe, cuaderno cerrado, luz natural lateral,
    ambiente estudio pequeno luminoso.`
  },
  {
    filename: 'centro-resenas-valoraciones.png',
    title: 'Centro · reseñas y valoraciones',
    description: `Smartphone en soporte sobre mesa mostrando cards de valoracion abstractas: filas de estrellas amarillas como formas,
    barras horizontales grises, circulos de avatar difuminados,
    sin texto legible,
    mesa de madera, luz suave de tarde, planta suculenta al lado.`
  },
  {
    filename: 'centro-sello-verificado.png',
    title: 'Centro · sello verificado',
    description: `Primer plano de pantalla de portatil con badge circular grande estilo sello de verificacion abstracto en verde sage y borde dorado mate,
    sin logotipos de marcas, sin texto legible,
    al lado sobre la mesa tarjeta fisica de carton con relieve que sugiere credencial sin letras,
    lino arrugado, luz de manana clara.`
  },
  {
    filename: 'centro-contacto-canales.png',
    title: 'Centro · contacto directo',
    description: `Mesa de recepcion de centro de yoga: portatil abierto con fila de iconos abstractos circulares grises que sugieren telefono web email redes sin simbolos de marca,
    bloques de color para botones sin palabras,
    jarron de ceramica terracota, agenda de anillas, luz natural calida,
    fondo cortina de lino beige desenfocado.`
  },
  {
    filename: 'centro-publicar-retiros.png',
    title: 'Centro · publicar retiros',
    description: `Tablet y portatil mostrando calendario mensual abstracto con celdas grises y algunas celdas resaltadas en terracota,
    miniaturas de cards de evento como rectangulos con franjas de color sin titulos legibles,
    paleta crema sage terracota,
    superficie de madera, cafe en taza de barro, luz de manana.`
  }
];

async function callOpenAI(messages, temperature = 0.3) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages,
      temperature,
      max_tokens: 900
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

/** PASO 6 del agente: limpiar comillas, colapsar espacios, asegurar apertura obligatoria. */
function normalizeImagePromptParagraph(raw) {
  let s = String(raw).trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }
  s = s.replace(/\s+/g, ' ');
  const required = 'Fotografia hiperrealista y cinematografica de';
  const lower = s.toLowerCase();
  if (!lower.startsWith('fotografia hiperrealista y cinematografica de')) {
    s = `${required} ${s}`.replace(/\s+/g, ' ').trim();
  }
  return s;
}

async function generateImage(prompt) {
  console.log(`   🎨 Generando imagen con gpt-image-1.5...`);
  
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: OPENAI_IMAGE_MODEL,
      prompt,
      n: 1,
      size: OPENAI_IMAGE_SIZE,
      quality: OPENAI_IMAGE_QUALITY,
      output_format: 'png'
    })
  });

  const data = await response.json().catch(() => ({}));
  
  if (!response.ok) {
    throw new Error(data.error?.message || `OpenAI image error (${response.status})`);
  }

  const url = data.data?.[0]?.url;
  const b64 = data.data?.[0]?.b64_json;

  if (url) {
    // Descargar la imagen desde la URL
    const imageResponse = await fetch(url);
    if (!imageResponse.ok) throw new Error('No se pudo descargar la imagen generada.');
    return Buffer.from(await imageResponse.arrayBuffer());
  }

  if (b64) {
    // Usar base64 directamente
    return Buffer.from(b64, 'base64');
  }

  console.error('   Respuesta images/generations sin url ni b64_json:', JSON.stringify(data).slice(0, 500));
  throw new Error('No se recibió ni URL ni base64 de la imagen (revisa modelo y permisos de la API key)');
}

async function processMockup(mockup) {
  console.log(`\n📦 Procesando: ${mockup.title}`);
  
  // 1. Construir dossier
  const dossier = `=== DOSSIER DEL MOCKUP (úsalo entero; prioriza coherencia visual y contexto) ===
Tu salida final será SOLO el párrafo-prompt para el modelo de imagen, no resúmenes de este dossier.

REGLA CRÍTICA (alineada con el agente Retiru): la pantalla del dispositivo muestra interfaz de producto software con bloques, gráficos y formas; prohibido texto legible, logotipos de marcas reales y tipografía incrustada legible.

Título: ${mockup.title}
Descripción completa:
${mockup.description}

Contexto: Mockup para landing page SaaS de plataforma de gestión de retiros de yoga/meditación.
Audiencia: Organizadores de retiros que buscan herramientas profesionales.
Tono de marca: Natural, profesional, mediterráneo, moderno pero cálido.
Ambiente: Oficina o espacio de trabajo luminoso con estética mediterránea.`;

  // 2. Primera pasada: Prompt Builder
  console.log('   ✍️  Paso 1: GPT-4o Prompt Builder...');
  const firstPrompt = await callOpenAI([
    { role: 'system', content: PROMPT_BUILDER_SYSTEM },
    { role: 'user', content: dossier }
  ], 0.32);

  console.log(`   📝 Prompt inicial: ${firstPrompt.slice(0, 150)}...`);

  // 3. Segunda pasada: Realism Refiner
  console.log('   ✨ Paso 2: GPT-4o Realism Refiner...');
  const refinedPrompt = await callOpenAI([
    { role: 'system', content: PROMPT_REALISM_REFINER_SYSTEM },
    { role: 'user', content: `DOSSIER:\n${dossier}\n\nPROMPT INICIAL:\n${firstPrompt}` }
  ], 0.18);

  console.log(`   📝 Prompt refinado: ${refinedPrompt.slice(0, 150)}...`);

  // 4. Normalizar (PASO 6 agente) + cola final (PASO 4 agente)
  const body = normalizeImagePromptParagraph(refinedPrompt);
  const finalPrompt = `${body} ${IMAGE_REALISM_TAIL}`.replace(/\s+/g, ' ').trim();
  
  // Validar longitud
  if (finalPrompt.length < 200) {
    throw new Error('Prompt final demasiado corto');
  }
  if (finalPrompt.length > 4000) {
    console.warn('   ⚠️  Prompt final muy largo, truncando...');
  }

  // 5. Generar imagen
  const imageBuffer = await generateImage(finalPrompt.slice(0, 4000));
  
  // 6. Guardar imagen
  const outputDir = join(root, 'public', 'images');
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }
  
  const outputPath = join(outputDir, mockup.filename);
  writeFileSync(outputPath, imageBuffer);
  
  console.log(`   ✅ Guardado en: public/images/${mockup.filename}`);
  
  return { filename: mockup.filename, prompt: finalPrompt };
}

async function main() {
  console.log('🚀 Generador de mockups del dashboard\n');
  console.log(`📋 ${MOCKUPS.length} imágenes a generar\n`);

  const results = [];
  
  for (let i = 0; i < MOCKUPS.length; i++) {
    try {
      const result = await processMockup(MOCKUPS[i]);
      results.push(result);
      
      // Pausa entre llamadas para evitar rate limits
      if (i < MOCKUPS.length - 1) {
        console.log('   ⏳ Esperando 3s antes de continuar...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
      console.error(error);
    }
  }

  console.log('\n✨ Proceso completado!');
  console.log(`\n📊 Resumen: ${results.length}/${MOCKUPS.length} imágenes generadas`);
  
  if (results.length > 0) {
    console.log('\n📁 Archivos generados:');
    results.forEach(r => console.log(`   - public/images/${r.filename}`));
  }
}

main().catch(console.error);
