import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/mailing/auth';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const sb = guard.ctx.sb;
  const { id } = await params;

  const { data: conversation, error } = await sb
    .from('chatbot_conversations')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !conversation) {
    return NextResponse.json({ error: 'Conversación no encontrada' }, { status: 404 });
  }

  const { data: messages } = await sb
    .from('chatbot_messages')
    .select('*')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true });

  return NextResponse.json({ ok: true, conversation, messages: messages ?? [] });
}
