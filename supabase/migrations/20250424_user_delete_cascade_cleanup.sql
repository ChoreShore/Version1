-- Trigger + function to cascade cleanup when a user is deleted from auth.users.
-- Designed for marketplace integrity: preserves paid job history for workers while
-- removing conversation/review data and anonymising financial records.

CREATE OR REPLACE FUNCTION public.handle_user_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. Messages: conversations without both parties are meaningless
  DELETE FROM public.messages WHERE sender_id = OLD.id OR receiver_id = OLD.id;

  -- 2. Reviews: reviews without both parties are meaningless
  DELETE FROM public.reviews WHERE reviewer_id = OLD.id OR reviewed_user_id = OLD.id;

  -- 3. Transactions: anonymise user_id to preserve audit trail
  UPDATE public.transactions SET user_id = NULL WHERE user_id = OLD.id;

  -- 4. Contracts: null out deleted user's id; delete only if both parties gone
  UPDATE public.contracts SET employer_id = NULL WHERE employer_id = OLD.id;
  UPDATE public.contracts SET worker_id     = NULL WHERE worker_id     = OLD.id;
  DELETE FROM public.contracts WHERE employer_id IS NULL AND worker_id IS NULL;

  -- 5. Applications: remove applications by this worker, and applications for
  --    jobs that are about to be closed by employer deletion
  DELETE FROM public.applications WHERE worker_id = OLD.id;
  DELETE FROM public.applications
  WHERE job_id IN (SELECT id FROM public.jobs WHERE employer_id = OLD.id);

  -- 6. Jobs: soft-close jobs posted by this employer, preserve for worker history
  UPDATE public.jobs
  SET status = 'closed', employer_id = NULL, updated_at = NOW()
  WHERE employer_id = OLD.id;

  -- 7. Profiles: remove the public profile row (auth.users row is already gone)
  DELETE FROM public.profiles WHERE id = OLD.id;

  RETURN OLD;
END;
$$;

-- Attach trigger to auth.users so it fires on ANY deletion path (self-delete,
-- admin action, edge function, etc.).
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
AFTER DELETE ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_user_delete();
