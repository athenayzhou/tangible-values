-- create_session — matches src/lib/supabaseClient.js + src/hooks/useGold.js:
--   RPC: create_session({ p_seed_gold })
--   Returns one row: session_id (uuid), balance (int, starting gold)
--
-- Requires:
--   • public.run_sessions: id uuid PK, seed_gold NOT NULL (default 0; dictator “kept” coins come from first settle payout)
--   • public.gold_ledger(session_id, amount, entry_type NOT NULL, …)
--     Scripts use entry_type literals: seed (create_session), stake (start_instance),
--     payout (settle_decision). Edit literals if your enum differs.
--   • public.get_session_gold(uuid) — optional; script inlines the same sum for the return row
--
-- If you cannot rename args on an existing function, DROP the old signature first (42P13).

DROP FUNCTION IF EXISTS public.create_session(integer);
DROP FUNCTION IF EXISTS public.create_session(int);
DROP FUNCTION IF EXISTS public.create_session(numeric);
DROP FUNCTION IF EXISTS public.create_session(); -- if you ever had a zero-arg overload

CREATE FUNCTION public.create_session(p_seed_gold numeric DEFAULT 0)
RETURNS TABLE (
  session_id uuid,
  balance integer
)
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
  new_id uuid := gen_random_uuid();
  seed int := greatest(0, trunc(coalesce(p_seed_gold, 0))::int);
BEGIN
  INSERT INTO public.run_sessions (id, seed_gold)
  VALUES (new_id, seed);

  INSERT INTO public.gold_ledger (session_id, amount, entry_type)
  VALUES (new_id, seed, 'seed');

  RETURN QUERY
  SELECT new_id, seed;
END;
$$;

COMMENT ON FUNCTION public.create_session(numeric) IS
  'Creates run_sessions row + initial gold_ledger credit; returns id and starting balance.';

GRANT EXECUTE ON FUNCTION public.create_session(numeric) TO anon, authenticated, service_role;

-- Optional: if PostgREST still shows an old signature, reload cache after deploy.
NOTIFY pgrst, 'reload schema';

-- -----------------------------------------------------------------------------
-- Minimal DDL (only if tables do not exist yet). Adjust to your migrations.
-- -----------------------------------------------------------------------------
-- CREATE TABLE IF NOT EXISTS public.run_sessions (
--   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
--   created_at timestamptz NOT NULL DEFAULT now(),
--   seed_gold int NOT NULL
-- );
--
-- CREATE TABLE IF NOT EXISTS public.gold_ledger (
--   id bigserial PRIMARY KEY,
--   session_id uuid NOT NULL REFERENCES public.run_sessions (id),
--   amount int NOT NULL,
--   entry_type text NOT NULL, -- or your enum; see start_instance / settle_decision scripts
--   created_at timestamptz NOT NULL DEFAULT now()
-- );
