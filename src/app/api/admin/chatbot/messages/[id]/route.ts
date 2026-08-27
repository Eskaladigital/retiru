import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/mailing/auth';
import type { ResponseQuality } from '@/lib/chatbot/config';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const sb = guard.ctx.sb;
  const { id } = await params;

  const { data, error } = await sb.from('chatbot_messages').select('*').eq('id', id).single();
  if (error || !data) {
    return NextResponse.json({ error: 'Mensaje no encontrado' }, { status: 404 });
  }

  let user_question = '';
  if (data.role === 'assistant') {
    const { data: prev } = await sb
      .from('chatbot_messages')
      .select('content')
      .eq('conversation_id', data.conversation_id)
      .eq('role', 'user')
      .lt('created_at', data.created_at)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    user_question = prev?.content ?? '';
  }

  return NextResponse.json({ ok: true, message: data, user_question });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const sb = guard.ctx.sb;
  const { id } = await params;

  let body: { response_quality?: string; admin_notes?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const patch: Record<string, string> = {};
  const valid: ResponseQuality[] = ['correcta', 'mejorable', 'incorrecta', 'sin_tipo'];
  if (body.response_quality && valid.includes(body.response_quality as ResponseQuality)) {
    patch.response_quality = body.response_quality;
  }
  if (typeof body.admin_notes === 'string') patch.admin_notes = body.admin_notes;

  if (!Object.keys(patch).length) {
    return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 });
  }

  const { data, error } = await sb
    .from('chatbot_messages')
    .update(patch)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, message: data });
}
