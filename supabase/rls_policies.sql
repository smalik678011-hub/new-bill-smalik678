-- Row Level Security (RLS) Policies for BillKaro Database

-- 1. Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE profit_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- 2. USERS Policies
CREATE POLICY "Users can read their own user record" ON users
    FOR SELECT TO authenticated
    USING (id = auth.uid());

CREATE POLICY "Users can update their own user record" ON users
    FOR UPDATE TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

CREATE POLICY "Users can insert their own user record" ON users
    FOR INSERT TO authenticated
    WITH CHECK (id = auth.uid());

-- 3. PROFILES Policies
CREATE POLICY "Users can read their own profile details" ON profiles
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own profile details" ON profiles
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own profile details" ON profiles
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own profile details" ON profiles
    FOR DELETE TO authenticated
    USING (user_id = auth.uid());

-- 4. CLIENTS Policies
CREATE POLICY "Users can access their own clients" ON clients
    FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = clients.business_id
          AND profiles.user_id = auth.uid()
    ));

-- 5. QUOTATIONS Policies
CREATE POLICY "Users can access their own quotations" ON quotations
    FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = quotations.business_id
          AND profiles.user_id = auth.uid()
    ));

-- 6. INVOICES Policies
CREATE POLICY "Users can access their own invoices" ON invoices
    FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = invoices.business_id
          AND profiles.user_id = auth.uid()
    ));

-- 7. PROFIT_ENTRIES Policies
CREATE POLICY "Users can access their own profit entries" ON profit_entries
    FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM invoices
        JOIN profiles ON profiles.id = invoices.business_id
        WHERE invoices.id = profit_entries.invoice_id
          AND profiles.user_id = auth.uid()
    ));

-- 8. WORKERS Policies
CREATE POLICY "Users can access their own workers" ON workers
    FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = workers.business_id
          AND profiles.user_id = auth.uid()
    ));

-- 9. ATTENDANCE Policies
CREATE POLICY "Users can access their own attendance records" ON attendance
    FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM workers
        JOIN profiles ON profiles.id = workers.business_id
        WHERE workers.id = attendance.worker_id
          AND profiles.user_id = auth.uid()
    ));

-- 10. EXPENSES Policies
CREATE POLICY "Users can access their own expenses" ON expenses
    FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = expenses.business_id
          AND profiles.user_id = auth.uid()
    ));

-- 11. FIXED_EXPENSES Policies
CREATE POLICY "Users can access their own fixed expenses" ON fixed_expenses
    FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = fixed_expenses.business_id
          AND profiles.user_id = auth.uid()
    ));

-- 12. SUBSCRIPTIONS Policies
CREATE POLICY "Users can access their own subscriptions" ON subscriptions
    FOR ALL TO authenticated
    USING (user_id = auth.uid());
