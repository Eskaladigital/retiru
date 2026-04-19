-- ============================================================================
-- 040 · Soft-clear de la conversación de soporte por parte del usuario
-- ============================================================================
-- Permite que el usuario "cierre" visualmente su chat de soporte sin borrar
-- nada en BD: el admin sigue viendo el historial completo en /administrator/mensajes.
-- El widget y el endpoint GET filtran los mensajes con created_at <= user_cleared_at.
-- Se reutiliza la misma conversación (el índice único idx_conv_support_user sigue vigente);
-- al volver a abrir el chat, el usuario ve un estado vacío con saludo + quick replies.

ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS user_cleared_at TIMESTAMPTZ NULL;

COMMENT ON COLUMN conversations.user_cleared_at IS
  'Fecha a partir de la cual el propietario (user_id) ha "cerrado" la conversación. '
  'Si no es NULL, el propio usuario solo ve mensajes con created_at > user_cleared_at. '
  'Admins y organizadores ven el historial completo.';
