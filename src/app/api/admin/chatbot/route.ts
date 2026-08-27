import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/mailing/auth';
import { RESPONSE_QUALITY_SCORE, type ResponseQuality } from '@/lib/chatbot/config';

function emptyStats() {
  return {
    totalResponses: 0,
    totalConversations: 0,
    byQuality: { correcta: 0, mejorable: 0, incorrecta: 0, sin_tipo: 0 } as Record<ResponseQuality, number>,
  };
}

export async function GET(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const sb = guard.ctx.sb;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '100', 10) || 100, 300);
  const offset = parseInt(searchParams.get('offset') ?? '0', 10) || 0;

  let query = sb
    .from('chatbot_conversations')
    .select('*', { count: 'exact' })
    .order('last_message_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq('status', status);

  const { data: conversations, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const ids = (conversations ?? []).map((c) => c.id);
  const previews = new Map<
    string,
    {
      count: number;
      assistantCount: number;
      unclassified: number;
      classified: number;
      scoreSum: number;
      firstUser: string;
      last: string;
    }
  >();

  if (ids.length > 0) {
    const { data: messages } = await sb
      .from('chatbot_messages')
      .select('conversation_id, role, content, created_at, response_quality')
      .in('conversation_id', ids)
      .order('created_at', { ascending: true });

    for (const m of messages ?? []) {
      const entry = previews.get(m.conversation_id) || {
        count: 0,
        assistantCount: 0,
        unclassified: 0,
        classified: 0,
        scoreSum: 0,
        firstUser: '',
        last: '',
      };
      entry.count++;
      const text = m.content?.trim() || '';
      if (m.role === 'user' && !entry.firstUser) entry.firstUser = text;
      if (m.role === 'assistant') {
        entry.assistantCount++;
        const qd = (m.response_quality || 'sin_tipo') as ResponseQuality;
        if (qd === 'sin_tipo') {
          entry.unclassified++;
        } else if (qd in RESPONSE_QUALITY_SCORE) {
          entry.classified++;
          entry.scoreSum += RESPONSE_QUALITY_SCORE[qd as Exclude<ResponseQuality, 'sin_tipo'>];
        }
      }
      entry.last = text;
      previews.set(m.conversation_id, entry);
    }
  }

  const result = (conversations ?? []).map((c) => {
    const p = previews.get(c.id) || {
      count: 0,
      assistantCount: 0,
      unclassified: 0,
      classified: 0,
      scoreSum: 0,
      firstUser: '',
      last: '',
    };
    return {
      id: c.id,
      created_at: c.created_at,
      last_message_at: c.last_message_at,
      language: c.language,
      status: c.status,
      contact_name: c.contact_name,
      session_id: c.session_id,
      message_count: p.count,
      assistant_count: p.assistantCount,
      unclassified_responses: p.unclassified,
      classified_responses: p.classified,
      quality_score: p.classified > 0 ? Math.round((p.scoreSum / p.classified) * 10) / 10 : null,
      first_user_message: p.firstUser,
      last_message: p.last,
    };
  });

  const stats = emptyStats();
  stats.totalConversations = count ?? 0;

  const { data: allAssistant } = await sb
    .from('chatbot_messages')
    .select('response_quality')
    .eq('role', 'assistant');

  stats.totalResponses = allAssistant?.length || 0;
  for (const row of allAssistant ?? []) {
    const qd = (row.response_quality || 'sin_tipo') as ResponseQuality;
    if (qd in stats.byQuality) stats.byQuality[qd]++;
  }

  return NextResponse.json({ ok: true, conversations: result, total: count ?? 0, stats });
}
