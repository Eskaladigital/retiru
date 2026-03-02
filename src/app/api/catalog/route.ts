// GET /api/catalog — Categories, destinations (para home y filtros)
import { NextResponse } from 'next/server';
import { getCategories, getDestinations } from '@/lib/data';

export async function GET() {
  try {
    const [categories, destinations] = await Promise.all([
      getCategories('es'),
      getDestinations('es'),
    ]);
    return NextResponse.json({ categories, destinations });
  } catch (error) {
    console.error('[api/catalog]', error);
    return NextResponse.json(
      { error: 'Error al cargar catálogo' },
      { status: 500 }
    );
  }
}
