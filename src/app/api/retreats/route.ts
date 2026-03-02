// GET /api/retreats — Lista retiros publicados (para client components)
import { NextRequest, NextResponse } from 'next/server';
import { getPublishedRetreats } from '@/lib/data';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categorySlug = searchParams.get('category') || undefined;
    const destinationSlug = searchParams.get('destination') || undefined;
    const limit = parseInt(searchParams.get('limit') || '12', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const { retreats, total } = await getPublishedRetreats({
      categorySlug,
      destinationSlug,
      limit,
      offset,
    });

    return NextResponse.json({ retreats, total });
  } catch (error) {
    console.error('[api/retreats]', error);
    return NextResponse.json(
      { error: 'Error al cargar retiros' },
      { status: 500 }
    );
  }
}
