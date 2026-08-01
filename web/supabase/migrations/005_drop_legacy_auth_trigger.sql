-- =============================================================================
-- Fix signup 500 after vault-only migration (004)
-- =============================================================================
-- setup.sql created handle_new_user() → inserts into profiles + app_settings.
-- Migration 004 dropped those tables but the trigger may still run on signup → 500.
-- Run in Supabase SQL Editor if sign-up returns 500.
-- =============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
