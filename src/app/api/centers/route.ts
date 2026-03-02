// GET /api/centers — Lista centros activos (para client components)
import { NextRequest, NextResponse } from 'next/server';
import { getActiveCenters } from '@/lib/data';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const province = searchParams.get('province') || undefined;
    const type = searchParams.get('type') || undefined;
    const limit = parseInt(searchParams.get('limit') || '12', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const { centers, total } = await getActiveCenters({
      province,
      type,
      limit,
      offset,
    });

    return NextResponse.json({ centers, total });
  } catch (error) {
    console.error('[api/centers]', error);
    return NextResponse.json(
      { error: 'Error al cargar centros' },
      { status: 500 }
    );
  }
}
