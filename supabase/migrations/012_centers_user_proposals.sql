-- Paso 1/2: nuevo valor de enum (debe ir SOLO en esta migración y confirmarse antes del resto).
-- PostgreSQL no permite usar un enum recién añadido en la misma transacción (55P04).
--
-- Si ejecutas 013 sin haber aplicado ESTE archivo antes, Postgres devuelve:
--   22P02: invalid input value for enum center_status: "pending_review"

ALTER TYPE center_status ADD VALUE IF NOT EXISTS 'pending_review';
