# DEPRECATED — use supabase/setup.sql instead (canonical, complete RLS for all 22 tables).
# Viswallet — Supabase RLS Policies
# Apply when enabling cloud sync. All tables are scoped to auth.uid().

-- Enable RLS on all user tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_salaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE emis ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only access their own row
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "profiles_delete_own" ON profiles FOR DELETE USING (auth.uid() = user_id);

-- Transactions: full CRUD scoped to owner
CREATE POLICY "transactions_select_own" ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "transactions_insert_own" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "transactions_update_own" ON transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "transactions_delete_own" ON transactions FOR DELETE USING (auth.uid() = user_id);

-- Repeat pattern for all tables (least privilege — no cross-user access)
-- Service role key MUST NEVER be exposed to the client.
-- Anon key is safe only when every table has RLS enabled and policies verified.

-- Audit logs: insert-only for clients, select own
CREATE POLICY "audit_insert_own" ON audit_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "audit_select_own" ON audit_logs FOR SELECT USING (auth.uid() = user_id);
-- No UPDATE or DELETE on audit logs (immutable trail)
