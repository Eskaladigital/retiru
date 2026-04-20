// src/lib/center-type-editorial.ts
// Contenido editorial estático por tipo de centro (yoga / meditación / ayurveda).
// Alimenta los bloques de la landing nacional /{locale}/centros/[tipo]:
//   - "Estilos más practicados"
//   - "Cómo elegir"
//   - FAQs extra para completar hasta 10 cuando categories.faq viene corto.
// Mantener evergreen: nada de años concretos.

export type CenterTypeKey = 'yoga' | 'meditation' | 'ayurveda';

export interface EditorialStyle {
  name: string;
  description_es: string;
  description_en: string;
}

export interface EditorialTip {
  title_es: string;
  title_en: string;
  body_es: string;
  body_en: string;
}

export interface EditorialFaq {
  question_es: string;
  answer_es: string;
  question_en: string;
  answer_en: string;
}

export const STYLES_BY_TYPE: Record<CenterTypeKey, EditorialStyle[]> = {
  yoga: [
    { name: 'Hatha', description_es: 'Ritmo pausado, ideal para empezar: posturas estáticas, respiración consciente.', description_en: 'Slow pace, ideal for beginners: static postures and conscious breathing.' },
    { name: 'Vinyasa', description_es: 'Secuencias fluidas sincronizadas con la respiración. Más dinámico.', description_en: 'Flowing sequences synced with the breath. More dynamic.' },
    { name: 'Ashtanga', description_es: 'Serie fija y exigente, combina fuerza y flexibilidad.', description_en: 'Fixed and demanding series combining strength and flexibility.' },
    { name: 'Yin', description_es: 'Posturas sostenidas 3–5 min para trabajar tejido conectivo.', description_en: 'Postures held 3–5 min to target connective tissue.' },
    { name: 'Kundalini', description_es: 'Kriyas, mantras y pranayama para movilizar la energía.', description_en: 'Kriyas, mantras and pranayama to move inner energy.' },
    { name: 'Restaurativo', description_es: 'Pocas posturas sostenidas con soportes. Relajación profunda.', description_en: 'Few long-held postures with props. Deep relaxation.' },
    { name: 'Iyengar', description_es: 'Alineación precisa con uso de cinturones, bloques y mantas.', description_en: 'Precise alignment using belts, blocks and blankets.' },
    { name: 'Aéreo', description_es: 'Posturas sobre columpio de tela, descarga articular.', description_en: 'Postures on fabric swing, joint-friendly.' },
  ],
  meditation: [
    { name: 'Mindfulness', description_es: 'Atención plena al momento presente, basado en MBSR.', description_en: 'Present-moment awareness, MBSR-based.' },
    { name: 'Vipassana', description_es: 'Observación directa de las sensaciones, tradición Theravada.', description_en: 'Direct observation of sensations, Theravada tradition.' },
    { name: 'Zen (Zazen)', description_es: 'Postura sentada silenciosa, énfasis en la forma y la respiración.', description_en: 'Silent sitting, emphasis on form and breath.' },
    { name: 'Metta', description_es: 'Meditación de amor y bondad hacia uno mismo y los demás.', description_en: 'Loving-kindness meditation toward self and others.' },
    { name: 'Trascendental', description_es: 'Uso de mantra personal en dos sesiones diarias.', description_en: 'Personal mantra repeated in two daily sessions.' },
    { name: 'Guiada', description_es: 'Visualizaciones o escáner corporal dirigido por un instructor.', description_en: 'Visualizations or body scan guided by an instructor.' },
  ],
  ayurveda: [
    { name: 'Consulta ayurvédica', description_es: 'Diagnóstico de dosha (Vata, Pitta, Kapha) y plan de vida.', description_en: 'Dosha (Vata, Pitta, Kapha) assessment and lifestyle plan.' },
    { name: 'Abhyanga', description_es: 'Masaje completo con aceites herbales calientes.', description_en: 'Full-body massage with warm herbal oils.' },
    { name: 'Shirodhara', description_es: 'Aceite tibio vertido de forma continua sobre la frente.', description_en: 'Warm oil continuously poured over the forehead.' },
    { name: 'Panchakarma', description_es: 'Programa intensivo de desintoxicación de varios días.', description_en: 'Multi-day intensive detoxification program.' },
    { name: 'Nutrición ayurvédica', description_es: 'Dieta personalizada por dosha y estación.', description_en: 'Dosha- and season-specific personalized diet.' },
    { name: 'Yoga terapéutico', description_es: 'Secuencias adaptadas al desequilibrio doshico.', description_en: 'Sequences adapted to doshic imbalance.' },
  ],
};

export const HOW_TO_CHOOSE_BY_TYPE: Record<CenterTypeKey, EditorialTip[]> = {
  yoga: [
    { title_es: 'Define tu objetivo', title_en: 'Define your goal', body_es: 'Flexibilidad, fuerza, calma mental o recuperación: cada estilo aporta algo distinto.', body_en: 'Flexibility, strength, mental calm or recovery: each style offers something different.' },
    { title_es: 'Prueba una clase introductoria', title_en: 'Try an introductory class', body_es: 'Casi todos los centros ofrecen una primera sesión gratis o a precio reducido.', body_en: 'Most centers offer a first free or discounted session.' },
    { title_es: 'Mira horarios y ubicación reales', title_en: 'Check real schedule and location', body_es: 'Un centro cerca de casa o del trabajo sostiene mucho mejor el hábito.', body_en: 'A center near home or work supports habit more effectively.' },
    { title_es: 'Fíjate en la formación del profesorado', title_en: 'Check the teachers’ training', body_es: 'Certificaciones Yoga Alliance (RYT-200/500) o escuelas reconocidas son buena señal.', body_en: 'Yoga Alliance certifications (RYT-200/500) or recognized schools are good signs.' },
  ],
  meditation: [
    { title_es: 'Elige una tradición y dale tiempo', title_en: 'Pick one tradition and stick with it', body_es: 'Alternar muchos estilos al principio dificulta notar avances. Da 4–6 semanas a cada uno.', body_en: 'Switching too often makes progress hard to notice. Give each style 4–6 weeks.' },
    { title_es: 'Mejor grupo que solo', title_en: 'Group beats going solo', body_es: 'La práctica grupal (Sangha) sostiene mucho más la regularidad.', body_en: 'Group practice (Sangha) keeps you consistent.' },
    { title_es: 'Asegúrate de poder preguntar', title_en: 'Make sure you can ask questions', body_es: 'Un centro con sesiones de preguntas y respuestas ayuda a no atascarse.', body_en: 'Centers with Q&A sessions help you avoid plateaus.' },
    { title_es: 'Revisa precios y modalidades', title_en: 'Review prices and formats', body_es: 'Muchos ofrecen bonos, retiros de fin de semana y formato online como complemento.', body_en: 'Many offer passes, weekend retreats and online format as a complement.' },
  ],
  ayurveda: [
    { title_es: 'Empieza con consulta, no con tratamiento suelto', title_en: 'Start with consultation, not a standalone treatment', body_es: 'Un plan personalizado (dinacharya) rinde mucho más que un masaje aislado.', body_en: 'A personalized plan (dinacharya) outperforms a one-off massage.' },
    { title_es: 'Verifica la formación del terapeuta', title_en: 'Verify the therapist’s training', body_es: 'Ayurveda requiere años de estudio; pregunta por escuela, país e intercambios en India.', body_en: 'Ayurveda takes years of study; ask about school, country and India stays.' },
    { title_es: 'Higiene y trazabilidad de aceites', title_en: 'Hygiene and oil traceability', body_es: 'Aceites certificados, cabinas limpias, sábanas desechables: son señales de calidad.', body_en: 'Certified oils, clean cabins, disposable sheets: all quality signals.' },
    { title_es: 'Duración realista', title_en: 'Realistic duration', body_es: 'Un Panchakarma auténtico dura 7–21 días. Desconfía de promesas de “detox” en 2 horas.', body_en: 'An authentic Panchakarma lasts 7–21 days. Beware 2-hour “detox” promises.' },
  ],
};

/** FAQs adicionales (evergreen) que se concatenan si categories.faq viene con <10 items. */
export const EXTRA_FAQS_BY_TYPE: Record<CenterTypeKey, EditorialFaq[]> = {
  yoga: [
    { question_es: '¿Cuántas veces por semana debería practicar yoga?', answer_es: 'Empieza con 2 sesiones por semana y, si notas progreso, aumenta a 3–4. Más importante que la cantidad es la regularidad.', question_en: 'How often should I practice yoga?', answer_en: 'Start with 2 sessions per week and, if you notice progress, increase to 3–4. Regularity matters more than volume.' },
    { question_es: '¿Hace falta ser flexible para empezar?', answer_es: 'No. El yoga desarrolla la flexibilidad con el tiempo; no es un requisito inicial.', question_en: 'Do I need to be flexible to start?', answer_en: 'No. Yoga develops flexibility over time; it’s not a prerequisite.' },
    { question_es: '¿Qué necesito llevar a una clase?', answer_es: 'Ropa cómoda, una botella de agua y, si quieres, tu propia esterilla. Muchos centros las prestan.', question_en: 'What do I need to bring to class?', answer_en: 'Comfortable clothes, a water bottle and, optionally, your own mat. Many centers lend them.' },
    { question_es: '¿Es compatible con lesiones o dolor de espalda?', answer_es: 'Avisa siempre al instructor antes de empezar. Estilos como Iyengar, Yin o Restaurativo son especialmente adaptables.', question_en: 'Is it compatible with injuries or back pain?', answer_en: 'Always tell the instructor beforehand. Styles like Iyengar, Yin or Restorative are especially adaptable.' },
    { question_es: '¿Cuánto suele costar una clase suelta en España?', answer_es: 'Entre 10 € y 18 € la sesión abierta. Los bonos mensuales (8–16 clases) reducen el coste a 6–10 € por clase.', question_en: 'How much does a drop-in class usually cost in Spain?', answer_en: 'Between €10 and €18 per drop-in. Monthly passes (8–16 classes) bring it down to €6–10 per class.' },
    { question_es: '¿Qué diferencia un centro verificado en Retiru?', answer_es: 'En Retiru revisamos que el centro exista físicamente, tenga información completa y profesorado declarado antes de publicarlo.', question_en: 'What makes a Retiru-verified center different?', answer_en: 'At Retiru we confirm the center exists physically, has full information and disclosed teachers before publishing.' },
  ],
  meditation: [
    { question_es: '¿Cuánto tiempo tengo que meditar al día para notar efectos?', answer_es: 'Con 10–20 minutos diarios durante 4–6 semanas la mayoría de personas reporta beneficios en sueño y estrés.', question_en: 'How long should I meditate daily to feel effects?', answer_en: 'Most people notice sleep and stress benefits with 10–20 minutes a day for 4–6 weeks.' },
    { question_es: '¿Puedo meditar sin una tradición religiosa?', answer_es: 'Sí. Mindfulness y la mayoría de cursos en España son laicos y basados en evidencia científica.', question_en: 'Can I meditate without a religious tradition?', answer_en: 'Yes. Mindfulness and most courses in Spain are secular and evidence-based.' },
    { question_es: '¿Sirve la meditación si tengo ansiedad diagnosticada?', answer_es: 'Puede ser un complemento útil, pero no sustituye a tratamiento clínico. Consulta con tu profesional de salud.', question_en: 'Does meditation help with diagnosed anxiety?', answer_en: 'It can be a useful complement, but not a replacement for clinical treatment. Check with your healthcare provider.' },
    { question_es: '¿Qué postura es la correcta?', answer_es: 'La que puedas sostener sin dolor durante la sesión: silla, cojín en el suelo o de pie. Lo importante es la espalda erguida.', question_en: 'What is the correct posture?', answer_en: 'Whatever you can hold without pain for the session: chair, cushion on the floor or standing. The key is a straight spine.' },
    { question_es: '¿Cómo elijo entre retiro, curso y app?', answer_es: 'Apps para arrancar, curso presencial para tener guía y retiro para profundizar. Muchos centros combinan los tres.', question_en: 'How do I choose between retreat, course and app?', answer_en: 'Apps to start, in-person course for guidance, retreat to go deeper. Many centers combine all three.' },
    { question_es: '¿Es normal distraerse todo el tiempo?', answer_es: 'Sí, es la experiencia por defecto. La práctica consiste en volver a la ancla (respiración, cuerpo) cada vez que te des cuenta.', question_en: 'Is it normal to get distracted constantly?', answer_en: 'Yes, that’s the default experience. Practice is returning to the anchor (breath, body) every time you notice.' },
  ],
  ayurveda: [
    { question_es: '¿Qué diferencia el ayurveda de la medicina occidental?', answer_es: 'Ayurveda parte del equilibrio entre doshas y hábitos diarios (dieta, sueño, rutina). No sustituye a la medicina convencional, la complementa.', question_en: 'How is Ayurveda different from Western medicine?', answer_en: 'Ayurveda works from dosha balance and daily habits (diet, sleep, routine). It complements rather than replaces conventional medicine.' },
    { question_es: '¿Es seguro hacer un tratamiento intensivo tipo Panchakarma?', answer_es: 'Sí, cuando lo pauta un profesional cualificado y se adapta a tu historia clínica. Informa siempre de medicación y patologías crónicas.', question_en: 'Is an intensive treatment like Panchakarma safe?', answer_en: 'Yes, when prescribed by a qualified professional adapted to your medical history. Always disclose medication and chronic conditions.' },
    { question_es: '¿Necesito cambiar mi dieta para beneficiarme del ayurveda?', answer_es: 'Pequeños ajustes por dosha (horarios de comida, especias, temperatura) ya marcan diferencia. No es obligatorio seguir dieta vegetariana estricta.', question_en: 'Do I need to change my diet to benefit from Ayurveda?', answer_en: 'Small dosha-based adjustments (meal timing, spices, temperature) already help. Strict vegetarian diet isn’t mandatory.' },
    { question_es: '¿Es compatible con yoga o meditación?', answer_es: 'Muy compatible. De hecho, ayurveda, yoga y meditación son las tres ramas clásicas complementarias del sistema védico.', question_en: 'Is Ayurveda compatible with yoga or meditation?', answer_en: 'Very compatible. Ayurveda, yoga and meditation are actually three complementary classical branches of the Vedic system.' },
    { question_es: '¿Cuánto cuesta una consulta ayurvédica inicial?', answer_es: 'En España suele oscilar entre 60 € y 120 €, según la experiencia del terapeuta y si incluye tratamiento posterior.', question_en: 'How much does a first Ayurvedic consultation cost?', answer_en: 'In Spain it usually ranges from €60 to €120, depending on the therapist’s experience and whether a follow-up treatment is included.' },
    { question_es: '¿Cómo sé que un centro de ayurveda es serio?', answer_es: 'Busca formación demostrable, protocolos claros, aceites certificados y que no prometa curaciones milagrosas.', question_en: 'How do I know an Ayurveda center is serious?', answer_en: 'Look for verifiable training, clear protocols, certified oils and no miracle-cure promises.' },
  ],
};

export function centerTypeKey(dbType: string): CenterTypeKey | null {
  if (dbType === 'yoga' || dbType === 'meditation' || dbType === 'ayurveda') return dbType;
  return null;
}
