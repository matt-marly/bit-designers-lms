-- Fix search_path mutable warning and lock down
-- direct execution of the security definer function

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    'learner'
  );
  RETURN new;
END;
$$;

-- Revoke direct execution — only the trigger
-- should invoke this function
REVOKE EXECUTE ON FUNCTION public.handle_new_user()
  FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user()
  FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user()
  FROM anon;
