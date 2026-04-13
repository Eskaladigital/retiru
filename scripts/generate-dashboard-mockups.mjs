#!/usr/bin/env node
/**
 * Genera 22 imágenes para las landings:
 *   6 dashboard organizador + 6 centros   →  /es/para-organizadores
 *   4 garantías asistente + 6 why retiru  →  /es/para-asistentes
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

// ──────────────────────────────────────────────────────────────
// MOCKUPS A GENERAR — 22 imágenes, variedad máxima de composición
// Regla: alternar dispositivos, personas, flatlay, objetos, manos,
// escenas lifestyle. Nunca dos seguidos con la misma composición.
// ──────────────────────────────────────────────────────────────

const MOCKUPS = [

  // ═══════════════════════════════════════════════════════════
  // A) DASHBOARD ORGANIZADOR (6) — para /es/para-organizadores
  // ═══════════════════════════════════════════════════════════

  {
    filename: 'dashboard-crm-asistentes.png',
    title: 'CRM de asistentes',
    description: `Manos de mujer de piel morena escribiendo en un portatil sobre mesa de madera rustica,
    en la pantalla del portatil interfaz abstracta tipo tabla CRM con filas, circulos de avatar difuminados, badges de color y checkmarks geometricos sin texto legible,
    al lado un cuaderno de espiral abierto con anotaciones a lapiz borrosas, taza de ceramica artesanal con cafe,
    luz natural de manana entrando por ventanal grande, sombras suaves de persianas,
    jardin mediterraneo desenfocado al fondo con buganvilla,
    paleta crema sage terracota, angulo diagonal sobre manos y teclado.`
  },
  {
    filename: 'dashboard-mensajeria.png',
    title: 'Mensajería integrada',
    description: `Mujer joven sentada en sofa de lino beige con tablet iPad en las manos, vista parcial (del pecho a las manos, sin rostro completo),
    en la pantalla del tablet interfaz de chat abstracta con burbujas de mensaje vacias alineadas izquierda y derecha en gris y sage, avatar circular difuminado,
    junto a ella en el sofa un cojin de algodon crudo y una manta de lana,
    mesa baja de madera con vela apagada y planta pothos en maceta de barro,
    luz calida de media tarde filtrando por cortina de lino,
    ambiente salon acogedor mediterraneo, paleta sage crema amber.`
  },
  {
    filename: 'dashboard-checkin-qr.png',
    title: 'Check-in con QR',
    description: `Escena real en entrada de espacio de retiro: mano sosteniendo smartphone vertical mostrando un patron QR abstracto geometrico (cuadricula sin datos escaneables reales),
    de fondo desenfocado pasillo luminoso con pared de cal blanca, estanteria de madera con plantas y cuencos de ceramica,
    suelo de baldosa hidraulica terracota,
    luz de manana intensa lateral, sombras geometricas del marco de la puerta,
    se intuye una persona al fondo de espaldas caminando,
    paleta terracota crema blanco, composicion vertical centrada en mano y telefono.`
  },
  {
    filename: 'dashboard-analiticas.png',
    title: 'Analíticas y KPIs',
    description: `Vista cenital tipo flatlay de escritorio de madera clara con monitor externo mostrando dashboard abstracto con graficos de linea sage y barras horizontales de colores sin numeros legibles,
    junto al monitor MacBook cerrado, libreta moleskine abierta con graficos a lapiz borrosos,
    taza de te verde en cristal, gafas de pasta, un pequeno cactus en maceta blanca,
    boligrafo metalico, clips de colores,
    luz cenital natural, sombras suaves, angulo totalmente cenital mirando desde arriba,
    paleta sage crema terracota, composicion ordenada tipo still life editorial.`
  },
  {
    filename: 'dashboard-wizard-creacion.png',
    title: 'Wizard de creación de retiro',
    description: `Persona de espaldas sentada frente a escritorio amplio junto a ventanal con vista a montana verde desenfocada,
    portatil abierto mostrando wizard de dos columnas abstracto: izquierda campos como rectangulos y barra de progreso segmentada, derecha preview con bloque imagen y lineas grises sin texto legible,
    sobre el escritorio fotos impresas de paisajes y centros de retiro esparcidas, post-its de colores (sin texto), lapiz y regla,
    planta de hoja grande junto a la ventana, cortina de lino ondeando suavemente,
    luz de tarde dorada lateral, paleta sage crema terracota, composicion amplia que incluye persona y entorno.`
  },
  {
    filename: 'dashboard-resenas.png',
    title: 'Gestión de reseñas',
    description: `Mesa de cafe de terraza exterior con mantel de lino: smartphone en soporte mostrando cards abstractas con filas de estrellas amarillas, avatar difuminado y bloques grises sin texto,
    al lado una libreta pequena con boligrafo, croissant en plato de ceramica, vaso de zumo de naranja,
    silla de ratan al fondo desenfocada, macetas con romero y geranios,
    suelo de piedra natural, pared encalada con marco de puerta azul mediterraneo,
    luz de manana mediterranea intensa con sombras duras de toldo,
    paleta terracota sage crema, composicion de lifestyle exterior.`
  },

  // ═══════════════════════════════════════════════════════════
  // B) CENTROS (6) — para /es/para-organizadores (sección centros)
  // ═══════════════════════════════════════════════════════════

  {
    filename: 'centro-directorio-mapa.png',
    title: 'Centro · ficha y mapa en directorio',
    description: `Tablet apoyado en atril de madera sobre mostrador de recepcion de centro de yoga real,
    pantalla con interfaz abstracta de mapa con pin difuminado y card blanca como rectangulos sin texto legible,
    mostrador de madera con cuenco de piedras decorativo, vela en farolillo, folletos de papel kraft apilados sin texto,
    pared de fondo con estanteria de madera y plantas tipo pothos colgante, buda pequeno decorativo,
    luz calida de interior con lampara de fibra natural, paleta sage crema terracota.`
  },
  {
    filename: 'centro-visibilidad-seo.png',
    title: 'Centro · visibilidad SEO',
    description: `Vista aerea cenital tipo flatlay de escritorio con portatil mostrando resultados de busqueda abstractos (bloques horizontales grises sin texto legible, iconos de linea),
    alrededor del portatil: taza de cafe, planta suculenta, tarjetas de visita de carton kraft apiladas sin texto,
    un bloc de notas con diagrama tipo embudo dibujado a lapiz (sin palabras), un telefono movil boca abajo,
    superficie de microcemento gris claro, luz cenital natural difusa,
    paleta blanca sage crema, composicion cenital editorial limpia.`
  },
  {
    filename: 'centro-resenas-valoraciones.png',
    title: 'Centro · reseñas y valoraciones',
    description: `Primer plano de manos de mujer sosteniendo smartphone horizontal sobre fondo desenfocado de sala de yoga con esterillas enrolladas y cojines de meditacion,
    pantalla mostrando cards de valoracion abstractas con estrellas amarillas y bloques grises sin texto,
    unas en color natural, anillos sencillos,
    las manos estan relajadas, sin pose forzada,
    luz natural suave de ventanal lateral, parquet de madera,
    paleta crema sage amber, composicion centrada en manos con contexto de centro de bienestar detras.`
  },
  {
    filename: 'centro-sello-verificado.png',
    title: 'Centro · sello verificado',
    description: `Puerta de entrada de centro de bienestar real: madera envejecida con herraje de forja, junto a la puerta en la pared una placa circular de ceramica artesanal con relieve abstracto tipo sello (sin texto ni logotipo legible) en tonos sage y borde dorado mate,
    maceta de barro con lavanda junto al marco de la puerta, escalon de piedra natural,
    pared encalada con textura real, sombra de arbol en la pared,
    luz de media manana directa, cielo azul mediterraneo arriba,
    paleta sage crema terracota dorado, composicion centrada en la placa y la entrada.`
  },
  {
    filename: 'centro-contacto-canales.png',
    title: 'Centro · contacto directo',
    description: `Recepcionista de espaldas (solo hombros y nuca visibles) sentada ante escritorio de madera con portatil abierto mostrando fila de iconos circulares abstractos (telefono web email) sin simbolos de marca,
    telefono fijo vintage de pasta color crema sobre el escritorio, agenda de anillas abierta,
    detras ventana con vista a patio interior con naranjo, cortina de lino ondeando,
    lampara de mesa con pantalla de rafia, taza con cucharilla,
    luz natural intensa de mediodia, paleta crema sage terracota, ambiente de recepcion calida.`
  },
  {
    filename: 'centro-publicar-retiros.png',
    title: 'Centro · publicar retiros',
    description: `Mesa de trabajo colaborativo: dos personas (vistas solo manos y brazos) trabajando con tablet y portatil,
    tablet mostrando calendario mensual abstracto con celdas grises y algunas resaltadas en terracota sin texto,
    portatil al lado mostrando grid de cards de eventos como rectangulos con franjas de color,
    entre ambos dispositivos: tazas de cafe, lapices de colores, post-its en blanco, un bol de fruta,
    superficie de madera, luz de media manana lateral, jardin desenfocado al fondo,
    paleta crema sage terracota, composicion horizontal amplia tipo coworking.`
  },

  // ═══════════════════════════════════════════════════════════
  // C) ASISTENTES — GARANTÍAS (4) — para /es/para-asistentes
  // ═══════════════════════════════════════════════════════════

  {
    filename: 'att-pago-seguro.png',
    title: 'Asistente · pago seguro escrow',
    description: `Mano de mujer apoyando tarjeta de credito sobre smartphone que esta en la mesa,
    pantalla del smartphone con interfaz abstracta: barra de progreso verde, icono de escudo, bloques de color sin texto legible,
    un candado metalico pequeno decorativo junto al telefono,
    pulsera de hilo y anillo sencillo en la mano,
    mesa de madera con mantel de lino, detras una ventana con cortina blanca y planta en maceta de barro,
    luz de manana suave y calida, sombra de la mano sobre la mesa,
    paleta emerald crema sage, composicion centrada en mano y tarjeta con contexto de seguridad.`
  },
  {
    filename: 'att-eventos-verificados.png',
    title: 'Asistente · eventos verificados',
    description: `Flatlay cenital sobre superficie de lino crudo con varios elementos dispuestos de forma editorial:
    portatil abierto mostrando ficha abstracta de retiro con bloque hero imagen y badge de check circular verde sin texto,
    al lado carpeta kraft con documentos de papel con sellos circulares abstractos difuminados,
    pasaporte real junto a gafas de sol, ticket de avion borroso, un boli y clips,
    taza de te, ramita de olivo decorativa,
    luz cenital natural suave con sombras minimas, paleta sky crema sage, composicion flatlay editorial.`
  },
  {
    filename: 'att-soporte.png',
    title: 'Asistente · soporte dedicado',
    description: `Persona recostada en hamaca de cuerda en terraza exterior, sujetando tablet con ambas manos,
    pantalla del tablet mostrando interfaz de chat abstracta con burbujas vacias y avatar circular,
    no se ve el rostro completo (solo de barbilla a manos), ropa de lino blanco,
    suelo de madera de terraza, barandilla con vista a montana verde desenfocada,
    una toalla doblada y un vaso de agua con rodaja de limon en mesita auxiliar,
    luz de tarde dorada, ambiente relajado de vacaciones,
    paleta amber crema sage, composicion que transmite acompanamiento y tranquilidad.`
  },
  {
    filename: 'att-cancelacion-transparente.png',
    title: 'Asistente · cancelacion transparente',
    description: `Escritorio limpio y ordenado con portatil mostrando timeline horizontal abstracto: circulos conectados por lineas, algunos verdes otros grises, icono de flecha de retorno, bloques de color sin texto,
    junto al portatil un sobre abierto con papel y una hoja de condiciones abstracta (lineas grises),
    cartera de cuero abierta con tarjetas asomando, bolso de viaje tipo weekender de lona al fondo,
    luz de media manana clara, superficie de madera, planta colgante al fondo,
    paleta violet crema sage, composicion que sugiere planificacion tranquila y transparencia.`
  },

  // ═══════════════════════════════════════════════════════════
  // D) ASISTENTES — WHY RETIRU (6) — para /es/para-asistentes
  // ═══════════════════════════════════════════════════════════

  {
    filename: 'att-organizadores-verificados.png',
    title: 'Asistente · organizadores verificados',
    description: `Primer plano de manos entregando documentos: una mano extiende una carpeta kraft con sello circular difuminado (sin texto),
    la otra mano recibe con gesto natural, se ven antebrazos con camisa de lino blanco y pulsera de cuerda,
    de fondo totalmente desenfocado un espacio de recepcion luminoso con pared encalada y plantas,
    luz natural lateral suave de ventana,
    paleta sage crema, composicion centrada en el gesto de entrega y confianza entre personas.`
  },
  {
    filename: 'att-pago-unico.png',
    title: 'Asistente · un solo pago sin sorpresas',
    description: `Smartphone sobre superficie de marmol blanco con vetas grises, pantalla mostrando interfaz abstracta de pago: rectangulo terracota grande (sin cifras legibles), icono de check verde, barras de desglose grises,
    alrededor del telefono: una sola tarjeta de credito, una llave de laton vintage, un billete de avion borroso, unas gafas de lectura,
    nada mas, minimalismo extremo,
    luz cenital suave natural, sin sombras duras,
    paleta terracota crema blanco, composicion minimalista tipo product shot.`
  },
  {
    filename: 'att-resenas-reales.png',
    title: 'Asistente · resenas reales',
    description: `Grupo de tres personas sentadas en cojines de meditacion en el suelo de madera de una sala luminosa, conversando de forma natural (vistas desde atras/lateral, sin rostros directos),
    una de ellas tiene un smartphone en la mano con pantalla mostrando estrellas amarillas abstractas y bloques sin texto,
    ventanales grandes con vista a jardin, esterillas enrolladas al fondo, velas apagadas,
    ropa comoda de colores neutros, sensacion real de final de retiro,
    luz suave de tarde, paleta terracota crema sage, composicion humana y natural.`
  },
  {
    filename: 'att-minimo-viable.png',
    title: 'Asistente · minimo viable garantizado',
    description: `Mesa de salon con portatil mostrando barra de progreso semicircular abstracta (parte rellena en sage, parte vacia en gris claro) y circulos pequenos tipo avatares debajo,
    junto al portatil una agenda abierta con calendario mensual a lapiz (sin fechas legibles), una taza de ceramica humeante,
    en el sofa detras un cojin y una manta doblada, la persona esta fuera de plano o solo se intuye una pierna,
    ventana con luz de media manana, cortina de gasa,
    paleta sage crema, composicion que transmite espera tranquila y sin prisa.`
  },
  {
    filename: 'att-seleccion-curada.png',
    title: 'Asistente · seleccion curada',
    description: `Mujer de espaldas con sombrero de paja mirando un tablero tipo moodboard colgado en pared encalada:
    fotos impresas de paisajes de retiros (montanas, playas, bosques) pegadas con washi tape, junto con tarjetas de carton kraft y cintas de color sin texto legible,
    a su lado mesa auxiliar con mapa de Espana plegado, guia de viaje, taza de cafe, gafas de sol,
    luz de manana lateral intensa con sombra de ventana,
    paleta terracota sage crema, composicion que transmite descubrimiento y curaduria manual.`
  },
  {
    filename: 'att-confirmacion-inmediata.png',
    title: 'Asistente · confirmacion inmediata',
    description: `Mano alzando smartphone con pantalla mostrando icono grande de check verde en circulo y bloques abstractos de color (sin texto),
    de fondo desenfocado la entrada de una finca o casa rural con puerta de madera y jardin,
    maleta de viaje de lona al lado de la persona (solo se ve parte de la pierna y la maleta),
    grava en el suelo, buganvilla en la pared, cielo azul,
    luz intensa de mediodia de verano,
    paleta emerald crema terracota, composicion que transmite llegada y confirmacion.`
  },
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
  
  const skipExisting = process.argv.includes('--skip-existing');

  for (let i = 0; i < MOCKUPS.length; i++) {
    const outFile = join(root, 'public', 'images', MOCKUPS[i].filename);
    if (skipExisting && existsSync(outFile)) {
      console.log(`\n⏭️  Saltando (ya existe): ${MOCKUPS[i].filename}`);
      continue;
    }

    try {
      const result = await processMockup(MOCKUPS[i]);
      results.push(result);
      
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
