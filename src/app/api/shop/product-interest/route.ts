// POST /api/shop/product-interest — guardar valoración o comentario de la encuesta (service role + validación)
import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase, createServerSupabase } from '@/lib/supabase/server';
import { isAllowedShopSurveyCategory } from '@/lib/shop/survey-config';

const MAX_COMMENT = 2000;
const SESSION_ID_REGEX = /^[a-zA-Z0-9_-]{12,128}$/;

function validSessionId(s: unknown): s is string {
  return typeof s === 'string' && SESSION_ID_REGEX.test(s);
}

export async function POST(request: NextRequest) {
  try {
    const admin = createAdminSupabase();
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ code: 'INVALID_BODY' }, { status: 400 });
    }

    const action = body.action === 'comment' ? 'comment' : 'rating';

    if (action === 'rating') {
      const productCategory = typeof body.productCategory === 'string' ? body.productCategory.trim() : '';
      const interestLevel = Number(body.interestLevel);
      if (!isAllowedShopSurveyCategory(productCategory)) {
        return NextResponse.json({ code: 'INVALID_CATEGORY' }, { status: 400 });
      }
      if (!Number.isInteger(interestLevel) || interestLevel < 1 || interestLevel > 5) {
        return NextResponse.json({ code: 'INVALID_LEVEL' }, { status: 400 });
      }

      if (user) {
        const { data: existing, error: qErr } = await admin
          .from('shop_product_interests')
          .select('id')
          .eq('user_id', user.id)
          .eq('product_category', productCategory)
          .maybeSingle();
        if (qErr) {
          console.error('shop interest select (user):', qErr);
          return NextResponse.json({ code: 'SAVE_FAILED' }, { status: 500 });
        }
        if (existing?.id) {
          const { error } = await admin
            .from('shop_product_interests')
            .update({ interest_level: interestLevel })
            .eq('id', existing.id);
          if (error) {
            console.error('shop interest update (user):', error);
            return NextResponse.json({ code: 'SAVE_FAILED' }, { status: 500 });
          }
        } else {
          const { error } = await admin.from('shop_product_interests').insert({
            user_id: user.id,
            session_id: null,
            product_category: productCategory,
            interest_level: interestLevel,
            comments: null,
          });
          if (error) {
            console.error('shop interest insert (user):', error);
            return NextResponse.json({ code: 'SAVE_FAILED' }, { status: 500 });
          }
        }
      } else {
        const sessionId = body.sessionId;
        if (!validSessionId(sessionId)) {
          return NextResponse.json({ code: 'INVALID_SESSION' }, { status: 400 });
        }
        const { data: existing, error: qErr } = await admin
          .from('shop_product_interests')
          .select('id')
          .eq('session_id', sessionId)
          .eq('product_category', productCategory)
          .maybeSingle();
        if (qErr) {
          console.error('shop interest select (anon):', qErr);
          return NextResponse.json({ code: 'SAVE_FAILED' }, { status: 500 });
        }
        if (existing?.id) {
          const { error } = await admin
            .from('shop_product_interests')
            .update({ interest_level: interestLevel })
            .eq('id', existing.id);
          if (error) {
            console.error('shop interest update (anon):', error);
            return NextResponse.json({ code: 'SAVE_FAILED' }, { status: 500 });
          }
        } else {
          const { error } = await admin.from('shop_product_interests').insert({
            user_id: null,
            session_id: sessionId,
            product_category: productCategory,
            interest_level: interestLevel,
            comments: null,
          });
          if (error) {
            console.error('shop interest insert (anon):', error);
            return NextResponse.json({ code: 'SAVE_FAILED' }, { status: 500 });
          }
        }
      }

      return NextResponse.json({ ok: true });
    }

    // comment: replica el texto en todas las filas ya guardadas de esta sesión / usuario
    const raw =
      typeof body.comment === 'string'
        ? body.comment.trim().slice(0, MAX_COMMENT)
        : '';
    if (!raw) {
      return NextResponse.json({ code: 'EMPTY_COMMENT' }, { status: 400 });
    }

    if (user) {
      const { data: rows, error: selErr } = await admin
        .from('shop_product_interests')
        .select('id')
        .eq('user_id', user.id)
        .limit(500);
      if (selErr) {
        console.error('shop interest comment (user select):', selErr);
        return NextResponse.json({ code: 'SAVE_FAILED' }, { status: 500 });
      }
      if (!rows?.length) {
        return NextResponse.json({ code: 'COMMENT_NEED_RATING' }, { status: 400 });
      }
      const { error } = await admin.from('shop_product_interests').update({ comments: raw }).eq('user_id', user.id);
      if (error) {
        console.error('shop interest comment (user update):', error);
        return NextResponse.json({ code: 'SAVE_FAILED' }, { status: 500 });
      }
    } else {
      const sessionId = body.sessionId;
      if (!validSessionId(sessionId)) {
        return NextResponse.json({ code: 'INVALID_SESSION' }, { status: 400 });
      }
      const { data: rows, error: selErr } = await admin
        .from('shop_product_interests')
        .select('id')
        .eq('session_id', sessionId)
        .limit(500);
      if (selErr) {
        console.error('shop interest comment (anon select):', selErr);
        return NextResponse.json({ code: 'SAVE_FAILED' }, { status: 500 });
      }
      if (!rows?.length) {
        return NextResponse.json({ code: 'COMMENT_NEED_RATING' }, { status: 400 });
      }
      const { error } = await admin.from('shop_product_interests').update({ comments: raw }).eq('session_id', sessionId);
      if (error) {
        console.error('shop interest comment (anon update):', error);
        return NextResponse.json({ code: 'SAVE_FAILED' }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    console.error('POST /api/shop/product-interest', e);
    return NextResponse.json({ code: 'INTERNAL' }, { status: 500 });
  }
}
