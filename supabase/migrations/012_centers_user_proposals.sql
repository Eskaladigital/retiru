-- Paso 1/2: nuevo valor de enum (debe ir SOLO en esta migración y confirmarse antes del resto).
-- PostgreSQL no permite usar un enum recién añadido en la misma transacción (55P04).

ALTER TYPE center_status ADD VALUE IF NOT EXISTS 'pending_review';
