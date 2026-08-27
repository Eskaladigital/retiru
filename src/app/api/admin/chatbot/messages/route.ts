import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/mailing/auth';
import type { ResponseQuality } from '@/lib/chatbot/config';

export async function GET(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const sb = guard.ctx.sb;

  const { searchParams } = new URL(request.url);
  const quality = searchParams.get('quality') as ResponseQuality | null;
  const language = searchParams.get('language');
  const search = searchParams.get('q')?.trim();
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10) || 50, 200);
  const offset = parseInt(searchParams.get('offset') ?? '0', 10) || 0;

  let query = sb
    .from('chatbot_messages')
    .select(
      '*, chatbot_conversations!inner(id, session_id, language, status, last_message_at)',
      { count: 'exact' },
    )
    .eq('role', 'assistant')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (quality) query = query.eq('response_quality', quality);
  if (language) query = query.eq('chatbot_conversations.language', language);
  if (search) query = query.ilike('content', `%${search}%`);

  const { data: assistantMsgs, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = [];
  for (const am of assistantMsgs ?? []) {
    const { data: prevUser } = await sb
      .from('chatbot_messages')
      .select('content')
      .eq('conversation_id', am.conversation_id)
      .eq('role', 'user')
      .lt('created_at', am.created_at)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    rows.push({
      ...am,
      user_question: prevUser?.content ?? '',
    });
  }

  const { data: allAssistant } = await sb
    .from('chatbot_messages')
    .select('response_quality')
    .eq('role', 'assistant');

  const qualityStats: Record<ResponseQuality, number> = {
    correcta: 0,
    mejorable: 0,
    incorrecta: 0,
    sin_tipo: 0,
  };
  for (const m of allAssistant ?? []) {
    const q = (m.response_quality as ResponseQuality) || 'sin_tipo';
    qualityStats[q] = (qualityStats[q] ?? 0) + 1;
  }

  return NextResponse.json({
    ok: true,
    messages: rows,
    total: count ?? 0,
    qualityStats,
  });
}
